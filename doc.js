
const mathH = document.querySelector('.page-math-H');
const lesDocumentsMathematiqueH = [
    {image: "IMG/pdf5.png", nomDoc: "ANG 200", lien: "math/ANG200.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 104", lien: "phy/PHY 104.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 106 cinematic", lien: "phy/PHY106 _ Chap 1 cinematic.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 106 Mvts des particuliers", lien: "phy/PHY106_Chap_2_Mvts_particuliers.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 106 Cpst de mouvement", lien: "phy/PHY106_Chap3.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 106 Point materiel", lien: "phy/PHY106_point_materiel.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 106 Outils mathematiques", lien: "phy/PHY106_OutilsMathématique.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 100", lien: "phy/MATH100.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 101", lien: "phy/Cours MTH 101 complet.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 103", lien: "phy/MTH103.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 106", lien: "math/MTH106.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 108", lien: "math/Cours complet de PHY 108.pdf"},

];

// Fonction simple pour calculer et afficher la taille du fichier
function afficherTaille(lien, element) {
    fetch(lien, { method: 'HEAD' }).then(res => {
        const bytes = res.headers.get('Content-Length');
        if (bytes) {
            element.textContent = ` (${(bytes / (1024 * 1024)).toFixed(2)} Mo)`;
        }
    });
}

lesDocumentsMathematiqueH.forEach(doc => {
        const carteH = document.createElement('div');
        carteH.className = "carte";  
        carteH.innerHTML = `
            <img src="${doc.image}" alt="${doc.nomDoc}">
            <h3>${doc.nomDoc}<span class="taille"></span></h3>
            <div class="carteDiv">
                <a href="${doc.lien}" target="_blank">Ouvrir</a>
                <a href="${doc.lien}" download>Télécharger</a>
            </div>
        `;
        mathH.appendChild(carteH);
        afficherTaille(doc.lien, carteH.querySelector('.taille'));
});

const mathM = document.querySelector('.page-math-M');
const lesDocumentsMathematiqueM =[
    {image: "IMG/pdf5.png", nomDoc: "ANG 200", lien: "phy/ang201new.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH102 (Anneaux)", lien: "math/ChapII Anneaux 2014.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 102 CHAP 1&2", lien: "math/Cours Chapitre 1&2  de MTH 102.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 160", lien: "math/cours complet de MTH160.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 104", lien: "math/MATH104 now.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 110", lien: "math/cours complet de PHY 110.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 108", lien: "math/Cours complet de PHY 108.pdf"},
];

lesDocumentsMathematiqueM.forEach(doc => {
        const carteH = document.createElement('div');
        carteH.className = "carte";
        carteH.innerHTML = `
            <img src="${doc.image}" alt="${doc.nomDoc}">
            <h3>${doc.nomDoc}<span class="taille"></span></h3>
            <div class="carteDiv">
                <a href="${doc.lien}" target="_blank">Ouvrir</a>
                <a href="${doc.lien}" download>Télécharger</a>
            </div>
        `;
        mathM.appendChild(carteH);
        afficherTaille(doc.lien, carteH.querySelector('.taille'));

});


const mathTD = document.querySelector('.page-math-TD');
const lesDocumentsMathematiqueTD = [
    {image: "IMG/pdf5.png", nomDoc: "MTH 108 corrigee 19-20", lien: "/math/td math/CorrigédeMTH108.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 101 21-22", lien: "/math/td math/EPR MTH10121-22.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 100 2023", lien: "/math/td math/EPR_MTH100 février2023.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "COMPILATIONS MTH", lien: "/math/td math/Examen-FDS-Dept-Mathe-matiques-23-24-part1 (1).pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 108 TD", lien: "/math/td math/espaces_affines.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "BARICENTRE", lien: "/math/td math/le-barycentre-dans-le-plan-exercices-corriges-1.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "APPLICATION AFFINE TD", lien: "/math/td math/"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 102 TD", lien: "/math/td math/"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 104 N1", lien: "/math/td math/"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 104 N2", lien: "/math/td math/"},
    {image: "IMG/pdf5.png", nomDoc: "INTEGRALE", lien: "/math/td math/"},
    {image: "IMG/pdf5.png", nomDoc: "AIDE MTH", lien: "/math/td math/"},
    {image: "IMG/pdf5.png", nomDoc: "", lien: "/math/td math/"},
    
];
lesDocumentsMathematiqueTD.forEach(doc => {
        const carteH = document.createElement('div');
        carteH.className = "carte";
        carteH.innerHTML = `
            <img src="${doc.image}" alt="${doc.nomDoc}">
            <h3>${doc.nomDoc}<span class="taille"></span></h3>
            <div class="carteDiv">
                <a href="${doc.lien}" target="_blank">Ouvrir</a>
                <a href="${doc.lien}" download>Télécharger</a>
            </div>
        `;
        mathTD.appendChild(carteH);
        afficherTaille(doc.lien, carteH.querySelector('.taille'));

});

const mathE = document.querySelector('.page-math-E');
const lesDocumentsMathematiqueEXAM = [
    {image: "IMG/pdf5.png", nomDoc: "", lien: ""},
    {image: "IMG/pdf5.png", nomDoc: "", lien: ""},
    {image: "IMG/pdf5.png", nomDoc: "", lien: ""},
    {image: "IMG/pdf5.png", nomDoc: "", lien: ""},
    {image: "IMG/pdf5.png", nomDoc: "", lien: ""},
]





const physicH = document.querySelector('.page-physic-H');
const physicM = document.querySelector('.page-physic-M');
const physicE = document.querySelector('.page-physic-E');
const physicTD = document.querySelector('.page-physic-TD');


const chmH = document.querySelector('.page-chm-H');
const chmM = document.querySelector('.page-chm-M');
const chmE = document.querySelector('.page-chm-E');
const chmTD = document.querySelector('.page-chm-TD');