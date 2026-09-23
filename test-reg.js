/**
 * Test de non-régression : rôles, messages, admin (sans le blocage IP). À supprimer après usage.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 3261;
const DB = path.join(__dirname, 'test-reg.sqlite');
const BASE = `http://127.0.0.1:${PORT}`;
const OWNER_CODE = 'codeglaxt2516@';

for (const s of ['', '-wal', '-shm']) { try { fs.unlinkSync(DB + s); } catch { /* ignore */ } }

const server = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(PORT), DB_PATH: DB, OWNER_CODE },
    stdio: ['ignore', 'pipe', 'pipe']
});
server.stdout.on('data', () => { });
server.stderr.on('data', d => process.stderr.write(`[server:err] ${d}`));

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(pathname, options) {
    options = options || {};
    const headers = { Accept: 'application/json' };
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    if (options.body) headers['Content-Type'] = 'application/json';
    const res = await fetch(BASE + pathname, {
        method: options.method || 'GET', headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    let payload = {};
    try { payload = await res.json(); } catch { /* ignore */ }
    return { status: res.status, payload };
}
const GET = (p, token) => api(p, { token: token });
const POST = (p, token, body) => api(p, { method: 'POST', token: token, body: body });
const DEL = (p, token) => api(p, { method: 'DELETE', token: token });

let passed = 0, failed = 0;
function check(label, cond) { if (cond) { passed++; console.log(`  OK   ${label}`); } else { failed++; console.log(`  FAIL ${label}`); } }
const img = len => 'data:image/png;base64,' + 'A'.repeat(len);

(async () => {
    try {
        await sleep(2600);
        const A = await POST('/api/identity', null, { deviceId: 'dA', name: 'Alice' });
        const tokA = A.payload.token;
        const B = await POST('/api/identity', null, { deviceId: 'dB', name: 'Bob' });
        const tokB = B.payload.token;
        const C = await POST('/api/identity', null, { deviceId: 'dC', name: 'Carol' });
        const tokC = C.payload.token;

        check('créateur écrit (role owner)', (await POST('/api/messages', tokA, { text: 'hello' })).payload.role === 'owner');
        check('user écrit 201', (await POST('/api/messages', tokB, { text: 'salut' })).status === 201);
        check('image 201', (await POST('/api/messages', tokB, { image: img(100) })).status === 201);
        check('3 messages', (await GET('/api/messages', tokC)).payload.messages.length === 3);
        check('image data URL', (await GET('/api/messages', tokC)).payload.messages.find(m => m.image).image.startsWith('data:image/png;base64,'));
        check('texte vide 400', (await POST('/api/messages', tokB, { text: '  ' })).status === 400);
        check('texte+image 400', (await POST('/api/messages', tokB, { text: 'x', image: img(10) })).status === 400);
        check('image trop lourde 400', (await POST('/api/messages', tokB, { image: img(1600000) })).status === 400);
        check('user simple admin 403', (await GET('/api/admin/state', tokB)).status === 403);
        await POST('/api/admin/action', tokA, { action: 'promote', targetUserId: 2 });
        const sb = await GET('/api/admin/state', tokB);
        check('admin accède 200', sb.status === 200);
        check('admin ne voit pas les IP', sb.payload.accounts.every(a => a.ip === undefined));
        check('admin ne voit pas le créateur', sb.payload.accounts.every(a => a.role !== 'owner'));
        check('admin ne peut pas verrouiller 403', (await POST('/api/admin/action', tokB, { action: 'lock' })).status === 403);
        check('admin ne peut pas banIp 403', (await POST('/api/admin/action', tokB, { action: 'banIp', ip: '1.2.3.4' })).status === 403);
        check('admin ne peut pas supprimer 403', (await POST('/api/admin/action', tokB, { action: 'deleteUser', targetUserId: 3 })).status === 403);
        check('admin bannit 200', (await POST('/api/admin/action', tokB, { action: 'ban', targetUserId: 3 })).status === 200);
        check('Carol bannie 403', (await POST('/api/messages', tokC, { text: 'x' })).status === 403);
        check('admin débannit 200', (await POST('/api/admin/action', tokB, { action: 'unban', targetUserId: 3 })).status === 200);
        check('Carol réécrit 201', (await POST('/api/messages', tokC, { text: 'retour' })).status === 201);
        check('créateur protégé 403', (await POST('/api/admin/action', tokA, { action: 'ban', targetUserId: 1 })).status === 403);
        check('verrou 200', (await POST('/api/admin/action', tokA, { action: 'lock' })).status === 200);
        check('user bloqué 423', (await POST('/api/messages', tokC, { text: 'x' })).status === 423);
        check('créateur écrit pendant verrou 201', (await POST('/api/messages', tokA, { text: 'annonce' })).status === 201);
        check('déverrou 200', (await POST('/api/admin/action', tokA, { action: 'unlock' })).status === 200);
        const mine = (await GET('/api/messages', tokA)).payload.messages.find(m => m.isMine);
        check('créateur supprime message 200', (await DEL('/api/messages/' + mine.id, tokA)).status === 200);
        check('user ne supprime pas message 403', (await DEL('/api/messages/2', tokB)).status === 403);
        check('code créateur déjà pris 409', (await POST('/api/owner/claim', tokB, { code: OWNER_CODE })).status === 409);
        check('mauvais code 403', (await POST('/api/owner/claim', tokB, { code: 'non' })).status === 403);

        console.log(`\n===== NON-RÉGRESSION : ${passed} OK / ${failed} ÉCHECS =====`);
    } catch (e) {
        console.error('Erreur:', e); failed++;
    } finally {
        server.kill(); await sleep(300);
        for (const s of ['', '-wal', '-shm']) { try { fs.unlinkSync(DB + s); } catch { /* ignore */ } }
        process.exit(failed ? 1 : 0);
    }
})();