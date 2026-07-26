let deferredPrompt = null;
let installPromptShown = false;

const SITE_UPDATE_VERSION = 2;
const SITE_UPDATES = [
  {
    version: 1,
    title: 'Nouveaux documents ajoutés',
    message: 'Des documents supplémentaires ont été ajoutés dans les sections disponibles.'
  },
  {
    version: 2,
    title: 'Nouvelles fonctionnalités',
    message: 'Recherche, installation comme application et notifications de mises à jour sont maintenant activées.'
  }
];
const UPDATE_VERSION_KEY = 'docsLastSeenUpdateVersion';

function show(id) {
  // cacher toutes les pages 'page'
  document.querySelectorAll('.page').forEach(pageActive => {
    pageActive.classList.remove('active');
  });
  
  // afficher celle sur qui on clique
  const targetPage = document.getElementById(id);
  if (targetPage) {
    targetPage.classList.add('active');
    localStorage.setItem('pageSauvegardee', id);
  }

  // S'assure que applySearch existe avant de l'appeler pour éviter des erreurs
  if (typeof applySearch === 'function') {
    applySearch();
  }
}

function showInstallPrompt() {
  const prompt = document.getElementById('installPrompt');
  const installButton = document.getElementById('installButton');

  if (!prompt || installPromptShown) return;

  installPromptShown = true;
  prompt.hidden = false;
  prompt.classList.add('show');

  if (installButton) {
    installButton.disabled = !deferredPrompt;
    installButton.textContent = deferredPrompt ? 'Installer' : 'Installer depuis le navigateur';
  }
}

function hideInstallPrompt() {
  const prompt = document.getElementById('installPrompt');
  if (prompt) {
    prompt.hidden = true;
    prompt.classList.remove('show');
  }
}

async function installApp() {
  if (!deferredPrompt) {
    hideInstallPrompt();
    return;
  }

  deferredPrompt.prompt();
  const choiceResult = await deferredPrompt.userChoice;

  if (choiceResult.outcome === 'accepted') {
    hideInstallPrompt();
  } else {
    hideInstallPrompt();
  }

  deferredPrompt = null;
}

function initInstallPrompt() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const dismissed = localStorage.getItem('pwaInstallDismissed') === 'true';

  if (isStandalone || dismissed) {
    hideInstallPrompt();
    return;
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    window.setTimeout(showInstallPrompt, 500);
  });

  window.addEventListener('appinstalled', () => {
    hideInstallPrompt();
    localStorage.setItem('pwaInstallDismissed', 'true');
  });

  window.setTimeout(showInstallPrompt, 5000);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  }
}

function showUpdateToast() {
  const toast = document.getElementById('updateToast');
  if (!toast) return;

  const lastSeenVersion = Number(localStorage.getItem(UPDATE_VERSION_KEY) || 0);
  const pendingUpdates = SITE_UPDATES.filter(update => update.version > lastSeenVersion);

  if (!pendingUpdates.length) return;

  const items = pendingUpdates.map(update => `<li>${update.title} : ${update.message}</li>`).join('');
  toast.innerHTML = `
    <div class="update-toast__title">Nouveautés disponibles</div>
    <div>Des mises à jour ont été ajoutées au site.</div>
    <ul class="update-toast__list">${items}</ul>
  `;
  toast.hidden = false;
  toast.classList.add('show');

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Nouveautés DOCS 2025', {
      body: pendingUpdates[0].title + ' — ' + pendingUpdates[0].message,
      icon: './icons/icon.svg'
    });
  }

  localStorage.setItem(UPDATE_VERSION_KEY, String(SITE_UPDATE_VERSION));

  window.setTimeout(() => {
    toast.classList.remove('show');
    toast.hidden = true;
  }, 8000);
}

// Remplacer 'load' par 'DOMContentLoaded' pour s'exécuter IMMÉDIATEMENT
document.addEventListener('DOMContentLoaded', () => {
  const pageEnMemoire = localStorage.getItem('pageSauvegardee');

  if (pageEnMemoire && document.getElementById(pageEnMemoire)) {
    show(pageEnMemoire);
  } else {
    show('accueil');
  }

  initInstallPrompt();
  registerServiceWorker();
  initSearch();
  initImageGallery();
  showUpdateToast();
});


function applySearch() {
  const searchInput = document.getElementById('searchDocs');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const activePage = document.querySelector('.page.active');
  const emptyMessage = document.getElementById('search-empty-message');

  if (!activePage) return;

  const cards = activePage.querySelectorAll('.carte, .carteP, .carteC');

  if (cards.length === 0) {
    if (emptyMessage) emptyMessage.style.display = 'none';
    return;
  }

  let visibleCount = 0;

  cards.forEach(card => {
    const text = (card.textContent || '').toLowerCase();
    const shouldShow = !query || text.includes(query);
    card.style.display = shouldShow ? '' : 'none';
    if (shouldShow) visibleCount++;
  });

  if (emptyMessage) {
    emptyMessage.style.display = visibleCount === 0 && query ? 'block' : 'none';
  }
}

function initSearch() {
  const searchInput = document.getElementById('searchDocs');
  if (!searchInput) return;

  searchInput.addEventListener('input', applySearch);
  applySearch();
}

function openImageModal(src, alt = '') {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');

  if (!modal || !modalImage) return;

  modalImage.src = src;
  modalImage.alt = alt;
  modal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');

  if (!modal) return;

  modal.hidden = true;
  document.body.classList.remove('modal-open');

  if (modalImage) {
    modalImage.src = '';
    modalImage.alt = '';
  }
}

function initImageGallery() {
  const gallery = document.querySelector('.tapeInstall');
  if (!gallery) return;

  gallery.addEventListener('click', (event) => {
    const card = event.target.closest('.tapeInstall__item');
    const image = card ? card.querySelector('img') : null;

    if (!image) return;
    openImageModal(image.getAttribute('src'), image.getAttribute('alt'));
  });

  const modal = document.getElementById('imageModal');
  const closeButton = document.querySelector('.image-modal__close');

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target.matches('[data-close="true"]')) {
        closeImageModal();
      }
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeImageModal);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeImageModal();
    }
  });
}

const installButton = document.getElementById('installButton');
if (installButton) {
  installButton.addEventListener('click', installApp);
}

const dismissInstallButton = document.getElementById('dismissInstallButton');
if (dismissInstallButton) {
  dismissInstallButton.addEventListener('click', () => {
    localStorage.setItem('pwaInstallDismissed', 'true');
    hideInstallPrompt();
  });
}

