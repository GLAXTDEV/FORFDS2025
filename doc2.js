const matiere = document.querySelector("");
const liste0= [
    {image: "IMG/pdf3.jpg", nomDoc: "", lien: ""}
];
liste0.forEach(m=>{
    const nouveau = document.createElement("div");
    nouveau.className = "tapeInstall__item";
    nouveau.innerHTML = `
        <img src="${m.image}" alt="${m.nomDoc}">
        <div class="tapeInstall__item__info">
            <h3>${m.nomDoc}</h3>
            <a href="${m.lien}" target="_blank">Voir le document</a>
        </div>
    `;
    matiere.appendChild(nouveau);
});

const matiere1 = document.querySelector("");
const liste1= [
    {image: "IMG/pdf5.png", nomDoc: "PHY 202", lien: "phy/"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 203 (TP)", lien: "phy/"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 204", lien: "phy/"},
    {image: "IMG/pdf5.png", nomDoc: "PHY 112", lien: "phy/"},
    {image: "IMG/pdf5.png", nomDoc: "CHM 211", lien: "phy/"},
    {image: "IMG/pdf5.png", nomDoc: "CHM 141", lien: "phy/"},
    {image: "IMG/pdf5.png", nomDoc: "MTH 107", lien: "phy/"},
];
liste1.forEach(m1=>{
    const nouveau1 = document.createElement("div");
    nouveau1.className = "tapeInstall__item_1";
    nouveau1.innerHTML = `
        <img src="${m1.image}" alt="${m1.nomDoc}">
        <div class="tapeInstall__item__info">
            <h3>${m1.nomDoc}</h3>
            <a href="${m1.lien}" target="_blank">Voir le document</a>
        </div>
    `;
    matiere1.appendChild(nouveau1);
});

const matiere2 = document.querySelector("");
const liste2= [
    {image: "IMG/pdf4.jpg", nomDoc: "", lien: ""}
];
liste2.forEach(m2=>{
    const nouveau2 = document.createElement("div");
    nouveau2.className = "tapeInstall__item_2";
    nouveau2.innerHTML = `
        <img src="${m2.image}" alt="${m2.nomDoc}">
        <div class="tapeInstall__item__info">
            <h3>${m2.nomDoc}</h3>
            <a href="${m2.lien}" target="_blank">Voir le document</a>
        </div>
    `;
    matiere2.appendChild(nouveau2);
});

