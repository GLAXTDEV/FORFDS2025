// Fonction simple pour calculer et afficher la taille du fichier
function afficherTaille(lien, element) {
    fetch(lien, { method: 'HEAD' }).then(res => {
        const bytes = res.headers.get('Content-Length');
        if (bytes) {
            element.textContent = ` (${(bytes / (1024 * 1024)).toFixed(3)} Mo)`;
        }
    });
}

const mathH = document.querySelector('.page-math-H');
const lesDocumentsMathematiqueH = [
    {image: "IMG/pdf3.jpg", nomDoc: "ANG 200", lien: "math/ANG200.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 104", lien: "phy/PHY 104.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 106 cinematic", lien: "phy/PHY106 _ Chap 1 cinematic.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 106 Mvts des particuliers", lien: "phy/PHY106_Chap_2_Mvts_particuliers.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 106 Cpst de mouvement", lien: "phy/PHY106_Chap3.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 106 Point materiel", lien: "phy/PHY106_point_materiel.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 106 Outils mathematiques", lien: "phy/PHY106_OutilsMathématique.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 100", lien: "phy/MATH100.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 101", lien: "phy/Cours MTH 101 complet.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 103", lien: "phy/MTH103.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 106", lien: "math/MTH106.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 108", lien: "math/Cours complet de PHY 108.pdf"},

];
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
    {image: "IMG/pdf3.jpg", nomDoc: "ANG 200", lien: "phy/ang201new.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH102 (Anneaux)", lien: "math/ChapII Anneaux 2014.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 102 CHAP 1&2", lien: "math/Cours Chapitre 1&2  de MTH 102.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 160", lien: "math/cours complet de MTH160.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 104", lien: "math/MATH104 now.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 110", lien: "math/cours complet de PHY 110.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 108", lien: "math/Cours complet de PHY 108.pdf"},
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
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 108 corrigee 19-20", lien: "/math/td math/Corrigéde MTH108.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 101 21-22", lien: "/math/td math/EPR MTH10121-22.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 100 2023", lien: "/math/td math/EPR_MTH100 février2023.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "COMPILATIONS MTH 1", lien: "/math/td math/Examen-FDS-Dept-Mathe-matiques-23-24-part1 (1).pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 108 TD", lien: "/math/td math/espaces_affines.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "BARYCENTRE", lien: "/math/td math/le-barycentre-dans-le-plan-exercices-corriges-1.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 108 EXAMEN CORRIGE 23", lien: "/math/td math/exam-mth108-H23.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "COMPILATION MTH 2", lien: "/math/td math/les anciennes épreuves.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 101 21-22", lien: "/math/td math/math101 epv.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "COMPILATION MTH 103", lien: "/math/td math/MATH103 Devoirs Examens TD.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "COMPILATION MTH 106 & 108", lien: "/math/td math/math108 & math 106.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH MPSI LIVRE", lien: "/math/td math/Maths_MPSI_HPrépa_Tout_en_un_M_Allano_Chevalier,_X_Oudot_Z_Library.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "AIDE CALCULE D'INTEGRALE", lien: "/math/td math/methode de calcule d'integrale.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "EXAMEN CORRIGE MTH 106", lien: "/math/td math/MTH 160  EXAMEN CORR.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "EXAMEN MTH 102 17-18", lien: "/math/td math/MTH102-DS-M18.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "ESPACE VECTORIEL", lien: "/math/td math/space vectoriel.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 102 TD", lien: "/math/td math/TD MTH 102 PDF.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 100 TD", lien: "/math/td math/TD MTH100 2025-2026.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 101 MARTICE TD", lien: "/math/td math/TD MTH101 2.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 101 TD", lien: "/math/td math/TD MTH101.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 101 ESPACE VECTORIEL TD", lien: "/math/td math/TD_Espaces-Appl_20-21 (1)_014941.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 100 TD", lien: "/math/td math/TD_MTH100_034005.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 104 TD1", lien: "/math/td math/TD1_MTH104_080830.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 104 TD2", lien: "/math/td math/TD2_MTH104_UL.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 108 GEOMETRIE AFFINE", lien: "/math/td math/TD-MTH108.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "APPLICATIONS AFFINES TD", lien: "/math/td math/travaux-diriges-applications-affines.pdf"},
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


const physicH = document.querySelector('.page-physic-H');
const lesDocumentsPhysiqueH = [
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
lesDocumentsPhysiqueH.forEach(doc => {
        const carteH = document.createElement('div');
        carteH.className = "carteP";
        carteH.innerHTML = `
            <img src="${doc.image}" alt="${doc.nomDoc}">
            <h3>${doc.nomDoc}<span class="taille"></span></h3>
            <div class="carteDiv">
                <a href="${doc.lien}" target="_blank">Ouvrir</a>
                <a href="${doc.lien}" download>Télécharger</a>
            </div>

        `;
        physicH.appendChild(carteH);
        afficherTaille(doc.lien, carteH.querySelector('.taille'));
});

const physicM = document.querySelector('.page-physic-M');

const physicTD = document.querySelector('.page-physic-TD');


const chmH = document.querySelector('.page-chm-H');
const chmM = document.querySelector('.page-chm-M');
const chmTD = document.querySelector('.page-chm-TD');

const lesDocumentsPhysique = [
    {image: "" ,nomDoc: "", lien: ""},
    {image: "" ,nomDoc: "", lien: ""},
    {image: "" ,nomDoc: "", lien: ""},
    {image: "" ,nomDoc: "", lien: ""},
    {image: "" ,nomDoc: "", lien: ""},
    {image: "" ,nomDoc: "", lien: ""},
    {image: "" ,nomDoc: "", lien: ""},
    {image: "" ,nomDoc: "", lien: ""},
    {image: "" ,nomDoc: "", lien: ""},
];