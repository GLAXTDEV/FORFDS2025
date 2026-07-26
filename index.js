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

// Remplacer 'load' par 'DOMContentLoaded' pour s'exécuter IMMÉDIATEMENT
document.addEventListener('DOMContentLoaded', () => {
  const pageEnMemoire = localStorage.getItem('pageSauvegardee');

  if (pageEnMemoire && document.getElementById(pageEnMemoire)) {
    show(pageEnMemoire);
  } else {
    show('accueil'); // Votre page par défaut
  }
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

document.addEventListener('DOMContentLoaded', initSearch);