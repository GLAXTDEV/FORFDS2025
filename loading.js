(() => {
  let hideTimer = null;

  function getLoader() {
    return document.getElementById('siteLoader');
  }

  function setVisible(isVisible, message = 'Chargement...') {
    const loader = getLoader();
    if (!loader) return;

    const messageElement = loader.querySelector('.site-loader__message');
    if (messageElement) messageElement.textContent = message;

    loader.classList.toggle('is-visible', isVisible);
    loader.setAttribute('aria-hidden', String(!isVisible));
    document.body.classList.toggle('is-loading', isVisible);
  }

  function waitForImages(container) {
    if (!container) return Promise.resolve();

    const images = [...container.querySelectorAll('img')].filter(image => !image.complete);
    if (!images.length) return Promise.resolve();

    return Promise.all(images.map(image => new Promise(resolve => {
      const finish = () => {
        image.removeEventListener('load', finish);
        image.removeEventListener('error', finish);
        resolve();
      };

      image.addEventListener('load', finish, { once: true });
      image.addEventListener('error', finish, { once: true });
    })));
  }

  function finishLoading() {
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      requestAnimationFrame(() => setVisible(false));
    }, 180);
  }

  function startPageLoading(page) {
    window.clearTimeout(hideTimer);
    setVisible(true, 'Chargement de la page...');

    const fallbackTimer = window.setTimeout(() => {
      finishLoading();
    }, 2500);

    waitForImages(page).then(() => {
      window.clearTimeout(fallbackTimer);
      finishLoading();
    }, () => {
      window.clearTimeout(fallbackTimer);
      finishLoading();
    });
  }

  window.siteLoader = {
    startPageLoading,
    show(message = 'Chargement...') {
      window.clearTimeout(hideTimer);
      setVisible(true, message);
    },
    hide() {
      window.clearTimeout(hideTimer);
      setVisible(false);
    }
  };

  window.addEventListener('load', () => {
    window.setTimeout(() => setVisible(false), 250);
  }, { once: true });
})();
