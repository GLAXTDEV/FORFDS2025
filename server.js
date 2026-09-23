const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const app = express();
const port = Number(process.env.PORT || 3000);
const databasePath = process.env.DB_PATH || path.join(__dirname, 'message.sqlite');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new sqlite3.Database(databasePath);

// Code secret permettant de devenir le créateur (peut être surchargé par l'environnement).
const OWNER_CODE = process.env.OWNER_CODE || 'codeglaxt2516@';
// Origines autorisées (front séparé).
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(origin => origin.trim()).filter(Boolean);

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 1 an (identité liée à l'appareil)
const MAX_AVATAR_LENGTH = 400000; // ~300 Ko d'image réelle
const MAX_IMAGE_LENGTH = 1500000; // ~1 Mo d'image réelle
const MAX_MESSAGES_RETURNED = 200;

// Derrière un proxy (Railway, etc.), faire confiance à X-Forwarded-For pour obtenir l'IP réelle.
app.set('trust proxy', true);
app.use(express.json({ limit: '4mb' }));
app.use(express.static(__dirname));
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin))) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

db.on('error', error => {
    console.error('Erreur SQLite :', error.message);
});

/* ------------------------------------------------------------------ *
 * Schéma                                                              *
 * ------------------------------------------------------------------ */
db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    banned INTEGER NOT NULL DEFAULT 0,
    deleted INTEGER NOT NULL DEFAULT 0,
    ip TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
)`);
db.run(`CREATE TABLE IF NOT EXISTS image_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    mime TEXT NOT NULL,
    created_at TEXT NOT NULL
)`);
db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    image_id INTEGER,
    role_snapshot TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(image_id) REFERENCES image_cache(id) ON DELETE SET NULL
)`);
db.run('CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)', () => {
    db.run("INSERT INTO app_settings (key, value) SELECT 'messaging_locked', '0' WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'messaging_locked')");
});
// Adresses IP bannies (survit à la suppression/réinitialisation d'un appareil).
db.run('CREATE TABLE IF NOT EXISTS ip_bans (ip TEXT PRIMARY KEY, reason TEXT DEFAULT \'\', created_at TEXT NOT NULL)');
// Colonne ip ajoutée aux bases existantes (ignoree si deja presente).
db.run("ALTER TABLE users ADD COLUMN ip TEXT DEFAULT ''", () => {});

/**
 * Migration : l'ancienne messagerie utilisait une table `messages` incompatible.
 * Si on la detecte, on l'archive pour laisser la nouvelle table se creer proprement.
 */
db.all('PRAGMA table_info(messages)', (error, columns) => {
    if (error || !columns || !columns.length) return;
    const names = columns.map(column => column.name);
    const isLegacy = names.includes('name') || names.includes('role') || !names.includes('role_snapshot');
    if (!isLegacy) return;
    db.run('ALTER TABLE messages RENAME TO messages_legacy', migrationError => {
        if (migrationError) return console.error('Migration messages impossible :', migrationError.message);
        console.warn('Ancienne table messages archivee sous messages_legacy.');
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            text TEXT NOT NULL DEFAULT '',
            image_id INTEGER,
            role_snapshot TEXT NOT NULL DEFAULT 'user',
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(image_id) REFERENCES image_cache(id) ON DELETE SET NULL
        )`);
    });
});

/**
 * Migration : la premiere version stockait les comptes Google (google_sub/email).
 * Si on detecte ce schema, on archive la table users pour repartir sur une
 * identite liee a l'appareil (device_id).
 */
db.all('PRAGMA table_info(users)', (error, columns) => {
    if (error || !columns || !columns.length) return;
    const names = columns.map(column => column.name);
    if (names.includes('device_id')) return;
    db.run('ALTER TABLE users RENAME TO users_legacy', migrationError => {
        if (migrationError) return console.error('Migration users impossible :', migrationError.message);
        console.warn('Ancienne table users archivee sous users_legacy.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            avatar TEXT DEFAULT '',
            role TEXT NOT NULL DEFAULT 'user',
            banned INTEGER NOT NULL DEFAULT 0,
            deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL
        )`);
    });
});

function cleanText(value, maxLength) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

/** Extrait l'adresse IP réelle du client (derrière un proxy : X-Forwarded-For). */
function clientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return String(forwarded).split(',')[0].trim().slice(0, 64);
    return cleanText(req.ip || (req.socket && req.socket.remoteAddress), 64) || 'inconnue';
}

/**
 * Vérifie qu'une IP n'est pas bannie. Renvoie une promesse qui résout
 * { banned: boolean }. Utilise la table ip_bans.
 */
function isIpBanned(ip) {
    return new Promise((resolve, reject) => {
        db.get('SELECT ip FROM ip_bans WHERE ip = ?', [ip], (error, row) => error ? reject(error) : resolve(Boolean(row)));
    });
}

/** Bannit une IP (idempotent). */
function banIp(ip, reason, callback) {
    if (!ip) return callback();
    db.run('INSERT OR REPLACE INTO ip_bans (ip, reason, created_at) VALUES (?, ?, ?)', [ip, reason || '', nowIso()], callback || (() => {}));
}

/** Lève le bannissement d'une IP. */
function unbanIp(ip, callback) {
    db.run('DELETE FROM ip_bans WHERE ip = ?', [ip], callback || (() => {}));
}

function nowIso() {
    return new Date().toISOString();
}

function setting(key, fallback, callback) {
    db.get('SELECT value FROM app_settings WHERE key = ?', [key], (error, row) => callback(error, row ? row.value : fallback));
}

function setSetting(key, value, callback) {
    db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, String(value)], callback || (() => {}));
}

/**
 * Valide une image en data URL. Renvoie { ok, data, mime, tooLarge }.
 * On refuse tout ce qui n'est pas une image PNG/JPEG/WEBP/GIF ou dépasse la taille.
 */
function validateImage(value, maxLength) {
    if (!value) return { ok: true, data: '', mime: '' };
    if (typeof value !== 'string') return { ok: false };
    const match = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(value);
    if (!match) return { ok: false };
    if (value.length > maxLength) return { ok: false, tooLarge: true };
    return { ok: true, mime: match[1], data: match[2] };
}

/* ------------------------------------------------------------------ *
 * Identité liée à l'appareil & rôles                                  *
 * ------------------------------------------------------------------ */
/** Cherche un utilisateur par son identifiant d'appareil. */
function findUserByDevice(deviceId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE device_id = ?', [deviceId], (error, row) => error ? reject(error) : resolve(row || null));
    });
}

function findUserById(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [userId], (error, row) => error ? reject(error) : resolve(row || null));
    });
}

function createSession(deviceId, callback) {
    const token = crypto.randomBytes(32).toString('hex');
    db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [`session:${token}`, JSON.stringify({ deviceId, expiresAt: Date.now() + SESSION_TTL_MS })], error => callback(error, token));
}

function readSession(req) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return Promise.resolve(null);
    return new Promise(resolve => {
        db.get('SELECT value FROM app_settings WHERE key = ?', [`session:${token}`], (error, row) => {
            if (error || !row) return resolve(null);
            let session;
            try { session = JSON.parse(row.value); } catch { return resolve(null); }
            if (!session.expiresAt || session.expiresAt < Date.now()) return resolve(null);
            resolve(session);
        });
    });
}

/**
 * Récupère l'utilisateur à partir du bearer token (session liée à l'appareil).
 * Renvoie l'utilisateur même s'il est banni ou supprimé (pour pouvoir répondre
 * avec un message clair), mais jamais null sauf identité inconnue.
 */
function authenticate(req) {
    return readSession(req).then(session => {
        if (!session) return null;
        return findUserByDevice(session.deviceId).then(user => {
            if (!user) return null;
            db.run('UPDATE users SET last_seen_at = ? WHERE id = ?', [nowIso(), user.id], () => {});
            return user;
        });
    });
}

function requireAuth(requireRole) {
    return (req, res, next) => {
        const ip = clientIp(req);
        isIpBanned(ip).then(ipBanned => {
            if (ipBanned) return res.status(403).json({ error: 'Votre adresse IP a été bloquée par le créateur.' });
            return authenticate(req).then(user => {
                if (!user) return res.status(401).json({ error: 'Identité inconnue : enregistrez votre nom pour discuter.' });
                if (user.deleted) return res.status(403).json({ error: 'Votre accès a été supprimé par le créateur.' });
                if (requireRole === 'owner' && user.role !== 'owner') return res.status(403).json({ error: 'Réservé au créateur.' });
                if (requireRole === 'staff' && user.role !== 'owner' && user.role !== 'admin') return res.status(403).json({ error: 'Réservé aux administrateurs.' });
                req.user = user;
                next();
            });
        }).catch(() => res.status(500).json({ error: 'Erreur d’authentification.' }));
    };
}

function publicUser(user, viewer) {
    const data = {
        id: user.id,
        deviceId: user.device_id,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        banned: Boolean(user.banned),
        deleted: Boolean(user.deleted)
    };
    // L'identifiant d'appareil n'est visible que par le créateur.
    if (!viewer || viewer.role !== 'owner') delete data.deviceId;
    return data;
}

function currentStaff(callback) {
    db.all("SELECT id, name, avatar, role FROM users WHERE role IN ('owner','admin') AND deleted = 0", (error, rows) => {
        if (error) return callback(error);
        callback(null, (rows || []).map(row => ({ id: row.id, name: row.name, avatar: row.avatar, role: row.role })));
    });
}

/* ------------------------------------------------------------------ *
 * API publique                                                        *
 * ------------------------------------------------------------------ */
app.get('/api/config', (req, res) => {
    setting('messaging_locked', '0', (error, locked) => {
        if (error) return res.status(500).json({ error: 'Configuration indisponible.' });
        res.json({ locked: locked === '1' });
    });
});

/**
 * Identité : le client envoie un identifiant d'appareil (deviceId) généré et
 * conservé localement. On crée la fiche au premier passage, puis on ouvre une
 * session liée à cet appareil.
 */
app.post('/api/identity', (req, res) => {
    const deviceId = cleanText(req.body && req.body.deviceId, 80);
    if (!deviceId) return res.status(400).json({ error: 'Identifiant d’appareil manquant.' });
    const name = cleanText(req.body.name, 40);
    const ip = clientIp(req);

    isIpBanned(ip).then(banned => {
    if (banned) return res.status(403).json({ error: 'Votre adresse IP a été bloquée par le créateur.' });
    findUserByDevice(deviceId).then(existing => {
        if (existing) {
            if (existing.deleted) return res.status(403).json({ error: 'Votre accès a été supprimé par le créateur.' });
            db.run('UPDATE users SET ip = ? WHERE id = ?', [ip, existing.id], () => {});
            return createSession(deviceId, (error, token) => {
                if (error) return res.status(500).json({ error: 'Session impossible.' });
                findUserById(existing.id).then(user => res.json({ token, user: publicUser(user, user) }));
            });
        }
        db.get('SELECT COUNT(*) AS total FROM users WHERE deleted = 0', (countError, countRow) => {
            if (countError) return res.status(500).json({ error: 'Enregistrement impossible.' });
            const role = (countRow ? countRow.total : 0) === 0 ? 'owner' : 'user';
            const createdAt = nowIso();
            const finalName = name || 'Invité';
            db.run('INSERT INTO users (device_id, name, avatar, role, banned, deleted, created_at, last_seen_at) VALUES (?, ?, ?, ?, 0, 0, ?, ?)',
                [deviceId, finalName, '', role, createdAt, createdAt], function (insertError) {
                    if (insertError) return res.status(500).json({ error: 'Enregistrement impossible.' });
                    db.run('UPDATE users SET ip = ? WHERE id = ?', [ip, this.lastID], () => {});
                    findUserById(this.lastID).then(user => createSession(deviceId, (error, token) => {
                        if (error) return res.status(500).json({ error: 'Session impossible.' });
                        res.json({ token, user: publicUser(user, user) });
                    }));
                });
        });
    });
    }).catch(() => res.status(500).json({ error: 'Identité impossible.' }));
});

/** Vérifie une session encore valide au chargement de la page. */
app.get('/api/auth/me', (req, res) => {
    authenticate(req).then(user => {
        if (!user) return res.status(401).json({ error: 'Session expirée.' });
        setting('messaging_locked', '0', (error, locked) => {
            res.json({
                user: publicUser(user, user),
                locked: locked === '1',
                banned: Boolean(user.banned),
                deleted: Boolean(user.deleted)
            });
        });
    }).catch(() => res.status(500).json({ error: 'Erreur de session.' }));
});

/**
 * Demande du code créateur : si le code est correct, l'appareil courant devient
 * le créateur. Comme il ne peut y avoir qu'un seul créateur, on refuse si un
 * autre appareil détient déjà ce rôle.
 */
app.post('/api/owner/claim', requireAuth(), (req, res) => {
    const code = cleanText(req.body && req.body.code, 100);
    if (!code || code !== OWNER_CODE) return res.status(403).json({ error: 'Code créateur incorrect.' });
    db.get("SELECT id FROM users WHERE role = 'owner' AND deleted = 0", (error, row) => {
        if (error) return res.status(500).json({ error: 'Vérification impossible.' });
        if (row && row.id !== req.user.id) return res.status(409).json({ error: 'Un créateur existe déjà sur un autre appareil.' });
        db.run("UPDATE users SET role = 'owner' WHERE id = ?", [req.user.id], updateError => {
            if (updateError) return res.status(500).json({ error: 'Promotion impossible.' });
            findUserById(req.user.id).then(user => res.json({ user: publicUser(user, user) }));
        });
    });
});

app.post('/api/auth/logout', (req, res) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return res.json({ ok: true });
    db.run('DELETE FROM app_settings WHERE key = ?', [`session:${token}`], () => res.json({ ok: true }));
});

/** Met à jour le profil : nom affiché + photo (data URL data:image/...). */
app.post('/api/profile', requireAuth(), (req, res) => {
    const name = cleanText(req.body.name, 40);
    if (!name) return res.status(400).json({ error: 'Choisissez un nom.' });
    const avatar = req.body.avatar || '';
    const image = validateImage(avatar, MAX_AVATAR_LENGTH);
    if (!image.ok) return res.status(400).json({ error: image.tooLarge ? 'La photo doit peser moins de 300 Ko.' : 'Format d’image non supporté.' });
    const storedAvatar = avatar && avatar.startsWith('data:') ? avatar : cleanText(avatar, 500);
    db.run('UPDATE users SET name = ?, avatar = ? WHERE id = ?', [name, storedAvatar, req.user.id], error => {
        if (error) return res.status(500).json({ error: 'Enregistrement impossible.' });
        findUserById(req.user.id).then(user => res.json({ user: publicUser(user, user) }));
    });
});

/** Supprime sa propre photo de profil. */
app.post('/api/profile/avatar/remove', requireAuth(), (req, res) => {
    db.run('UPDATE users SET avatar = ? WHERE id = ?', ['', req.user.id], error => {
        if (error) return res.status(500).json({ error: 'Suppression impossible.' });
        findUserById(req.user.id).then(user => res.json({ user: publicUser(user, user) }));
    });
});

/* ------------------------------------------------------------------ *
 * Messagerie                                                          *
 * ------------------------------------------------------------------ */
app.get('/api/messages', requireAuth(), (req, res) => {
    const viewer = req.user;
    setting('messaging_locked', '0', (settingError, locked) => {
        if (settingError) return res.status(500).json({ error: 'Impossible de charger la messagerie.' });
        db.all(`SELECT m.id, m.text, m.image_id AS imageId, m.role_snapshot AS roleSnapshot, m.created_at AS createdAt,
                       u.id AS userId, u.name, u.avatar, u.role AS currentRole,
                       c.data AS imageData, c.mime AS imageMime
                FROM messages m
                JOIN users u ON u.id = m.user_id
                LEFT JOIN image_cache c ON c.id = m.image_id
                ORDER BY m.id ASC LIMIT ?`, [MAX_MESSAGES_RETURNED], (error, rows) => {
            if (error) return res.status(500).json({ error: 'Impossible de charger les messages.' });
            const messages = rows.map(row => ({
                id: row.id,
                userId: row.userId,
                name: row.name,
                avatar: row.avatar,
                text: row.text || '',
                image: row.imageData ? `data:${row.imageMime};base64,${row.imageData}` : '',
                role: row.currentRole,
                createdAt: row.createdAt,
                isMine: row.userId === viewer.id
            }));
            currentStaff((staffError, staff) => {
                if (staffError) return res.status(500).json({ error: 'Impossible de charger les rôles.' });
                res.json({ locked: locked === '1', banned: Boolean(viewer.banned), me: publicUser(viewer, viewer), messages, staff });
            });
        });
    });
});

/** Envoi d'un message : soit du texte, soit une image (jamais les deux). */
app.post('/api/messages', requireAuth(), (req, res) => {
    const viewer = req.user;
    if (viewer.banned) return res.status(403).json({ error: 'Votre accès à la messagerie a été bloqué.' });
    setting('messaging_locked', '0', (settingError, locked) => {
        if (settingError) return res.status(500).json({ error: 'Impossible de vérifier la messagerie.' });
        if (locked === '1' && viewer.role !== 'owner') return res.status(423).json({ error: 'La messagerie est verrouillée par l’administration.' });
        const text = cleanText(req.body.text, 1000);
        const rawImage = req.body.image || '';
        const image = validateImage(rawImage, MAX_IMAGE_LENGTH);
        if (text && rawImage) return res.status(400).json({ error: 'Envoyez soit un texte, soit une image, pas les deux.' });
        if (!text && !rawImage) return res.status(400).json({ error: 'Le message est vide.' });
        if (rawImage && !image.ok) return res.status(400).json({ error: image.tooLarge ? 'L’image est trop volumineuse (1 Mo maximum).' : 'Format d’image non supporté.' });
        const createdAt = nowIso();

        const insert = imageId => {
            db.run('INSERT INTO messages (user_id, text, image_id, role_snapshot, created_at) VALUES (?, ?, ?, ?, ?)',
                [viewer.id, text, imageId, viewer.role, createdAt], function (error) {
                    if (error) return res.status(500).json({ error: 'Impossible d’enregistrer le message.' });
                    res.status(201).json({
                        id: this.lastID, userId: viewer.id, name: viewer.name,
                        avatar: viewer.avatar, text, image: rawImage, role: viewer.role, createdAt, isMine: true
                    });
                });
        };

        if (!image.data) return insert(null);
        db.run('INSERT INTO image_cache (data, mime, created_at) VALUES (?, ?, ?)', [image.data, image.mime, createdAt], function (error) {
            if (error) return res.status(500).json({ error: 'Impossible d’enregistrer l’image.' });
            insert(this.lastID);
        });
    });
});

/** Le créateur peut supprimer n'importe quel message. */
app.delete('/api/messages/:id', requireAuth('owner'), (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Message invalide.' });
    db.run('DELETE FROM messages WHERE id = ?', [id], error => {
        if (error) return res.status(500).json({ error: 'Suppression impossible.' });
        res.json({ ok: true });
    });
});

/* ------------------------------------------------------------------ *
 * Administration                                                      *
 * ------------------------------------------------------------------ */
app.get('/api/admin/state', requireAuth('staff'), (req, res) => {
    const viewer = req.user;
    setting('messaging_locked', '0', (error, locked) => {
        if (error) return res.status(500).json({ error: 'Impossible de lire l’état.' });
        db.all(`SELECT id, device_id AS deviceId, name, avatar, role, banned, deleted, ip, created_at AS createdAt, last_seen_at AS lastSeenAt
                FROM users ORDER BY created_at ASC`, (usersError, users) => {
            if (usersError) return res.status(500).json({ error: 'Impossible de lire les comptes.' });
            const accounts = (users || [])
                .filter(user => viewer.role === 'owner' || (user.role !== 'owner' && !user.deleted))
                .map(user => ({
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    role: user.role,
                    banned: Boolean(user.banned),
                    deleted: Boolean(user.deleted),
                    // L'identifiant d'appareil et l'IP ne sont visibles que par le créateur.
                    deviceId: viewer.role === 'owner' ? user.deviceId : undefined,
                    ip: viewer.role === 'owner' ? user.ip : undefined,
                    createdAt: user.createdAt,
                    lastSeenAt: user.lastSeenAt,
                    isMe: user.id === viewer.id
                }));
            db.all('SELECT ip, reason, created_at AS createdAt FROM ip_bans ORDER BY created_at DESC', (bansError, banRows) => {
                const ipBans = viewer.role === 'owner' ? (banRows || []).map(row => ({ ip: row.ip, reason: row.reason, createdAt: row.createdAt })) : [];
                res.json({ me: publicUser(viewer, viewer), locked: locked === '1', accounts, ipBans });
            });
        });
    });
});

/**
 * Actions admin :
 *  - créateur : promote, demote, ban, unban, deleteUser, restoreUser, lock, unlock
 *  - admin    : ban, unban uniquement
 *  - personne ne peut toucher au compte du créateur.
 *
 * « deleteUser » marque le compte comme supprimé (deleted = 1) : l'appareil
 * concerné ne pourra plus jamais écrire, même s'il revient sur le site.
 */
app.post('/api/admin/action', requireAuth('staff'), (req, res) => {
    const viewer = req.user;
    const action = cleanText(req.body.action, 30);
    const targetId = Number(req.body.targetUserId);
    const isOwner = viewer.role === 'owner';
    const ownerOnly = ['promote', 'demote', 'deleteUser', 'restoreUser', 'lock', 'unlock', 'banIp', 'unbanIp'];
    const staffActions = ['ban', 'unban'];
    if (![...ownerOnly, ...staffActions].includes(action)) return res.status(400).json({ error: 'Action inconnue.' });
    if (!isOwner && !staffActions.includes(action)) return res.status(403).json({ error: 'Seul le créateur peut effectuer cette action.' });

    if (action === 'lock' || action === 'unlock') {
        return setSetting('messaging_locked', action === 'lock' ? '1' : '0', error =>
            error ? res.status(500).json({ error: 'Action impossible.' }) : res.json({ ok: true }));
    }

    // Gestion directe d'une adresse IP (le créateur peut saisir une IP).
    if (action === 'banIp' || action === 'unbanIp') {
        const ip = cleanText(req.body.ip, 64);
        if (!ip) return res.status(400).json({ error: 'Adresse IP obligatoire.' });
        return (action === 'banIp' ? banIp(ip, 'Manuel', cb) : unbanIp(ip, cb));
        function cb(error) { return error ? res.status(500).json({ error: 'Action impossible.' }) : res.json({ ok: true }); }
    }

    if (!Number.isInteger(targetId)) return res.status(400).json({ error: 'Compte cible invalide.' });

    findUserById(targetId).then(target => {
        if (!target) return res.status(404).json({ error: 'Compte introuvable.' });
        if (target.role === 'owner') return res.status(403).json({ error: 'Le compte du créateur est protégé.' });
        if (action === 'promote') {
            if (target.banned) return res.status(400).json({ error: 'Débannissez ce compte avant de le nommer administrateur.' });
            if (target.deleted) return res.status(400).json({ error: 'Ce compte est supprimé.' });
            return db.run("UPDATE users SET role = 'admin' WHERE id = ?", [targetId], error =>
                error ? res.status(500).json({ error: 'Promotion impossible.' }) : res.json({ ok: true }));
        }
        if (action === 'demote') {
            return db.run("UPDATE users SET role = 'user' WHERE id = ?", [targetId], error =>
                error ? res.status(500).json({ error: 'Rétrogradation impossible.' }) : res.json({ ok: true }));
        }
        if (action === 'ban' || action === 'unban') {
            return db.run('UPDATE users SET banned = ? WHERE id = ?', [action === 'ban' ? 1 : 0, targetId], error =>
                error ? res.status(500).json({ error: 'Action impossible.' }) : res.json({ ok: true }));
        }
        if (action === 'deleteUser') {
            // Supprime l'appareil ET bannit son IP : bloque toute tentative ultérieure.
            return db.run("UPDATE users SET deleted = 1, banned = 1, role = 'user' WHERE id = ?", [targetId], error => {
                if (error) return res.status(500).json({ error: 'Suppression impossible.' });
                if (target.ip) return banIp(target.ip, 'Appareil supprimé', () => res.json({ ok: true }));
                res.json({ ok: true });
            });
        }
        if (action === 'restoreUser') {
            return db.run('UPDATE users SET deleted = 0 WHERE id = ?', [targetId], error =>
                error ? res.status(500).json({ error: 'Restauration impossible.' }) : res.json({ ok: true }));
        }
        res.status(400).json({ error: 'Action inconnue.' });
    }).catch(() => res.status(500).json({ error: 'Action impossible.' }));
});

/* ------------------------------------------------------------------ *
 * Démarrage                                                           *
 * ------------------------------------------------------------------ */
app.get('/healthz', (req, res) => res.json({ ok: true }));

app.listen(port, '0.0.0.0', () => {
    console.log(`Le serveur est allumé sur le port ${port}`);
    console.log(`Base SQLite : ${databasePath}`);
    if (!OWNER_CODE) console.warn('Aucun code créateur configuré (OWNER_CODE).');
    console.log('En attente de messages des étudiants...');
});