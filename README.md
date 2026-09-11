# DOCS 2025

Application pédagogique avec calculatrices, documents et messagerie Node.js/SQLite.

## Lancer localement

```powershell
npm install
$env:ADMIN_KEY = "votre-cle-secrete"
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
ADMIN_KEY=choisir-une-cle-secrete
DB_PATH=/data/message.sqlite
```

Dans Railway, le volume doit être monté exactement sur `/data`. Si aucun volume n'est disponible, utilisez temporairement `DB_PATH=./message.sqlite`, mais les messages pourront être perdus lors d'un redeploiement.

7. Générer un domaine public dans Railway.

Le projet utilise le port fourni automatiquement par Railway. Les messages et les administrateurs restent conservés grâce au volume `/data`.

## Sécurité

Ne jamais publier `ADMIN_KEY`, `.env` ou `message.sqlite` dans GitHub. Ces fichiers sont ignorés par `.gitignore`.

## Déploiement séparé du frontend

Si le frontend et l'API sont sur deux domaines différents, définir `CORS_ORIGIN` côté serveur et ajouter avant `messagerie.js` :

```html
<script>window.DOCS_API_URL = 'https://votre-api.example.com';</script>
```
