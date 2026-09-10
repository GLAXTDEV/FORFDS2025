(() => {
  'use strict';

  const root = document.querySelector('.page-messagerie');
  if (!root) return;

  const PROFILE_KEY = 'docs2025.messagerie.profil';
  const USER_KEY = 'docs2025.messagerie.userId';
  const ADMIN_KEY = 'docs2025.messagerie.adminKey';
  const ADMIN_SESSION_KEY = 'docs2025.messagerie.adminSession';
  const API_URL = getApiUrl();
  let messages = [];
  let isAdminView = false;
  let isBanned = false;
  let administrators = [];

  function getApiUrl() {
    if (window.location.port === '3000') return '/api/messages';
    const host = window.location.hostname || 'localhost';
    return `http://${host}:3000/api/messages`;
  }

  fetch('messagerie.html')
    .then(response => {
      if (!response.ok) throw new Error(`Impossible de charger messagerie.html (${response.status}).`);
      return response.text();
    })
    .then(html => {
      root.innerHTML = html;
      initialize();
    })
    .catch(error => {
      root.innerHTML = `<p class="messenger__notice is-error">${escapeHtml(error.message)}</p>`;
    });

  function initialize() {
    restoreProfile();
    updateAvatarPreview();
    const input = root.querySelector('#messageInput');
    input.addEventListener('input', () => {
      root.querySelector('#messageCounter').textContent = `${input.value.length} / 1000`;
    });
    root.querySelector('#profileAvatar').addEventListener('change', previewSelectedAvatar);
    root.querySelector('#saveProfile').addEventListener('click', saveProfile);
    root.querySelector('#editProfile').addEventListener('click', showProfileSetup);
    root.querySelector('#messageForm').addEventListener('submit', sendMessage);
    root.querySelector('#refreshMessages').addEventListener('click', () => loadMessages(true));
    root.querySelector('#focusMessages').addEventListener('click', toggleFocusMessages);
    root.querySelector('#adminLogin').addEventListener('click', adminLogin);
    root.querySelector('#logoutAdmin').addEventListener('click', logoutAdmin);
    root.querySelector('#closeAdmin').addEventListener('click', () => { root.querySelector('#adminPanel').hidden = true; });
    root.querySelector('#toggleMessaging').addEventListener('click', toggleMessaging);
    root.querySelector('#banUser').addEventListener('click', () => adminAction('ban'));
    root.querySelector('#unbanUser').addEventListener('click', () => adminAction('unban'));
    root.querySelector('#promoteAdmin').addEventListener('click', () => adminAction('promote'));
    root.querySelector('#removeAdmin').addEventListener('click', () => adminAction('removeAdmin'));
    restoreProfileVisibility();
    restoreAdminSession();
    loadMessages(false);
    window.setInterval(() => loadMessages(false), 10000);
  }

  function getUserId() {
    let userId = localStorage.getItem(USER_KEY);
    if (!userId) {
      userId = window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(USER_KEY, userId);
    }
    return userId;
  }

  function getProfile() {
    try {
      const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
      return { name: String(profile.name || '').trim(), avatar: String(profile.avatar || '').trim() };
    } catch { return { name: '', avatar: '' }; }
  }

  function restoreProfile() {
    const profile = getProfile();
    root.querySelector('#profileName').value = profile.name;
    root.querySelector('#profileAvatar').value = '';
  }

  async function saveProfile() {
    const name = root.querySelector('#profileName').value.trim();
    if (!name) { showNotice('Choisissez un nom de profil avant de continuer.', true); return; }
    const file = root.querySelector('#profileAvatar').files[0];
    let avatar = getProfile().avatar;
    if (file) {
      if (!file.type.startsWith('image/')) { showNotice('Choisissez un fichier image.', true); return; }
      if (file.size > 500000) { showNotice('La photo doit peser moins de 500 Ko.', true); return; }
      avatar = await readFile(file);
    }
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, avatar }));
    updateAvatarPreview();
    restoreProfileVisibility();
    showNotice('Profil enregistré.');
  }

  function showProfileSetup() {
    root.querySelector('#profileSetup').hidden = false;
    root.querySelector('#editProfile').hidden = true;
  }

  function restoreProfileVisibility() {
    const hasProfile = Boolean(getProfile().name);
    root.querySelector('#profileSetup').hidden = hasProfile;
    root.querySelector('#editProfile').hidden = !hasProfile;
  }

  function previewSelectedAvatar() {
    const file = root.querySelector('#profileAvatar').files[0];
    if (!file) return updateAvatarPreview();
    const reader = new FileReader();
    reader.onload = () => renderAvatar(reader.result, getProfile().name);
    reader.readAsDataURL(file);
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('La photo n’a pas pu être lue.'));
      reader.readAsDataURL(file);
    });
  }

  function updateAvatarPreview() {
    const preview = root.querySelector('#profileAvatarPreview');
    const profile = getProfile();
    renderAvatar(profile.avatar, profile.name);
  }

  function renderAvatar(source, name) {
    const preview = root.querySelector('#profileAvatarPreview');
    preview.replaceChildren();
    if (source) {
      const image = document.createElement('img');
      image.src = source;
      image.alt = `Photo de ${name || 'profil'}`;
      image.onerror = () => { preview.textContent = initials(name); };
      preview.appendChild(image);
    } else preview.textContent = initials(name);
  }

  async function loadMessages(manual) {
    try {
      const response = await fetch(API_URL, { headers: { Accept: 'application/json', 'x-user-id': getUserId(), 'x-admin-session': localStorage.getItem(ADMIN_SESSION_KEY) || '' } });
      if (!response.ok) throw new Error('Le serveur de messagerie est indisponible.');
      const payload = await response.json();
      messages = Array.isArray(payload) ? payload : payload.messages || [];
      administrators = payload.administrators || [];
      setMessagingBanned(Boolean(payload.banned));
      setMessagingLocked(Boolean(payload.locked));
      renderAdministrators();
      renderMessages();
      setStatus('Connectée');
      if (manual) showNotice('Messages actualisés.');
    } catch (error) {
      setStatus('Hors connexion');
      if (manual) showNotice(`${error.message} Lancez server.js pour partager les messages.`, true);
      renderMessages();
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const profile = getProfile();
    const input = root.querySelector('#messageInput');
    const text = input.value.trim();
    if (!profile.name) { showNotice('Enregistrez votre profil avant d’envoyer un message.', true); return; }
    if (!text) return;
    const button = root.querySelector('.messenger__button--primary');
    button.disabled = true;
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ userId: getUserId(), name: profile.name, avatar: profile.avatar, text })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Le message n’a pas pu être envoyé.');
      input.value = '';
      root.querySelector('#messageCounter').textContent = '0 / 1000';
      await loadMessages(false);
    } catch (error) { showNotice(error.message, true); }
    finally { button.disabled = false; }
  }

  async function adminLogin() {
    const key = root.querySelector('#adminKey').value;
    try {
      const response = key
        ? await fetch(`${API_URL.replace('/api/messages', '/api/admin/login')}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, userId: getUserId() }) })
        : await adminFetch('/state');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Accès refusé.');
      if (result.sessionToken) localStorage.setItem(ADMIN_SESSION_KEY, result.sessionToken);
      if (key) localStorage.removeItem(ADMIN_KEY);
      isAdminView = true;
      root.querySelector('#adminLoginSection').hidden = true;
      root.querySelector('#adminPanel').hidden = false;
      await loadAdminState();
      showNotice('Administration ouverte.');
    } catch (error) { showNotice(error.message, true); }
  }

  async function restoreAdminSession() {
    if (!localStorage.getItem(ADMIN_SESSION_KEY)) return;
    try {
      const response = await adminFetch('/state');
      if (!response.ok) throw new Error('Session admin expirée.');
      isAdminView = true;
      root.querySelector('#adminLoginSection').hidden = true;
      root.querySelector('#adminPanel').hidden = false;
      await loadAdminState();
    } catch {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }

  async function logoutAdmin() {
    try {
      const response = await adminFetch('/logout', { method: 'POST' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Déconnexion impossible.');
      localStorage.removeItem(ADMIN_SESSION_KEY);
      isAdminView = false;
      root.querySelector('#adminPanel').hidden = true;
      root.querySelector('#adminLoginSection').hidden = false;
      await loadMessages(false);
      showNotice('Session admin fermée.');
    } catch (error) { showNotice(error.message, true); }
  }

  async function loadAdminState() {
    const response = await adminFetch('/state');
    const state = await response.json();
    if (!response.ok) throw new Error(state.error || 'Accès administrateur refusé.');
    isAdminView = true;
    setMessagingLocked(state.locked);
    root.querySelector('#toggleMessaging').textContent = state.locked ? 'Déverrouiller la messagerie' : 'Verrouiller la messagerie';
    root.querySelector('#adminLists').innerHTML = `<p><strong>Administrateurs :</strong> ${state.admins.length ? state.admins.map(admin => `${escapeHtml(admin.userId)} (${escapeHtml(admin.role)})`).join(', ') : 'Aucun'}</p><p><strong>Utilisateurs bannis :</strong> ${state.banned.length ? state.banned.map(user => escapeHtml(user.userId)).join(', ') : 'Aucun'}</p>`;
    loadMessages(false);
  }

  async function adminAction(action) {
    const targetUserId = root.querySelector('#adminTargetUser').value.trim();
    try {
      const response = await adminFetch('/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, targetUserId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Action refusée.');
      await loadAdminState(); showNotice('Action administrateur effectuée.');
    } catch (error) { showNotice(error.message, true); }
  }

  async function toggleMessaging() {
    const locked = root.querySelector('#messagingLocked').hidden;
    await adminAction(locked ? 'lock' : 'unlock');
  }

  function adminFetch(path, options = {}) {
    return fetch(`${API_URL.replace('/api/messages', '/api/admin')}${path}`, { ...options, headers: { ...(options.headers || {}), 'x-admin-session': localStorage.getItem(ADMIN_SESSION_KEY) || '', 'x-user-id': getUserId(), Accept: 'application/json' } });
  }

  function renderMessages() {
    const list = root.querySelector('#messageList');
    list.replaceChildren();
    if (!messages.length) {
      const empty = document.createElement('p');
      empty.className = 'messenger__empty';
      empty.textContent = 'Aucun message pour le moment.';
      list.appendChild(empty);
      return;
    }
    const currentUser = getUserId();
    messages.forEach(message => {
      const article = document.createElement('article');
      const roleClass = message.role === 'primary' ? ' messenger__message--primary' : message.role === 'admin' ? ' messenger__message--admin' : '';
      article.className = `messenger__message${message.isMine || message.userId === currentUser ? ' messenger__message--mine' : ''}${roleClass}`;
      const avatar = document.createElement('div');
      avatar.className = 'messenger__message-avatar';
      if (message.avatar) {
        const image = document.createElement('img'); image.src = message.avatar; image.alt = `Photo de ${message.name}`; image.onerror = () => { avatar.textContent = initials(message.name); }; avatar.appendChild(image);
      } else avatar.textContent = initials(message.name);
      const body = document.createElement('div'); body.className = 'messenger__message-body';
      const meta = document.createElement('div'); meta.className = 'messenger__message-meta';
      const name = document.createElement('span'); name.className = 'messenger__message-name'; name.textContent = message.name;
      const time = document.createElement('time'); time.className = 'messenger__message-time'; time.textContent = formatDate(message.createdAt); if (message.createdAt) time.dateTime = message.createdAt;
      const text = document.createElement('p'); text.className = 'messenger__message-text'; text.textContent = message.text;
      meta.append(name);
      if (isAdminView && message.userId) {
        const userId = document.createElement('span'); userId.className = 'messenger__message-userid'; userId.textContent = `ID: ${message.userId}`; meta.appendChild(userId);
      }
      meta.append(time); body.append(meta, text); article.append(avatar, body); list.appendChild(article);
    });
    list.scrollTop = list.scrollHeight;
  }

  function renderAdministrators() {
    const container = root.querySelector('#publicAdministrators');
    container.replaceChildren();
    if (!administrators.length) return;
    const title = document.createElement('strong');
    title.className = 'messenger__administrators-title';
    title.textContent = 'Administrateurs';
    container.appendChild(title);
    administrators.forEach(admin => {
      const item = document.createElement('span');
      item.className = `messenger__administrator messenger__administrator--${admin.role}`;
      const avatar = document.createElement('span');
      avatar.className = 'messenger__administrator-avatar';
      if (admin.avatar) {
        const image = document.createElement('img');
        image.src = admin.avatar;
        image.alt = `Photo de ${admin.name}`;
        image.onerror = () => { avatar.textContent = initials(admin.name); };
        avatar.appendChild(image);
      } else avatar.textContent = initials(admin.name);
      const name = document.createElement('span');
      name.textContent = `${admin.name}${admin.role === 'primary' ? ' · principal' : ' · admin'}`;
      item.append(avatar, name);
      container.appendChild(item);
    });
  }

  function setStatus(text) { root.querySelector('#messengerStatus').textContent = text; root.querySelector('#messengerStatus').classList.toggle('is-ready', text === 'Connectée'); }
  function setMessagingBanned(banned) {
    isBanned = banned;
    root.querySelector('#messagingBanned').hidden = !banned;
    root.querySelector('#focusMessages').hidden = banned;
    root.querySelector('.messenger__conversation').hidden = banned;
    root.querySelector('#messageInput').disabled = banned;
    root.querySelector('.messenger__button--primary').disabled = banned;
    if (banned) showNotice('Vous ne pouvez pas discuter pour l’instant.');
  }
  function setMessagingLocked(locked) { root.querySelector('#messagingLocked').hidden = !locked || isBanned; root.querySelector('#messageInput').disabled = locked || isBanned; root.querySelector('.messenger__button--primary').disabled = locked || isBanned; }
  function toggleFocusMessages() {
    const messenger = root.querySelector('.messenger');
    const button = root.querySelector('#focusMessages');
    const focused = messenger.classList.toggle('messenger--focused');
    button.setAttribute('aria-pressed', String(focused));
    button.textContent = focused ? 'Réduire la messagerie' : 'Agrandir la messagerie';
    document.body.classList.toggle('messenger-focus-open', focused);
  }
  function showNotice(message, error = false) { const notice = root.querySelector('#messengerNotice'); notice.textContent = message; notice.hidden = false; notice.classList.toggle('is-error', error); window.clearTimeout(showNotice.timer); showNotice.timer = window.setTimeout(() => { notice.hidden = true; }, 5000); }
  function initials(name) { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'; }
  function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character])); }
})();
