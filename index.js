function charger(templateId){
  const template = document.getElementById(templateId);
  const mainDisplay = document.getElementById('main-display');
  const pageTitle = document.getElementById('page-title');
  if (!template) {
    console.log("erro")
  };
  const nouveauTitre = template.getAttribute('data-titre');
  const nouveauContenu = template.content.cloneNode(true);
  pageTitle.innerText = nouveauTitre;
  mainDisplay.innerHTML ="";
  mainDisplay.appendChild(nouveauContenu);
}
window.onload = () => { 
  charger('page-accueil');
};

const btn = document.getElementById('bouton');
const pageBody = document.body;
btn.addEventListener('click', () => {
  if (pageBody.classList.toggle('modeFont')){
    btn.textContent = "G"
    alert("Cette fonctionnalité nécessite une bonne connexion, veillez rappuie dessus immédiatement si votre connexion n’est pas rapide.")
  }
  else {
    btn.textContent = "🏞️"
  }
 
});

 