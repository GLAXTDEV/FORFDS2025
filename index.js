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
    btn.textContent = "☀️"
  }
  else {
    btn.textContent = "🌙"
  };
});

const accueil = document.querySelector('#text-1');
accueil.addEventListener('click', () => {
  accueil.textContent = "accueil";
  accueil.style.animation = "none";
  window.setTimeout(() =>{
    accueil.textContent = "ARCHIVES";
    accueil.style.animation = "";
  }, 4000)
});


