(() => {
  'use strict';

  const root = document.querySelector('.page-messagerie');
  if (!root) return;

  const TOKEN_KEY = 'docs2025.messagerie.token';
  const DEVICE_KEY = 'docs2025.messagerie.deviceId';
  const API_BASE = getApiBase();
  const IMAGE_MAX_BYTES =900000; // ~900 Ko avant encodage base64
  let token = localStorage.getItem(TOKEN_KEY) || '';
  let deviceId = localStorage.getItem(DEVICE_KEY) || '';
  let me = null;
  let messages = [];
  let staff = [];
  let locked = false;
  let isBanned = false;
  let pendingImage = '';
  let refreshTimer = null;

  /* ---------------------------------------------------------------- *
   * Chargement du gabarit                                             *
   * ---------------------------------------------------------------- */
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

  function getApiBase() {
    if (window.DOCS_API_URL) return window.DOCS_API_URL.replace(/\/$/, '');
    return '';
  }

  function api(path) {
    return `${API_BASE}${path}`;
  }

  const ADMIN_ACTION_PATH = '/api/admin/action';

  /* ---------------------------------------------------------------- *
   * Initialisation                                                    *
   * ---------------------------------------------------------------- */
  function initialize() {
    bindEvents();
    restoreProfileForm();
    boot();
  }

  function bindEvents() {
    const input = root.querySelector('#messageInput');
    input.addEventListener('input', () => {
      root.querySelector('#messageCounter').textContent = `${input.value.length} / 1000`;
    });
    root.querySelector('#startButton').addEventListener('click', startSession);
    root.querySelector('#startName').addEventListener('keydown', event => { if (event.key === 'Enter') startSession(); });
    root.querySelector('#claimOwner').addEventListener('click', claimOwner);
    root.querySelector('#profileAvatar').addEventListener('change', previewSelectedAvatar);
    root.querySelector('#saveProfile').addEventListener('click', saveProfile);
    root.querySelector('#editProfile').addEventListener('click', showProfileSetup);
    root.querySelector('#logoutButton').addEventListener('click', logout);
    root.querySelector('#messageForm').addEventListener('submit', sendMessage);
    root.querySelector('#refreshMessages').addEventListener('click', () => loadMessages(true));
    root.querySelector('#focusMessages').addEventListener('click', toggleFocusMessages);
    root.querySelector('#openAdmin').addEventListener('click', openAdminPanel);
    root.querySelector('#closeAdmin').addEventListener('click', () => { root.querySelector('#adminPanel').hidden = true; });
    root.querySelector('#toggleMessaging').addEventListener('click', toggleMessaging);
    root.querySelector('#banIpButton').addEventListener('click', () => {
      const input = root.querySelector('#ipToBan');
      const value = input.value.trim();
      if (!value) return showNotice('Entrez une adresse IP.', true);
      banIpDirect(value).then(() => { input.value = ''; });
    });
    root.querySelector('#imageInput').addEventListener('change', previewSelectedImage);
    root.querySelector('#removeImage').addEventListener('click', clearPendingImage);
    const modal = document.getElementById('imageModal');
    if (modal) modal.addEventListener('click', event => { if (event.target.matches('[data-close="true"]')) closeImageModal(); });
  }

  /* ---------------------------------------------------------------- *
   * Identité de l'appareil                                            *
   * ---------------------------------------------------------------- */
  function getOrCreateDeviceId() {
    if (!deviceId) {
      deviceId = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, deviceId);
    }
    return deviceId;
  }

  async function boot() {
    try {
      const config = await fetchJson(api('/api/config'), { auth: false });
      locked = Boolean(config.locked);
    } catch { /* continue */ }

    if (token) {
      try {
        const session = await fetchJson(api('/api/auth/me'), { auth: false });
        me = session.user;
        applySession(session);
        showMessenger();
        startPolling();
        return;
      } catch (error) {
        if (error.status === 403) { showAuthScreen(error.message); return; }
        token = ''; localStorage.removeItem(TOKEN_KEY);
      }
    }
    showAuthScreen();
  }

  let lastKnownName = '';

  function showAuthScreen(message) {
    root.querySelector('#authScreen').hidden = false;
    root.querySelector('#messengerLayout').hidden = true;
    root.querySelector('#focusMessages').hidden = true;
    root.querySelector('#adminPanel').hidden = true;
    setStatus('Non connecté');
    const warning = root.querySelector('#authWarning');
    if (message) { warning.hidden = false; warning.textContent = message; }
    else warning.hidden = true;
    const nameInput = root.querySelector('#startName');
    if (nameInput && !nameInput.value) nameInput.value = lastKnownName;
  }

  async function startSession() {
    const nameInput = root.querySelector('#startName');
    const name = nameInput ? nameInput.value.trim() : '';
    const warning = root.querySelector('#authWarning');
    if (!name) { warning.hidden = false; warning.textContent = 'Entrez un nom avant d’entrer.'; return; }
    const button = root.querySelector('#startButton');
    button.disabled = true;
    try {
      const result = await fetchJson(api('/api/identity'), {
        method: 'POST', auth: false,
        body: { deviceId: getOrCreateDeviceId(), name }
      });
      token = result.token;
      localStorage.setItem(TOKEN_KEY, token);
      me = result.user;
      lastKnownName = me.name || name;
      const session = await fetchJson(api('/api/auth/me'));
      applySession(session);
      showMessenger();
      startPolling();
      showNotice('Bienvenue ' + (me.name || name) + ' !');
    } catch (error) {
      warning.hidden = false;
      warning.textContent = error.message;
    } finally { button.disabled = false; }
  }

  async function claimOwner() {
    const code = root.querySelector('#ownerCode').value.trim();
    if (!code) return showNotice('Entrez le code créateur.', true);
    try {
      const result = await fetchJson(api('/api/owner/claim'), {
        method: 'POST',
        body: { code: code }
      });
      me = result.user;
      renderIdentity();
      showNotice('Vous êtes maintenant le créateur.');
      loadMessages(false);
    } catch (error) { showNotice(error.message, true); }
  }

  function applySession(session) {
    if (session.user) me = session.user;
    locked = Boolean(session.locked);
    isBanned = Boolean(session.banned || (me && me.banned));
    if (me) lastKnownName = me.name || lastKnownName;
    renderIdentity();
    restoreProfileForm();
  }

  async function logout() {
    try { await fetchJson(api('/api/auth/logout'), { method: 'POST' }); } catch { /* ignore */ }
    token = '';
    me = null;
    messages = [];
    staff = [];
    localStorage.removeItem(TOKEN_KEY);
    stopPolling();
    showAuthScreen();
    showNotice('Vous avez quitté la discussion.');
  }

  function showMessenger() {
    root.querySelector('#authScreen').hidden = true;
    root.querySelector('#messengerLayout').hidden = false;
    root.querySelector('#focusMessages').hidden = isBanned;
    root.querySelector('#openAdmin').hidden = !(me && (me.role === 'owner' || me.role === 'admin'));
    setStatus('Connectée');
    loadMessages(false);
  }

  /* ---------------------------------------------------------------- *
   * Profil                                                            *
   * ---------------------------------------------------------------- */
  function restoreProfileForm() {
    if (!me) return;
    const setup = root.querySelector('#profileSetup');
    root.querySelector('#profileName').value = me.name || '';
    // Le formulaire de profil est replie par defaut, ouvert via « Modifier ».
    setup.hidden = true;
    root.querySelector('#editProfile').hidden = false;
    updateAvatarPreview(me.avatar, me.name);
  }

  function showProfileSetup() {
    root.querySelector('#profileSetup').hidden = false;
    root.querySelector('#editProfile').hidden = true;
  }

  function renderIdentity() {
    if (!me) return;
    root.querySelector('#profileIdentityName').textContent = me.name || '—';
    const badge = root.querySelector('#profileRoleBadge');
    const labels = { owner: 'Créateur', admin: 'Administrateur', user: '' };
    const label = labels[me.role] || '';
    badge.hidden = !label;
    badge.textContent = label;
    badge.className = `messenger__role-badge messenger__role-badge--${me.role}`;
    // Le créateur voit son identifiant d'appareil (« identité du téléphone »).
    const info = root.querySelector('#profileEmail');
    if (me.role === 'owner' && me.deviceId) {
      info.textContent = `Appareil : ${shortId(me.deviceId)}`;
      info.hidden = false;
    } else info.hidden = true;
    // La zone « code créateur » n'est proposée qu'à ceux qui ne sont pas déjà créateur.
    root.querySelector('#ownerClaimBox').hidden = me.role === 'owner';
    updateAvatarPreview(me.avatar, me.name);
  }

  function previewSelectedAvatar() {
    const file = root.querySelector('#profileAvatar').files[0];
    if (!file) return updateAvatarPreview(me.avatar, me.name);
    if (!file.type.startsWith('image/')) return showNotice('Choisissez un fichier image.', true);
    if (file.size > 300000) return showNotice('La photo doit peser moins de 300 Ko.', true);
    const reader = new FileReader();
    reader.onload = () => updateAvatarPreview(String(reader.result), me.name);
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    if (!me) return;
    const name = root.querySelector('#profileName').value.trim();
    if (!name) return showNotice('Choisissez un nom affiché avant de continuer.', true);
    const file = root.querySelector('#profileAvatar').files[0];
    const button = root.querySelector('#saveProfile');
    button.disabled = true;
    try {
      let avatar = me.avatar || '';
      if (file) {
        if (file.size > 300000) throw new Error('La photo doit peser moins de 300 Ko.');
        avatar = await readFile(file);
      }
      const result = await fetchJson(api('/api/profile'), { method: 'POST', body: { name: name, avatar: avatar } });
      me = result.user;
      renderIdentity();
      restoreProfileForm();
      showNotice('Profil enregistré.');
      loadMessages(false);
    } catch (error) { showNotice(error.message, true); }
    finally { button.disabled = false; }
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('La photo n’a pas pu être lue.'));
      reader.readAsDataURL(file);
    });
  }

  function updateAvatarPreview(source, name) {
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

  /* ---------------------------------------------------------------- *
   * Messages                                                          *
   * ---------------------------------------------------------------- */
  function startPolling() { stopPolling(); refreshTimer = window.setInterval(() => loadMessages(false), 8000); }
  function stopPolling() { if (refreshTimer) window.clearInterval(refreshTimer); refreshTimer = null; }

  async function loadMessages(manual) {
    if (!me) return;
    try {
      const payload = await fetchJson(api('/api/messages'));
      messages = payload.messages || [];
      staff = payload.staff || [];
      isBanned = Boolean(payload.banned);
      locked = Boolean(payload.locked);
      if (payload.me) { me = payload.me; renderIdentity(); }
      applyMessagingState();
      renderStaff();
      renderMessages();
      setStatus('Connectée');
      if (root.querySelector('#adminPanel').hidden === false) loadAdminState().catch(() => {});
      if (manual) showNotice('Messages actualisés.');
    } catch (error) {
      if (error.status === 401) { await logout(); return; }
      setStatus('Hors connexion');
      if (manual) showNotice(error.message, true);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!me) return showNotice('Connectez-vous avant d’envoyer un message.', true);
    const input = root.querySelector('#messageInput');
    const text = input.value.trim();
    if (!text && !pendingImage) return;
    if (text && pendingImage) return showNotice('Envoyez soit un texte, soit une image, pas les deux.', true);
    const button = root.querySelector('.messenger__button--primary');
    button.disabled = true;
    try {
      await fetchJson(api('/api/messages'), { method: 'POST', body: { text, image: pendingImage } });
      input.value = '';
      root.querySelector('#messageCounter').textContent = '0 / 1000';
      clearPendingImage();
      await loadMessages(false);
    } catch (error) { showNotice(error.message, true); }
    finally { button.disabled = false; applyMessagingState(); }
  }

  function previewSelectedImage() {
    const file = root.querySelector('#imageInput').files[0];
    if (!file) return clearPendingImage();
    if (!file.type.startsWith('image/')) return showNotice('Choisissez un fichier image.', true);
    if (file.size > IMAGE_MAX_BYTES) return showNotice('L’image doit peser moins de 900 Ko.', true);
    readFile(file).then(data => {
      pendingImage = data;
      root.querySelector('#imagePreviewImg').src = data;
      root.querySelector('#imagePreview').hidden = false;
      root.querySelector('#messageInput').value = '';
      root.querySelector('#messageCounter').textContent = '0 / 1000';
    }).catch(error => showNotice(error.message, true));
  }

  function clearPendingImage() {
    pendingImage = '';
    root.querySelector('#imageInput').value = '';
    root.querySelector('#imagePreviewImg').src = '';
    root.querySelector('#imagePreview').hidden = true;
  }

  function applyMessagingState() {
    const banned = root.querySelector('#messagingBanned');
    const lockedNotice = root.querySelector('#messagingLocked');
    banned.hidden = !isBanned;
    lockedNotice.hidden = !locked || isBanned;
    const disabled = isBanned || (locked && me && me.role !== 'owner');
    root.querySelector('#messageInput').disabled = disabled;
    root.querySelector('.messenger__button--primary').disabled = disabled;
    root.querySelector('.messenger__attach').classList.toggle('is-disabled', disabled);
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
    messages.forEach(message => list.appendChild(buildMessage(message)));
    list.scrollTop = list.scrollHeight;
  }

  function buildMessage(message) {
    const article = document.createElement('article');
    const mine = message.isMine ? ' messenger__message--mine' : '';
    const roleClass = message.role === 'owner' ? ' messenger__message--owner'
      : message.role === 'admin' ? ' messenger__message--admin' : '';
    article.className = `messenger__message${mine}${roleClass}`;

    const avatar = document.createElement('div');
    avatar.className = 'messenger__message-avatar';
    if (message.avatar) {
      const image = document.createElement('img');
      image.src = message.avatar;
      image.alt = `Photo de ${message.name}`;
      image.onerror = () => { avatar.textContent = initials(message.name); };
      avatar.appendChild(image);
    } else avatar.textContent = initials(message.name);

    const body = document.createElement('div');
    body.className = 'messenger__message-body';
    const meta = document.createElement('div');
    meta.className = 'messenger__message-meta';
    const name = document.createElement('span');
    name.className = 'messenger__message-name';
    name.textContent = message.name;
    if (message.role === 'owner') name.textContent += ' · créateur';
    else if (message.role === 'admin') name.textContent += ' · admin';
    const time = document.createElement('time');
    time.className = 'messenger__message-time';
    time.textContent = formatDate(message.createdAt);
    if (message.createdAt) time.dateTime = message.createdAt;
    meta.append(name, time);
    body.append(meta);

    if (message.text) {
      const text = document.createElement('p');
      text.className = 'messenger__message-text';
      text.textContent = message.text;
      body.appendChild(text);
    }
    if (message.image) {
      const image = document.createElement('img');
      image.className = 'messenger__message-image';
      image.src = message.image;
      image.alt = `Image envoyée par ${message.name}`;
      image.loading = 'lazy';
      image.addEventListener('click', () => openImageModal(message.image));
      body.appendChild(image);
    }
    if (me && me.role === 'owner') {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'messenger__message-delete';
      remove.textContent = 'Supprimer';
      remove.addEventListener('click', () => deleteMessage(message.id));
      body.appendChild(remove);
    }
    article.append(avatar, body);
    return article;
  }

  async function deleteMessage(id) {
    if (!window.confirm('Supprimer définitivement ce message ?')) return;
    try {
      await fetchJson(api(`/api/messages/${id}`), { method: 'DELETE' });
      showNotice('Message supprimé.');
      loadMessages(false);
    } catch (error) { showNotice(error.message, true); }
  }

  function renderStaff() {
    const container = root.querySelector('#publicAdministrators');
    container.replaceChildren();
    if (!staff.length) return;
    const title = document.createElement('strong');
    title.className = 'messenger__administrators-title';
    title.textContent = 'Équipe';
    container.appendChild(title);
    staff.forEach(member => {
      const item = document.createElement('span');
      item.className = `messenger__administrator messenger__administrator--${member.role}`;
      const avatar = document.createElement('span');
      avatar.className = 'messenger__administrator-avatar';
      if (member.avatar) {
        const image = document.createElement('img');
        image.src = member.avatar;
        image.alt = `Photo de ${member.name}`;
        image.onerror = () => { avatar.textContent = initials(member.name); };
        avatar.appendChild(image);
      } else avatar.textContent = initials(member.name);
      const name = document.createElement('span');
      name.textContent = `${member.name}${member.role === 'owner' ? ' · créateur' : ' · admin'}`;
      item.append(avatar, name);
      container.appendChild(item);
    });
  }

  /* ---------------------------------------------------------------- *
   * Administration (créateur = tout, admin = bannir)                  *
   * ---------------------------------------------------------------- */
  async function openAdminPanel() {
    root.querySelector('#adminPanel').hidden = false;
    try { await loadAdminState(); } catch (error) { showNotice(error.message, true); }
  }

  async function loadAdminState() {
    const state = await fetchJson(api('/api/admin/state'));
    const isOwner = state.me && state.me.role === 'owner';
    root.querySelector('#adminPanelTitle').textContent = isOwner ? 'Panneau du créateur' : 'Panneau administrateur';
    root.querySelector('#adminRoleNote').textContent = isOwner
      ? 'Vous êtes le créateur : nommez des admins, bannissez ou supprimez des appareils (leur IP est bloquée), verrouillez la discussion.'
      : 'Vous êtes administrateur : vous pouvez uniquement bannir ou débannir des appareils.';
    const toggle = root.querySelector('#toggleMessaging');
    toggle.hidden = !isOwner;
    toggle.textContent = state.locked ? 'Déverrouiller la discussion' : 'Verrouiller la discussion';
    renderAccounts(state.accounts || [], isOwner);
    renderIpBans(isOwner ? state.ipBans || [] : []);
  }

  function renderIpBans(ipBans) {
    const box = root.querySelector('#ipBanBox');
    if (!box) return;
    if (!me || me.role !== 'owner') { box.hidden = true; return; }
    box.hidden = false;
    const list = box.querySelector('#ipBanList');
    list.replaceChildren();
    if (!ipBans.length) {
      const empty = document.createElement('span');
      empty.className = 'messenger__account-meta';
      empty.textContent = 'Aucune adresse IP bloquée.';
      list.appendChild(empty);
      return;
    }
    ipBans.forEach(ban => {
      const chip = document.createElement('span');
      chip.className = 'messenger__ip-chip';
      const label = document.createElement('span');
      label.textContent = ban.ip;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'messenger__button messenger__button--small';
      btn.textContent = 'Débloquer';
      btn.addEventListener('click', () => adminAction('unbanIp', null, ban.ip));
      chip.append(label, btn);
      list.appendChild(chip);
    });
  }

  function renderAccounts(accounts, isOwner) {
    const container = root.querySelector('#adminLists');
    container.replaceChildren();
    if (!accounts.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Aucun compte.';
      container.appendChild(empty);
      return;
    }
    accounts.forEach(account => {
      const row = document.createElement('div');
      row.className = 'messenger__account';
      if (account.banned) row.classList.add('is-banned');
      if (account.deleted) row.classList.add('is-deleted');

      const avatar = document.createElement('span');
      avatar.className = 'messenger__account-avatar';
      if (account.avatar) {
        const image = document.createElement('img');
        image.src = account.avatar;
        image.alt = '';
        image.onerror = () => { avatar.textContent = initials(account.name); };
        avatar.appendChild(image);
      } else avatar.textContent = initials(account.name);

      const info = document.createElement('div');
      info.className = 'messenger__account-info';
      const name = document.createElement('strong');
      name.textContent = account.name + (account.isMe ? ' (vous)' : '');
      const idLine = document.createElement('span');
      idLine.className = 'messenger__account-email';
      idLine.textContent = isOwner ? `ID appareil : ${shortId(account.deviceId)}` : 'ID masqué';
      const meta = document.createElement('span');
      meta.className = 'messenger__account-meta';
      const roleLabels = { owner: 'Créateur', admin: 'Administrateur', user: 'Utilisateur' };
      const status = account.deleted ? ' · supprimé' : (account.banned ? ' · banni' : '');
      meta.textContent = `${roleLabels[account.role] || account.role}${status}`;
      info.append(name, idLine, meta);
      if (isOwner && account.ip) {
        const ipLine = document.createElement('span');
        ipLine.className = 'messenger__account-email';
        ipLine.textContent = `IP : ${account.ip}`;
        info.appendChild(ipLine);
      }
      if (isOwner && account.ip) {
        const ipLine = document.createElement('span');
        ipLine.className = 'messenger__account-email';
        ipLine.textContent = `IP : ${account.ip}`;
        info.appendChild(ipLine);
      }

      const actions = document.createElement('div');
      actions.className = 'messenger__account-actions';
      if (account.role !== 'owner' && !account.isMe) {
        if (account.deleted) {
          if (isOwner) actions.appendChild(accountButton('Restaurer', () => adminAction('restoreUser', account.id)));
        } else {
          actions.appendChild(accountButton(account.banned ? 'Débannir' : 'Bannir', () => adminAction(account.banned ? 'unban' : 'ban', account.id)));
          if (isOwner) {
            if (account.role === 'admin') actions.appendChild(accountButton('Retirer admin', () => adminAction('demote', account.id)));
            else actions.appendChild(accountButton('Nommer admin', () => adminAction('promote', account.id)));
            actions.appendChild(accountButton('Supprimer', () => adminAction('deleteUser', account.id), true));
          }
        }
      }
      row.append(avatar, info, actions);
      container.appendChild(row);
    });
  }

  function accountButton(label, handler, danger) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'messenger__button messenger__button--small' + (danger ? ' messenger__button--danger' : '');
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
  }

  async function adminAction(action, targetUserId, ip) {
    if (action === 'deleteUser' && !window.confirm('Supprimer cet appareil ? Son adresse IP sera aussi bloquée.')) return;
    try {
      const payload = { action: action, targetUserId: targetUserId };
      if (ip) payload.ip = ip;
      await fetchJson(api('/api/admin/action'), { method: 'POST', body: payload });
      showNotice('Action effectuée.');
      await loadAdminState();
      loadMessages(false);
    } catch (error) { showNotice(error.message, true); }
  }

  /** Bloque directement une adresse IP (créateur). */
  async function banIpDirect(ip) {
    try {
      const payload = { action: 'banIp', ip: ip };
      await fetchJson(api(ADMIN_ACTION_PATH), { method: 'POST', body: payload });
      showNotice('Adresse IP bloquée.');
      await loadAdminState();
    } catch (error) { showNotice(error.message, true); }
  }

  async function toggleMessaging() {
    const action = locked ? 'unlock' : 'lock';
    try {
      await fetchJson(api('/api/admin/action'), { method: 'POST', body: { action } });
      locked = action === 'lock';
      root.querySelector('#toggleMessaging').textContent = locked ? 'Déverrouiller la discussion' : 'Verrouiller la discussion';
      applyMessagingState();
      showNotice(locked ? 'Discussion verrouillée.' : 'Discussion déverrouillée.');
    } catch (error) { showNotice(error.message, true); }
  }

  /* ---------------------------------------------------------------- *
   * Utilitaires                                                       *
   * ---------------------------------------------------------------- */
  async function fetchJson(url, options = {}) {
    const headers = { Accept: 'application/json' };
    if (token && options.auth !== false) headers.Authorization = `Bearer ${token}`;
    let body;
    if (options.body) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(options.body); }
    const response = await fetch(url, { method: options.method || 'GET', headers, body });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || 'Erreur du serveur.');
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const image = document.getElementById('modalImage');
    if (!modal || !image) return;
    image.src = src;
    modal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeImageModal() {
    const modal = document.getElementById('imageModal');
    const image = document.getElementById('modalImage');
    if (!modal) return;
    modal.hidden = true;
    image.src = '';
    document.body.classList.remove('modal-open');
  }

  function toggleFocusMessages() {
    const messenger = root.querySelector('.messenger');
    const button = root.querySelector('#focusMessages');
    const focused = messenger.classList.toggle('messenger--focused');
    button.setAttribute('aria-pressed', String(focused));
    button.textContent = focused ? 'Réduire la messagerie' : 'Agrandir la messagerie';
    document.body.classList.toggle('messenger-focus-open', focused);
  }

  function setStatus(text) {
    const status = root.querySelector('#messengerStatus');
    status.textContent = text;
    status.classList.toggle('is-ready', text === 'Connectée');
  }

  function showNotice(message, error = false) {
    const notice = root.querySelector('#messengerNotice');
    notice.textContent = message;
    notice.hidden = false;
    notice.classList.toggle('is-error', error);
    window.clearTimeout(showNotice.timer);
    showNotice.timer = window.setTimeout(() => { notice.hidden = true; }, 5000);
  }

  function initials(name) {
    return String(name || '').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';
  }

  /** Raccourcit un identifiant d'appareil pour l'affichage (ex : 1a2b3c4d...9f8e). */
  function shortId(value) {
    const id = String(value || '');
    if (id.length <= 14) return id || '-';
    return `${id.slice(0, 8)}...${id.slice(-4)}`;
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
  }
})();
