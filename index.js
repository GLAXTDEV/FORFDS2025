function show(id){
  //caher tout les page 'page'
  document.querySelectorAll('.page').forEach(pageActive =>{
    pageActive.classList.remove('active');
  });
  //afficher celui sur qui on clique
  document.getElementById(id).classList.add('active');
}