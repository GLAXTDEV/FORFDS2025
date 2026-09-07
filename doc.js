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
    {image: "IMG/pdf3.jpg", nomDoc: "ANG 201", lien: "phy/ang201new.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH102 (Anneaux)", lien: "math/ChapII Anneaux 2014.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 102 CHAP 1&2", lien: "math/Cours Chapitre 1&2  de MTH 102.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 160", lien: "math/cours complet de MTH160.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 104", lien: "math/MATH104 now.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 109", lien: "math/Cours complet de MTH 109.pdf"},
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
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 101 MARTICE TD", lien: "/math/td math/TD MTH101 MATRICE.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 101 TD", lien: "/math/td math/TD_MTH101.pdf"},
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
    {image: "IMG/pdf5.png", nomDoc: "CHM 101", lien: "chm/CHM101 Cours complet.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "CHM 106", lien: "chm/CHM106.pdf"},
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
const lesDocumentsPhysicM = [
    {image: "IMG/pdf5.png", nomDoc: "ANG 201", lien: "phy/ang201new.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH102 (Anneaux)", lien: "math/ChapII Anneaux 2014.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 102 CHAP 1&2", lien: "math/Cours Chapitre 1&2  de MTH 102.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 104", lien: "math/MATH104 now.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 110", lien: "math/cours complet de PHY 110.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 108", lien: "math/Cours complet de PHY 108.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "CHM 103", lien: "phy/PRESENTATION-CHM103-2026_023819.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "INFO 100", lien: "phy/COURS DINFO 100.pdf"},
];
lesDocumentsPhysicM.forEach(doc => {
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
        physicM.appendChild(carteH);
        afficherTaille(doc.lien, carteH.querySelector('.taille'));
});

const physicTD = document.querySelector('.page-physic-TD');
const lesDocumentsPhysicTD = [
    {image: "IMG/pdf5.png", nomDoc: "EXERCICE ELECTROSTATIQUE", lien: "phy/td phy/12-Exo-elect_Cours PHY104.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 110 EXAMEN 20-21", lien: "phy/td phy/Corrige_Type_Examen_PHY110_2021.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 110 TD 21", lien: "phy/td phy/TRAVAUX DIRIGES UE PHY 110_2021.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 110 CORRIGE TD 21", lien: "phy/td phy/CORRIGE_TYPE_TD_PHY110.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "ELECTRO_STATIQUE_CINETIQUE", lien: "phy/td phy/ELECTROCINETIQUE.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 106 EXAMEN 18-19", lien: "phy/td phy/épreuves Phy106.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "COMPILATION PHY110", lien: "phy/td phy/Exam PHY 110. pdf (2).pdf"},
    {image: "IMG/pdf5.png", nomDoc: "INFO 100 EXAMEN 21-22", lien: "phy/td phy/Examen INF100 2022.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "INFO 100 EXAMEN 23-24", lien: "phy/td phy/Examen INF100 2024.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "INFO 100 EXAMEN 24-25", lien: "phy/td phy/Examen INF100 2025.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "ELECTROMAGNETISME LIVRE", lien: "phy/td phy/Livre_Electromagnétisme-1.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "ELETROMAGNETISME EXO-CORRIGE", lien: "phy/td phy/Livre_Exos corrigés.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MAGNETOSTATIQUE EXO-CORRIGE", lien: "phy/td phy/magnétostatique exercices.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 106 TD1", lien: "phy/td phy/MECANIQUE_TD_COMPLET_1_avec_CORRIGE.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 106 TD2", lien: "phy/td phy/MECANIQUE_TD_COMPLET_2_avec_CORRIGE.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 108 TD", lien: "phy/td phy/TD PH108.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 104 TD 23", lien: "phy/td phy/TD PHY104.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 104 TD 17-18", lien: "phy/td phy/TD.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 108 TD", lien: "phy/td phy/TD_PHY108.pdf"},
];
lesDocumentsPhysicTD.forEach(doc => {
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
        physicTD.appendChild(carteH);
        afficherTaille(doc.lien, carteH.querySelector('.taille'));
});


const chmH = document.querySelector('.page-chm-H');
lesDocumentsChmH = [
    {image: "IMG/pdf4.jpg", nomDoc: "ANG 200", lien: "math/ANG200.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "PHY 104", lien: "phy/PHY 104.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "PHY 106 cinematic", lien: "phy/PHY106 _ Chap 1 cinematic.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "PHY 106 Mvts des particuliers", lien: "phy/PHY106_Chap_2_Mvts_particuliers.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "PHY 106 Cpst de mouvement", lien: "phy/PHY106_Chap3.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "PHY 106 Point materiel", lien: "phy/PHY106_point_materiel.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "PHY 106 Outils mathematiques", lien: "phy/PHY106_OutilsMathématique.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "MTH 100", lien: "phy/MATH100.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "MTH 101", lien: "phy/Cours MTH 101 complet.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "MTH 103", lien: "phy/MTH103.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 101", lien: "chm/CHM101 Cours complet.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 106", lien: "chm/CHM106.pdf"},
];
lesDocumentsChmH.forEach(doc => {
        const carteH = document.createElement('div');
        carteH.className = "carteC";
        carteH.innerHTML = `
            <img src="${doc.image}" alt="${doc.nomDoc}">
            <h3>${doc.nomDoc}<span class="taille"></span></h3>
            <div class="carteDiv">
                <a href="${doc.lien}" target="_blank">Ouvrir</a>
                <a href="${doc.lien}" download>Télécharger</a>
            </div>
        `;
        chmH.appendChild(carteH);
        afficherTaille(doc.lien, carteH.querySelector('.taille'));
});
const chmM = document.querySelector('.page-chm-M');
const lesDocumentsChmM = [
    {image: "IMG/pdf4.jpg", nomDoc: "ANG 201", lien: "phy/ang201new.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "MTH102 (Anneaux)", lien: "math/ChapII Anneaux 2014.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "MTH 102 CHAP 1&2", lien: "math/Cours Chapitre 1&2  de MTH 102.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "MTH 104", lien: "math/MATH104 now.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "PHY 110", lien: "math/cours complet de PHY 110.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "PHY 108", lien: "math/Cours complet de PHY 108.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 103", lien: "phy/PRESENTATION-CHM103-2026_023819.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "INFO 100", lien: "phy/COURS DINFO 100.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "MTH106", lien: "chm/MTH106.pdf"},
];
lesDocumentsChmM.forEach(doc => {
        const carteH = document.createElement('div');
        carteH.className = "carteC";
        carteH.innerHTML = `
            <img src="${doc.image}" alt="${doc.nomDoc}">
            <h3>${doc.nomDoc}<span class="taille"></span></h3>
            <div class="carteDiv">
                <a href="${doc.lien}" target="_blank">Ouvrir</a>
                <a href="${doc.lien}" download>Télécharger</a>
            </div>
        `;
        chmM.appendChild(carteH);
        afficherTaille(doc.lien, carteH.querySelector('.taille'));
});

const chmTD = document.querySelector('.page-chm-TD');
const lesDocumentsChmTD = [
    {image: "IMG/pdf4.jpg" ,nomDoc: "CHM 106 TD", lien: "chm/td chm/3 CHM106_TD THERMO.pdf"},
    {image: "IMG/pdf4.jpg" ,nomDoc: "TABLEAUX PERIODIQUE", lien: "chm/td chm/tableau-periodic.pdf"},
    {image: "IMG/pdf4.jpg" ,nomDoc: "CHM 103 TD", lien: "chm/td chm/TD_ CHM103.pdf"},
];
lesDocumentsChmTD.forEach(doc => {
        const carteH = document.createElement('div');
        carteH.className = "carteC";
        carteH.innerHTML = `
            <img src="${doc.image}" alt="${doc.nomDoc}">
            <h3>${doc.nomDoc}<span class="taille"></span></h3>
            <div class="carteDiv">
                <a href="${doc.lien}" target="_blank">Ouvrir</a>
                <a href="${doc.lien}" download>Télécharger</a>
            </div>
        `;
        chmTD.appendChild(carteH);
        afficherTaille(doc.lien, carteH.querySelector('.taille'));
});

const btne = document.querySelector('#bouton');

btne.addEventListener('click', () => {
  const avert = window.confirm("Attention : L'accès à cette page nécessite une *bonne connexion* internet. L'utilisation d'une *connexion limitée* est déconseillée. Voulez-vous continuer ?");
  if (avert === true) {
    window.location.href = "https://docs2025video.vercel.app/";
  } else{ window.location.href = ""}
});


const pageImage = document.querySelector('#hPageImageContainer');
const modal = document.getElementById('hImageModal');
const modalImg = document.getElementById('hImgModalTarget');

const listeImage = [
    {link: "image scientifique/English verbs.jpg" },
    {link: "image scientifique/English verbs end by er.jpg" },
    {link: "image scientifique/English verbs.jpg" },
    {link: "image scientifique/English time tense.jpg" },
    {link: "image scientifique/English synonymes.jpg" },
    {link: "image scientifique/English antonymes.jpg" },
    {link: "image scientifique/mathematics angle.jpg" },
    {link: "image scientifique/mathématiques à propos des intégral.jpg" },
    {link: "image scientifique/mathématiques développement.jpg" },
    {link: "image scientifique/mathématiques differentiation.jpg" },
    {link: "image scientifique/mathématiques équation quadratique.jpg" },
    {link: "image scientifique/mathématiques formule de suite.jpg" },
    {link: "image scientifique/mathématiques formule des théorème binomial.jpg" },
    {link: "image scientifique/mathématiques intégrale.jpg" },
    {link: "image scientifique/mathématiques identité.jpg" },
    {link: "image scientifique/mathématiques intégrale 1.jpg" },
    {link: "image scientifique/mathématiques intégrale 2.jpg" },
    {link: "image scientifique/mathématiques intégrale 3.jpg" },
    {link: "image scientifique/mathématiques puissance.jpg" },
    {link: "image scientifique/mathématiques somme.jpg" },
    {link: "image scientifique/mathématiques type d'intégration.jpg" },
    {link: "image scientifique/mathématiques volume.jpg" },
    {link: "image scientifique/physique symbole.jpg" },
    {link: "image scientifique/physique const.jpg" },
    {link: "image scientifique/physique constante.jpg" },
    {link: "image scientifique/physique unité de mesure.jpg" },
];

listeImage.forEach(lesImage => {
    const creation = document.createElement('div');
    creation.className = "carteImage"; 

    creation.innerHTML = `
    <div>
        <img src="${lesImage.link}" alt="${lesImage.titre}" class="imgTrigger">
    </div>
    `;
    
    // Ouvre la modale au clic sur l'image
    const imgElement = creation.querySelector('.imgTrigger');
    imgElement.addEventListener('click', () => {
        modalImg.src = lesImage.link;
        modal.classList.add('active');
    });

    pageImage.appendChild(creation);
});

// Ferme la modale en cliquant n'importe où sur le fond flou
modal.addEventListener('click', () => {
    modal.classList.remove('active');
});