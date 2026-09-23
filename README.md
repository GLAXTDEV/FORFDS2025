# DOCS 2025

Application pédagogique avec calculatrices, documents et messagerie Node.js/SQLite.
La messagerie fonctionne **sans compte** : chaque personne saisit son nom et discute.
L'appareil est identifié automatiquement (identifiant local), ce qui permet au créateur
de gérer, bannir ou supprimer quelqu'un.

## Rôles
| Rôle | Droits |
| --- | --- |
| **Créateur** (`owner`) | Nommer/retirer des admins, bannir/débannir, **supprimer des appareils** (identifiant visible), verrouiller/déverrouiller la discussion, supprimer des messages, écrire en bulles **rouges** |
| **Administrateur** (`admin`) | Bannir/débannir des comptes uniquement, écrire en bulles **bleues** |
| **Utilisateur** (`user`) | Écrire des messages (bulles blanches/noir, style WhatsApp) |

Le **premier appareil enregistré devient le créateur automatiquement**. Sinon, n'importe quel appareil
peut devenir créateur en saisissant le **code secret** (`OWNER_CODE`, par défaut `codeglaxt2516@`)
dans la page messagerie. Un seul créateur à la fois.

**Suppression** : quand le créateur supprime un appareil, celui-ci ne peut plus jamais envoyer de
message, même s'il revient sur le site (son identifiant reste bloqué).

## Lancer localement

```powershell
npm install
$env:OWNER_CODE = "codeglaxt2516@"
$env:PORT = "3000"
npm start
```

Ouvrir ensuite `http://localhost:3000`.

## Déployer avec Railway

1. Créer un dépôt GitHub et envoyer le contenu du projet.
2. Dans Railway, choisir **Deploy from GitHub Repo**.
3. Sélectionner ce dépôt.
4. Vérifier la commande de démarrage : `npm start`.
5. Ajouter un volume persistant monté sur `/data`.
6. Ajouter ces variables dans Railway :

```env
OWNER_CODE=codeglaxt2516@
DB_PATH=/data/message.sqlite
```

Dans Railway, le volume doit être monté exactement sur `/data`. Si aucun volume n'est disponible, utilisez temporairement `DB_PATH=./message.sqlite`, mais les messages pourront être perdus lors d'un redeploiement.

7. Générer un domaine public dans Railway.

Le projet utilise le port fourni automatiquement par Railway. Les messages et les comptes restent conservés grâce au volume `/data`.

## Sécurité

Ne jamais publier `.env` ou `message.sqlite` dans GitHub. Ces fichiers sont ignorés par `.gitignore`.

## Déploiement séparé du frontend

Si le frontend et l'API sont sur deux domaines différents, définir `CORS_ORIGIN` côté serveur et ajouter avant `messagerie.js` :

```html
<script>window.DOCS_API_URL = 'https://votre-api.example.com';</script>
```
