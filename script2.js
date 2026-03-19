// ============================================================
//  PhysIA — Assistant IA pour le site de physique
//  Pour ajouter un nouveau cours : ajoutez son nom dans
//  COURS_DISPONIBLES et Claude le connaîtra automatiquement.
// ============================================================

const COURS_DISPONIBLES = [
  // — Physique —
  "PHY104 : Électricité & Magnétisme",
  "PHY106 Chap.1 : Cinématique",
  "PHY106 Chap.2 : Mouvements particuliers",
  "PHY106 Chap.3 : Dynamique newtonienne",
  "PHY106 Outils Mathématiques",
  // — Mathématiques —
  "MTH100 : Analyse (fonctions, limites, dérivées, intégrales)",
  "MTH101 : Algèbre linéaire (espaces vectoriels, matrices, applications linéaires)",
  "MTH103 : Probabilités & Statistiques",
  // — Chimie —
  "CHM101 : Chimie Générale",
  "CHM106 : Chimie Organique",
  // — Anglais —
  "ANG200 : Anglais Scientifique",
];

const SYSTEM_PROMPT = `Tu es PhysIA, un assistant pédagogique intégré dans un site de cours universitaires de physique/maths/chimie (Togo, Université, Semestre 1 2025-2026).

Cours disponibles sur le site :
${COURS_DISPONIBLES.map((c) => "• " + c).join("\n")}

RÈGLES DE RÉPONSE :
1. Réponds TOUJOURS en français.
2. Sois DIRECT : commence par la réponse, pas par des formules de politesse.
3. Sois CONCIS mais COMPLET : maximum 6-8 lignes sauf si une démonstration est demandée.
4. Utilise des formules LaTeX-style entre $ $ quand c'est utile (ex: $F = ma$, $\\vec{v} = \\frac{d\\vec{r}}{dt}$).
5. Donne TOUJOURS un exemple numérique court si pertinent.
6. Si la question sort des cours listés, dis-le clairement et propose ce que tu peux faire.
7. Structure tes réponses avec des tirets ou numéros si plus de 2 points.
8. Pour les démonstrations, montre les étapes clés seulement.`;

// ——— État de la conversation ———
let historique = [];
let enChargement = false;

// ——— Fonctions utilitaires ———
function renderMath(text) {
  // Remplace $...$ par du HTML stylisé pour les formules
  return text
    .replace(/\$\$(.+?)\$\$/gs, '<span class="formula block-formula">$1</span>')
    .replace(/\$(.+?)\$/g, '<span class="formula">$1</span>');
}

function formatMessage(text) {
  // Gras **...**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italique *...*
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Listes — ou -
  text = text.replace(/^[—\-•] (.+)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  // Sauts de ligne
  text = text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
  text = renderMath(text);
  return '<p>' + text + '</p>';
}

// ——— Appel API Claude ———
async function envoyerMessage(question) {
  if (enChargement || !question.trim()) return;
  enChargement = true;

  // Ajoute la question à l'historique
  historique.push({ role: "user", content: question });

  // Affiche la question
  ajouterBulle("user", question);

  // Indicateur de chargement
  const loadingId = afficherChargement();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: historique,
      }),
    });

    if (!response.ok) throw new Error(`Erreur API: ${response.status}`);

    const data = await response.json();
    const reponse = data.content?.[0]?.text || "Aucune réponse reçue.";

    // Ajoute la réponse à l'historique
    historique.push({ role: "assistant", content: reponse });

    // Supprime le loader et affiche la réponse
    supprimerChargement(loadingId);
    ajouterBulle("assistant", reponse);

  } catch (err) {
    supprimerChargement(loadingId);
    ajouterBulle("error", "❌ Erreur de connexion. Vérifie ta connexion internet.");
    console.error(err);
  }

  enChargement = false;
}

// ——— DOM ———
function ajouterBulle(role, texte) {
  const chat = document.getElementById("phyia-chat");
  const bulle = document.createElement("div");
  bulle.className = `bulle bulle-${role}`;

  if (role === "assistant") {
    bulle.innerHTML = `<span class="bulle-label">⚛ PhysIA</span>${formatMessage(texte)}`;
  } else if (role === "user") {
    bulle.innerHTML = `<span class="bulle-label">Toi</span>${escapeHtml(texte)}`;
  } else {
    bulle.innerHTML = texte;
  }

  chat.appendChild(bulle);
  // Animation d'entrée
  requestAnimationFrame(() => bulle.classList.add("visible"));
  chat.scrollTop = chat.scrollHeight;
}

function afficherChargement() {
  const chat = document.getElementById("phyia-chat");
  const id = "loading-" + Date.now();
  const loader = document.createElement("div");
  loader.id = id;
  loader.className = "bulle bulle-assistant bulle-loading";
  loader.innerHTML = `<span class="bulle-label">⚛ PhysIA</span><span class="dots"><span>.</span><span>.</span><span>.</span></span>`;
  chat.appendChild(loader);
  requestAnimationFrame(() => loader.classList.add("visible"));
  chat.scrollTop = chat.scrollHeight;
  return id;
}

function supprimerChargement(id) {
  document.getElementById(id)?.remove();
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ——— Toggle sidebar ———
function toggleSidebar() {
  const sidebar = document.getElementById("phyia-sidebar");
  const btn = document.getElementById("phyia-toggle-btn");
  const isOpen = sidebar.classList.toggle("open");
  btn.textContent = isOpen ? "✕" : "⚛";
  btn.title = isOpen ? "Fermer PhysIA" : "Ouvrir PhysIA";
  if (isOpen && document.getElementById("phyia-chat").children.length === 0) {
    // Message de bienvenue
    setTimeout(() => {
      ajouterBulle("assistant",
        "Salut ! Je suis **PhysIA**, ton assistant pour tous les cours du site.\n\n" +
        "Pose-moi une question sur : PHY104, PHY106, MTH100, MTH101, MTH103, CHM101, CHM106 ou ANG200.\n\n" +
        "Exemple : *Qu'est-ce que le principe fondamental de la dynamique ?*"
      );
    }, 300);
  }
}

// ——— Initialisation ———
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("phyia-input");
  const sendBtn = document.getElementById("phyia-send");

  sendBtn.addEventListener("click", () => {
    const q = input.value.trim();
    if (!q) return;
    input.value = "";
    envoyerMessage(q);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // Questions rapides
  document.querySelectorAll(".quick-q").forEach((btn) => {
    btn.addEventListener("click", () => {
      envoyerMessage(btn.dataset.q);
    });
  });
});
