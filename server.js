const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');
const app = express();
const port = Number(process.env.PORT || 3000);
const databasePath = process.env.DB_PATH || path.join(__dirname, 'message.sqlite');
const db = new sqlite3.Database(databasePath);
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(origin => origin.trim()).filter(Boolean);

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin))) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, X-User-Id, X-Admin-Key, X-Admin-Session');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Créer la table au démarrage
db.run("CREATE TABLE IF NOT EXISTS discussions (id INTEGER PRIMARY KEY AUTOINCREMENT, contenu TEXT)");
db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    role TEXT DEFAULT ''
)`);
db.run("ALTER TABLE messages ADD COLUMN role TEXT DEFAULT ''", () => {});
db.run('CREATE TABLE IF NOT EXISTS user_controls (user_id TEXT PRIMARY KEY, banned INTEGER NOT NULL DEFAULT 0)');
db.run('CREATE TABLE IF NOT EXISTS administrators (user_id TEXT PRIMARY KEY, role TEXT NOT NULL DEFAULT \'admin\')');
db.run('CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');

function cleanText(value, maxLength) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validAvatar(value) {
    if (!value) return true;
    if (value.startsWith('data:image/')) return value.length <= 700000;
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function adminIdentity(req) {
    const userId = cleanText(req.headers['x-user-id'], 100);
    const sessionToken = cleanText(req.headers['x-admin-session'], 200);
    return new Promise((resolve, reject) => {
        db.get('SELECT value FROM app_settings WHERE key = ?', ['primary_admin_session'], (sessionError, row) => {
            if (sessionError) return reject(sessionError);
            if (row) {
                try {
                    const session = JSON.parse(row.value);
                    if (session.userId === userId && session.token === sessionToken) return resolve({ userId, role: 'primary' });
                } catch {}
            }
            db.get('SELECT role FROM administrators WHERE user_id = ?', [userId], (error, adminRow) => {
                if (error) return reject(error);
                resolve(adminRow ? { userId, role: adminRow.role } : null);
            });
        });
    });
}

function requireAdmin(req, res, callback) {
    adminIdentity(req).then(identity => {
        if (!identity) return res.status(403).json({ error: 'Accès administrateur refusé.' });
        callback(identity);
    }).catch(() => res.status(500).json({ error: 'Erreur d’authentification administrateur.' }));
}

function setting(key, fallback, callback) {
    db.get('SELECT value FROM app_settings WHERE key = ?', [key], (error, row) => callback(error, row ? row.value : fallback));
}

function currentAdministrators(callback) {
    setting('primary_user_id', '', (settingError, primaryUserId) => {
        if (settingError) return callback(settingError);
        db.all('SELECT user_id AS userId, role FROM administrators', (adminError, admins) => {
            if (adminError) return callback(adminError);
            db.all('SELECT user_id AS userId, name, avatar FROM messages WHERE id IN (SELECT MAX(id) FROM messages GROUP BY user_id)', (profileError, profiles) => {
                if (profileError) return callback(profileError);
                const profileMap = new Map(profiles.map(profile => [profile.userId, profile]));
                const directory = [];
                if (primaryUserId) {
                    const profile = profileMap.get(primaryUserId) || {};
                    directory.push({ userId: primaryUserId, name: profile.name || 'Administrateur principal', avatar: profile.avatar || '', role: 'primary' });
                }
                admins.forEach(admin => {
                    if (admin.userId === primaryUserId) return;
                    const profile = profileMap.get(admin.userId) || {};
                    directory.push({ userId: admin.userId, name: profile.name || 'Administrateur', avatar: profile.avatar || '', role: 'admin' });
                });
                callback(null, directory);
            });
        });
    });
}

app.get('/api/messages', (req, res) => {
    setting('messaging_locked', '0', (settingError, locked) => {
        if (settingError) return res.status(500).json({ error: 'Impossible de charger la messagerie.' });
        db.all('SELECT id, user_id AS userId, name, avatar, text, created_at AS createdAt, role FROM messages ORDER BY id ASC LIMIT 200', (error, rows) => {
            if (error) return res.status(500).json({ error: 'Impossible de charger les messages.' });
            const requesterId = cleanText(req.headers['x-user-id'], 100);
            db.get('SELECT banned FROM user_controls WHERE user_id = ?', [requesterId], (banError, control) => {
                if (banError) return res.status(500).json({ error: 'Impossible de vérifier l’accès utilisateur.' });
                adminIdentity(req).then(identity => {
                    currentAdministrators((directoryError, administrators) => {
                        if (directoryError) return res.status(500).json({ error: 'Impossible de charger les rôles.' });
                        const roleMap = new Map(administrators.map(admin => [admin.userId, admin.role]));
                        const messages = rows.map(row => {
                        const safeMessage = { ...row, isMine: row.userId === requesterId };
                            safeMessage.role = roleMap.get(row.userId) || '';
                        if (!identity) delete safeMessage.userId;
                        return safeMessage;
                    });
                        const publicAdministrators = administrators.map(admin => identity ? admin : { name: admin.name, avatar: admin.avatar, role: admin.role });
                        res.json({ locked: locked === '1', banned: Boolean(control && control.banned), messages, administrators: publicAdministrators });
                    });
                }).catch(() => res.status(500).json({ error: 'Impossible de sécuriser les messages.' }));
            });
        });
    });
});

app.post('/api/messages', (req, res) => {
    const userId = cleanText(req.body.userId, 100);
    const name = cleanText(req.body.name, 40);
    const avatar = cleanText(req.body.avatar, 700000);
    const text = cleanText(req.body.text, 1000);
    if (!userId || !name || !text) return res.status(400).json({ error: 'Le profil et le message sont obligatoires.' });
    if (!validAvatar(avatar)) return res.status(400).json({ error: 'L’URL de la photo est invalide.' });
    setting('messaging_locked', '0', (settingError, locked) => {
        if (settingError) return res.status(500).json({ error: 'Impossible de vérifier la messagerie.' });
        if (locked === '1') return res.status(423).json({ error: 'La messagerie est verrouillée par l’administration.' });
        db.get('SELECT banned FROM user_controls WHERE user_id = ?', [userId], (banError, control) => {
            if (banError) return res.status(500).json({ error: 'Impossible de vérifier le profil.' });
            if (control && control.banned) return res.status(403).json({ error: 'Ce profil est banni.' });
            const createdAt = new Date().toISOString();
            db.get("SELECT 'primary' AS role FROM app_settings WHERE key = 'primary_user_id' AND value = ? UNION ALL SELECT role FROM administrators WHERE user_id = ? LIMIT 1", [userId, userId], (roleError, roleRow) => {
                const role = roleError ? '' : (roleRow && roleRow.role ? roleRow.role : '');
                db.run('INSERT INTO messages (user_id, name, avatar, text, created_at, role) VALUES (?, ?, ?, ?, ?, ?)', [userId, name, avatar, text, createdAt, role], function (error) {
                if (error) return res.status(500).json({ error: 'Impossible d’enregistrer le message.' });
                res.status(201).json({ id: this.lastID, userId, name, avatar, text, createdAt, role });
                });
            });
        });
    });
});

app.post('/api/admin/login', (req, res) => {
    if (!ADMIN_KEY) return res.status(503).json({ error: 'ADMIN_KEY n’est pas configurée sur le serveur.' });
    const userId = cleanText(req.body.userId, 100);
    if (req.body.key !== ADMIN_KEY) return res.status(403).json({ error: 'Clé administrateur incorrecte.' });
    if (!userId) return res.status(400).json({ error: 'Identifiant utilisateur obligatoire.' });
    db.get('SELECT value FROM app_settings WHERE key = ?', ['primary_admin_session'], (readError, row) => {
        if (readError) return res.status(500).json({ error: 'Impossible de vérifier la session admin.' });
        if (row) {
            try {
                const activeSession = JSON.parse(row.value);
                if (activeSession.userId !== userId) return res.status(409).json({ error: 'La clé admin principale est déjà utilisée sur un autre appareil.' });
                return res.json({ role: 'primary', sessionToken: activeSession.token });
            } catch {}
        }
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const session = JSON.stringify({ userId, token: sessionToken, createdAt: new Date().toISOString() });
        db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['primary_admin_session', session], error => {
            if (error) return res.status(500).json({ error: 'Impossible de créer la session admin.' });
            db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['primary_user_id', userId], () => {});
            res.json({ role: 'primary', sessionToken });
        });
    });
});

app.post('/api/admin/logout', (req, res) => requireAdmin(req, res, identity => {
    if (identity.role !== 'primary') return res.status(403).json({ error: 'Seul l’administrateur principal peut fermer cette session.' });
    db.run('DELETE FROM app_settings WHERE key = ?', ['primary_admin_session'], error => {
        if (error) return res.status(500).json({ error: 'Impossible de fermer la session admin.' });
        res.json({ ok: true });
    });
}));

app.get('/api/admin/state', (req, res) => requireAdmin(req, res, identity => {
    setting('messaging_locked', '0', (error, locked) => {
        if (error) return res.status(500).json({ error: 'Impossible de lire l’état.' });
        db.all('SELECT user_id AS userId, banned FROM user_controls WHERE banned = 1', (banError, banned) => {
            if (banError) return res.status(500).json({ error: 'Impossible de lire les bannissements.' });
            db.all('SELECT user_id AS userId, role FROM administrators ORDER BY user_id', (adminError, admins) => {
                if (adminError) return res.status(500).json({ error: 'Impossible de lire les administrateurs.' });
                res.json({ role: identity.role, locked: locked === '1', banned, admins });
            });
        });
    });
}));

app.post('/api/admin/action', (req, res) => requireAdmin(req, res, identity => {
    const action = cleanText(req.body.action, 30);
    const target = cleanText(req.body.targetUserId, 100);
    if (identity.role !== 'primary' && ['promote', 'removeAdmin', 'lock', 'unlock'].includes(action)) return res.status(403).json({ error: 'Seul l’administrateur principal peut effectuer cette action.' });
    if (['ban', 'unban', 'promote', 'removeAdmin'].includes(action) && !target) return res.status(400).json({ error: 'Identifiant utilisateur obligatoire.' });
    if (action === 'lock' || action === 'unlock') {
        return db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', ['messaging_locked', action === 'lock' ? '1' : '0'], error => error ? res.status(500).json({ error: 'Action impossible.' }) : res.json({ ok: true }));
    }
    if (action === 'ban' || action === 'unban') {
        return db.run('INSERT OR REPLACE INTO user_controls (user_id, banned) VALUES (?, ?)', [target, action === 'ban' ? 1 : 0], error => error ? res.status(500).json({ error: 'Action impossible.' }) : res.json({ ok: true }));
    }
    if (action === 'promote') return db.run('INSERT OR REPLACE INTO administrators (user_id, role) VALUES (?, ?)', [target, 'admin'], error => error ? res.status(500).json({ error: 'Promotion impossible.' }) : res.json({ ok: true }));
    if (action === 'removeAdmin') return db.run('DELETE FROM administrators WHERE user_id = ?', [target], error => error ? res.status(500).json({ error: 'Suppression impossible.' }) : res.json({ ok: true }));
    res.status(400).json({ error: 'Action inconnue.' });
}));

// Route pour recevoir un message
app.post('/envoi', (req, res) => {
    const message = cleanText(req.body.message, 1000);
    if (!message) return res.status(400).send('Le message est obligatoire.');
    db.run("INSERT INTO discussions (contenu) VALUES (?)", [message], function(err) {
        if (err) return res.status(500).send(err.message);
        res.send("Message bien reçu et stocké avec l'ID : " + this.lastID);
    });
});

// Lancer le serveur sur le port 3000
app.listen(port, () => {
    console.log(`Le serveur est allumé sur le port ${port}`);
    console.log(`Base SQLite : ${databasePath}`);
    if (!ADMIN_KEY) console.warn('Administration désactivée : définissez ADMIN_KEY dans l’environnement.');
    console.log("En attente de messages des étudiants...");
});