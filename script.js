function filtrerElements() {
    const recherche = document.getElementById("searchBar").value.toLowerCase().trim();
    const items = document.querySelectorAll(".docs-harm> div[data-nom]");
    let nbVisible = 0;

    items.forEach(item => {
        const nom = item.getAttribute("data-nom").toLowerCase();

        if (recherche === "") {
            // Barre vide → tout afficher
            item.style.display = "";
            nbVisible++;

        } else if (nom.includes(recherche)) {
            // Correspond → afficher
            item.style.display = "";
            nbVisible++;

            // Correspondance exacte → scroll + surbrillance
            if (nom === recherche) {
                setTimeout(() => {
                    item.scrollIntoView({ behavior: "smooth", block: "center" });
                    item.style.boxShadow = "0 0 25px yellow";
                    item.style.borderRadius = "10px";
                    setTimeout(() => {
                        item.style.boxShadow = "";
                    }, 3000);
                }, 200);
            }

        } else {
            // Ne correspond pas → cacher
            item.style.display = "none";
        }
    });

    // Message aucun résultat
    const noResult = document.getElementById("noResult");
    if (nbVisible === 0 && recherche !== "") {
        noResult.style.display = "block";
        noResult.innerHTML = '❌ Aucun résultat trouvé pour "<strong>' + recherche.toUpperCase() + '</strong>"';
    } else {
        noResult.style.display = "none";
    }
}