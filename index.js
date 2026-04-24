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

