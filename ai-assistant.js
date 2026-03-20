// ============================================================
//  PhysIA — Assistant IA
//  ✅ Clé API sécurisée via Cloudflare Worker (jamais exposée)
//  ✅ Modèle : gemini-1.5-flash-8b (quota gratuit généreux)
// ============================================================

const GEMINI_API_KEY = "AIzaSyBYRkRbooYnDN2Opd8dsbndrjh4yH_D3g4";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const COURS_DISPONIBLES = [
  "PHY104 : Électricité & Magnétisme",
  "PHY106 Chap.1 : Cinématique",
  "PHY106 Chap.2 : Mouvements particuliers",
  "PHY106 Chap.3 : Dynamique newtonienne",
  "PHY106 Outils Mathématiques",
  "MTH100 : Analyse (fonctions, limites, dérivées, intégrales)",
  "MTH101 : Algèbre linéaire (espaces vectoriels, matrices, applications linéaires)",
  "MTH103 : Probabilités & Statistiques",
  "CHM101 : Chimie Générale",
  "CHM106 : Chimie Organique",
  "ANG200 : Anglais Scientifique",
];

const SYSTEM_INSTRUCTION = `Tu es PhysIA, un assistant pédagogique intégré dans un site de cours universitaires de physique/maths/chimie (Togo, Université, Semestre 1 2025-2026).

Cours disponibles sur le site :
${COURS_DISPONIBLES.map((c) => "• " + c).join("\n")}

RÈGLES :
1. Réponds TOUJOURS en français.
2. Sois DIRECT : commence par la réponse.
3. Sois CONCIS mais COMPLET : max 6-8 lignes sauf démonstration.
4. Écris les formules en LaTeX MathJax : inline avec \( \) et bloc avec \[ \].
   Exemples : \(F = ma\), \(v = \frac{d}{t}\), \[E = mc^2\]
5. Donne TOUJOURS un exemple numérique si pertinent.
6. Si hors cours listés, dis-le clairement.
7. Structure avec tirets/numéros si plus de 2 points.`;

let historique = [];
let enChargement = false;

function renderMath(text) {
  return text
    .replace(/\$\$(.+?)\$\$/gs, '<span class="formula block-formula">$1</span>')
    .replace(/\$(.+?)\$/g, '<span class="formula">$1</span>');
}

function formatMessage(text) {
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/^[—\-•] (.+)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>[\s\S]*?<\/li>)+/g, (m) => '<ul>' + m + '</ul>');
  text = text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
  text = renderMath(text);
  return '<p>' + text + '</p>';
}

async function envoyerMessage(question) {
  if (enChargement || !question.trim()) return;
  enChargement = true;

  historique.push({ role: "user", parts: [{ text: question }] });
  ajouterBulle("user", question);
  const loadingId = afficherChargement();

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: historique,
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || data?.error || JSON.stringify(data);
      throw new Error(msg);
    }

    const reponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Aucune réponse reçue.";
    historique.push({ role: "model", parts: [{ text: reponse }] });
    supprimerChargement(loadingId);
    ajouterBulle("assistant", reponse);

  } catch (err) {
    supprimerChargement(loadingId);
    ajouterBulle("error", `❌ Erreur : ${err.message}`);
    console.error(err);
  }

  enChargement = false;
}

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
  requestAnimationFrame(() => {
    bulle.classList.add("visible");
    renderMathJax();
  });
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

function toggleSidebar() {
  const sidebar = document.getElementById("phyia-sidebar");
  const btn = document.getElementById("phyia-toggle-btn");
  const isOpen = sidebar.classList.toggle("open");
  btn.textContent = isOpen ? "✕" : "⚛";
  btn.title = isOpen ? "Fermer PhysIA" : "Ouvrir PhysIA";
  if (isOpen && document.getElementById("phyia-chat").children.length === 0) {
    setTimeout(() => {
      ajouterBulle("assistant",
        "Salut ! Je suis **PhysIA**, ton assistant pour tous les cours du site.\n\n" +
        "Pose-moi une question sur : PHY104, PHY106, MTH100, MTH101, MTH103, CHM101, CHM106 ou ANG200.\n\n" +
        "Exemple : *Qu'est-ce que le principe fondamental de la dynamique ?*"
      );
    }, 300);
  }
  attachListeners();
}

function attachListeners() {
  const input = document.getElementById("phyia-input");
  const sendBtn = document.getElementById("phyia-send");
  if (!input || !sendBtn) return;

  const newBtn = sendBtn.cloneNode(true);
  sendBtn.parentNode.replaceChild(newBtn, sendBtn);
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);

  newBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const q = newInput.value.trim();
    if (!q) return;
    newInput.value = "";
    newInput.focus();
    envoyerMessage(q);
  });

  newInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const q = newInput.value.trim();
      if (!q) return;
      newInput.value = "";
      envoyerMessage(q);
    }
  });

  document.querySelectorAll(".quick-q").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      envoyerMessage(btn.dataset.q);
    });
  });
}

document.addEventListener("DOMContentLoaded", attachListeners);

// ——— Rendu MathJax après chaque message ———
function renderMathJax() {
  if (window.MathJax) {
    MathJax.typesetPromise().catch((err) => console.error("MathJax error:", err));
  }
}