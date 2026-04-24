const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const db = new sqlite3.Database('./message.sqlite');

app.use(express.json()); // Pour que le serveur comprenne le format JSON

// Créer la table au démarrage
db.run("CREATE TABLE IF NOT EXISTS discussions (id INTEGER PRIMARY KEY AUTOINCREMENT, contenu TEXT)");

// Route pour recevoir un message
app.post('/envoi', (req, res) => {
    const message = req.body.message;
    db.run("INSERT INTO discussions (contenu) VALUES (?)", [message], function(err) {
        if (err) return res.status(500).send(err.message);
        res.send("Message bien reçu et stocké avec l'ID : " + this.lastID);
    });
});

// Lancer le serveur sur le port 3000
app.listen(3000, () => {
    console.log("Le serveur est allumé sur http://localhost:3000");
    console.log("En attente de messages des étudiants...");
});