const matiere = document.querySelector(".page-math-H2");
const liste0= [
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 220", lien: "document2/MTH 220 cours Complet.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 221", lien: "document2/MTH 221.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 222 (p1)", lien: "document2/MTH 222 P1.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 227", lien: "document2/MTH 227.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 112", lien: "phy/PHY 112.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 203", lien: "document2/"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 202", lien: "phy/PHY 202.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "info 101", lien: "document2/INF 101_022525.pdf"}
];
liste0.forEach(m=>{
    const nouveau = document.createElement("div");
    nouveau.className = "tapeInstall__item0";
    nouveau.innerHTML = `
        <img src="${m.image}" alt="${m.nomDoc}">
        <span style="color: red; font-weight: bold;">certain docs ne sont pas disponible</span>
        <div class="tapeInstall__item__info">
            <h3>${m.nomDoc}</h3>
            <a href="${m.lien}" target="_blank">Voir le document</a>
            <a href="${m.lien}"  class="btn" download>Télécharger</a>
        </div>
    `;
    matiere.appendChild(nouveau);
});

const matiere0 = document.querySelector(".page-math-M2");
const liste00= [
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 223", lien: "document2/MTH 223.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 228", lien: "document2/MTH 228.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "MTH 229 (2024)", lien: "document2/MTH 229(2024).pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 208", lien: "phy/PHY108.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "PHY 210", lien: "document2/"},
    {image: "IMG/pdf3.jpg", nomDoc: "INFO 102", lien: "document2/Cours_INF102.pdf"},
    {image: "IMG/pdf3.jpg", nomDoc: "INFO 201", lien: ""}
];
liste00.forEach(m0=>{
    const nouveau0 = document.createElement("div");
    nouveau0.className = "tapeInstall__item0";
    nouveau0.innerHTML = `
        <img src="${m0.image}" alt="${m0.nomDoc}">
        <span style="color: red; font-weight: bold;">certain docs ne sont pas disponible</span>
        <div class="tapeInstall__item__info">
            <h3>${m0.nomDoc}</h3>
            <a href="${m0.lien}" target="_blank">Voir le document</a>
            <a href="${m0.lien}" class="btn" download>Télécharger</a>
        </div>
    `;
    matiere0.appendChild(nouveau0);
});

// partie physique h et m 2
const matiere1 = document.querySelector(".page-physic-H2");
const liste1= [
    {image: "IMG/pdf5.png", nomDoc: "PHY 202", lien: "phy/document2/Support -New  UE PHY202_THERMODYNAMIQUE-New.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 203 (TP)", lien: "document2/"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 204", lien: "document2/phy204.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 112", lien: "phy/PHY 112.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "CHM 211", lien: "document2/CHM 211.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "CHM 141", lien: "document2/CHM 141.pdf"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 107", lien: "phy/MTH107.pdf"},
];
liste1.forEach(m1=>{
    const nouveau1 = document.createElement("div");
    nouveau1.className = "tapeInstall__item_1";
    nouveau1.innerHTML = `
        <img src="${m1.image}" alt="${m1.nomDoc}">
        <span style="color: red; font-weight: bold;">certain docs ne sont pas disponible</span>
        <div class="tapeInstall__item__info">
            <h3>${m1.nomDoc}</h3>
            <a href="${m1.lien}" target="_blank">Voir le document</a>
            <a href="${m1.lien}" class="btn" download>Télécharger</a>
        </div>
    `;
    matiere1.appendChild(nouveau1);
});

const matiere11 = document.querySelector(".page-physic-M2");
const liste11= [
    {image: "IMG/pdf5.png", nomDoc: "PHY 200", lien: "document2/"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 206", lien: "document2/"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 208", lien: "document2/"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 210", lien: "document2/"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 310", lien: "document2/"},
    {image: "IMG/pdf5.png", nomDoc: "CHM 323 (TP)", lien: "document2/"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 160 (2024)", lien: "phy/MTH 160(2024).pdf"},
];
liste11.forEach(m11=>{
    const nouveau11 = document.createElement("div");
    nouveau11.className = "tapeInstall__item_1";
    nouveau11.innerHTML = `
        <img src="${m11.image}" alt="${m11.nomDoc}">
        <span style="color: red; font-weight: bold;">certain docs ne sont pas disponible</span>
        <div class="tapeInstall__item__info">
            <h3>${m11.nomDoc}</h3>
            <a href="${m11.lien}" target="_blank">Voir le document</a>
            <a href="${m11.lien}" class="btn" download>Télécharger</a>
        </div>
    `;
    matiere11.appendChild(nouveau11);
});

// chimie parie h et m 2
const matiere2 = document.querySelector(".page-chm-H2");
const liste2= [
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 211", lien: "phy/CHM 211.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 141", lien: "phy/CHM 141.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 161", lien: "phy/CHM 161.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 307 (TP)", lien: "document2/"},
    {image: "IMG/pdf4.jpg", nomDoc: "PHY 112", lien: "phy/PHY 112.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "PHY 203", lien: "document2/"},
    {image: "IMG/pdf4.jpg", nomDoc: "MTH 107", lien: "phy/MTH107.pdf"},
    {image: "IMG/pdf4.jpg", nomDoc: "ANG 200", lien: "phy/ANG200.pdf"},
];
liste2.forEach(m2=>{
    const nouveau2 = document.createElement("div");
    nouveau2.className = "tapeInstall__item_2";
    nouveau2.innerHTML = `
        <img src="${m2.image}" alt="${m2.nomDoc}">
        <span style="color: red; font-weight: bold;">certain docs ne sont pas disponible</span>
        <div class="tapeInstall__item__info">
            <h3>${m2.nomDoc}</h3>
            <a href="${m2.lien}" target="_blank">Voir le document</a>
            <a href="${m2.lien}" class="btn" download>Télécharger</a>
        </div>
    `;
    matiere2.appendChild(nouveau2);
});

const matiere22 = document.querySelector(".page-chm-M2");
const liste22= [
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 104", lien: "document2/"},
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 214", lien: "document2/"},
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 142", lien: "document2/"},
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 163", lien: "document2/"},
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 323 (TP)", lien: "document2/"},
    {image: "IMG/pdf4.jpg", nomDoc: "CHM 212", lien: "document2/"},
    {image: "IMG/pdf4.jpg", nomDoc: "BCH 222", lien: "document2/"},
    {image: "IMG/pdf4.jpg", nomDoc: "ANG 201", lien: "phy/ang201new.pdf"},
];
liste22.forEach(m22=>{
    const nouveau22 = document.createElement("div");
    nouveau22.className = "tapeInstall__item_2";
    nouveau22.innerHTML = `
        <img src="${m22.image}" alt="${m22.nomDoc}">
        <span style="color: red; font-weight: bold;">certain docs ne sont pas disponible</span>
        <div class="tapeInstall__item__info">
            <h3>${m22.nomDoc}</h3>
            <a href="${m22.lien}" target="_blank">Voir le document</a>
            <a href="${m22.lien}" class="btn" download>Télécharger</a>
        </div>
    `;
    matiere22.appendChild(nouveau22);
});