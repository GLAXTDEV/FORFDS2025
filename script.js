window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    
    // On attend 3 secondes avant de commencer la transition de sortie
    setTimeout(() => {
        splash.classList.add('hidden-splash');
        
        // On retire l'élément du DOM après la fin de la transition CSS (0.8s)
        setTimeout(() => {
            splash.style.display = 'none';
        }, 800);
        
    }, 3000); 
});