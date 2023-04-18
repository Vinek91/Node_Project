// Importation de la bibliothèque Express
const express = require('express');
// Initialisation de l'application Express
const app = express();
// Importation de la bibliothèque HTTP
const http = require('http');
// Création du serveur HTTP en utilisant l'application Express
const server = http.createServer(app);
// Importation de la bibliothèque Socket.io
const {Server} = require("socket.io");
// Création de l'objet io à partir du serveur HTTP
const io = new Server(server);
// Importation de la bibliothèque Path pour gérer les chemins d'accès
var path = require("path");
// Définition du numéro de port
let PORT = 3030;

// Définition des variables pour stocker les informations utilisateur
let infosUtilisateur;
let utilisateurconnecter ='';

// Importation de la bibliothèque Express-session
const session = require('express-session');
// Importation de la bibliothèque Mariadb pour la base de données
const mariadb = require('mariadb');
const { connect } = require('http2');

// Création d'une nouvelle connexion à la base de données
const db = mariadb.createPool({
host:'localhost',
user: 'root',
password : '123456',
database : 'sio_chat'
});

// Fonction asynchrone pour récupérer un utilisateur dans la base de données
async function getUser(username, password) {
    let conn;
    try {
        conn = await db.getConnection();
        // Requête pour récupérer un utilisateur avec le pseudo et le mot de passe
        const rows = await conn.query("SELECT * from user WHERE pseudo = ? AND mdp = ?", [username, password]);
        // Si la requête renvoie des résultats, on retourne le premier élément de la liste, sinon on retourne null
        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        console.log("erreur: " + err);
        return null;
    } finally {
        if (conn) conn.release();
    }
}


// Démarre le serveur en écoutant les connexions sur le port défini
server.listen(PORT, () => {
    console.log("Serveur démarré sur le port :"+PORT);
});
    
// Utilise la session pour stocker des informations de manière sécurisée côté serveur
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))
    
// Utilise le format JSON pour les données reçues par le serveur
app.use(express.json());
    
// Utilise le format URL Encoded pour les données reçues par le serveur
app.use(express.urlencoded({extended:true}));
    
// Utilise le module "body-parser" pour traiter les requêtes POST avec des données en format JSON
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
    
// Gère la requête POST de login
app.post('/login', async (req, res) => {
    
    // Récupère les données envoyées via la requête POST
    const username = req.body.username;
    const password = req.body.password;

    // Appelle la fonction "getUser" pour vérifier les informations de connexion
    const user = await getUser(username, password);
    if (user) {
        // Si les informations de connexion sont valides, stocke les informations de l'utilisateur dans un objet
        infosUtilisateur = {
        pseudo: username,
        mail: user.mail // stocke l'e-mail dans infosUtilisateur
        };
        utilisateurconnecter = infosUtilisateur.pseudo;
        const jsonInfosUtilisateur = JSON.stringify(infosUtilisateur);
        console.log("Informations de l'utilisateur : " + jsonInfosUtilisateur);

        // Stocke la session en tant que "connectée" et redirige l'utilisateur vers la page du salon
        req.session.loggedin = true;
        res.redirect("/salon");
    } else {
        // Si les informations de connexion sont invalides, redirige l'utilisateur vers la page d'erreur
        res.redirect("/erreur");
   
    }

});

// Définit la route de base de l'application pour afficher la page de connexion
app.get("/", (req,res) => {
    res.sendFile(path.join(__dirname, '/views/login.html'));
});

// Définit la route pour afficher la page d'erreur 403
app.get("/erreur", (req,res) => {
    res.sendFile(path.join(__dirname, '/views/error403.html'));
});

// Définit la route pour afficher la page principale du salon de discussion
app.get("/salon", (req,res) => {

    // Vérifie si l'utilisateur est connecté, s'il l'est, affiche la page principale du salon de discussion, sinon redirige vers la page d'erreur
    if(req.session.loggedin){
        res.sendFile(path.join(__dirname, '/views/index.html'));
    }else{
        res.redirect("/erreur");
    }

});

// La première route sert à envoyer le fichier 'style.css' présent dans le dossier 'public/css' lorsque l'utilisateur navigue vers '/style'
app.get("/style", (req,res) => {
    res.sendFile(path.join(__dirname, '/public/css/style.css'));
    });
    
// La deuxième route sert à envoyer le fichier 'style2.css' présent dans le dossier 'public/css' lorsque l'utilisateur navigue vers '/style2'
app.get("/style2", (req,res) => {
    res.sendFile(path.join(__dirname, '/public/css/style2.css'));
    });
    
// La troisième route sert à envoyer le fichier 'style3.css' présent dans le dossier 'public/css' lorsque l'utilisateur navigue vers '/style3'
app.get("/style3", (req,res) => {
    res.sendFile(path.join(__dirname, '/public/css/style3.css'));
    });
    
// Enfin, la dernière route sert à envoyer le fichier 'client.js' présent dans le dossier 'public/js' lorsque l'utilisateur navigue vers '/script'
app.get("/script", (req,res) => {
    res.sendFile(path.join(__dirname, '/public/js/client.js'));
});


// Déclaration d'une liste vide pour stocker les pseudonymes des utilisateurs connectés
let pseudoList = [];

// Ecouteur pour la connexion d'un utilisateur
io.on('connection',(socket)=>{
  
    // Attribution du pseudonyme à l'utilisateur connecté
    socket.nickname = utilisateurconnecter;
    console.log(socket.nickname + " vient de se connecter à "+new Date());
    
    // Envoie la liste des utilisateurs connectés (sauf le pseudo de l'utilisateur courant) à tous les clients connectés
    io.emit('user-list', pseudoList.filter((p) => p !== pseudo)); 

    // Récupération de la liste des utilisateurs connectés dans la room
    io.fetchSockets().then((room)=>{
        var utilisateurs=[];
        room.forEach((item) => {
            utilisateurs.push({
                id_client : item.id,
                pseudo_client : item.nickname,
            });
        });
        // Envoie la liste des utilisateurs connectés à tous les clients connectés
        io.emit('reception_utilisateur',utilisateurs);
        console.table(utilisateurs)
   

       
   });
   // Ecouteur pour la réception d'un message de l'utilisateur
   socket.on('emission_message', (message) => {
    
    console.log(JSON.stringify(message))
    console.log(socket.nickname + ": " + message.msg)
    socket.chat = message;
    io.emit('reception_message', message); // envoie le message à tous les clients connectés
});

// Lorsqu'un message privé est reçu par le serveur
socket.on('message-prive', (message) => {
    console.log(socket.nickname + ": " + message.msg); // Affiche le pseudo du client et le contenu du message dans la console du serveur
    socket.chat = message; // Stocke le message dans la variable "chat" du socket
    io.to(message.emet_id).to(message.dest_id).emit('reception_message', message); // Envoie le message aux sockets correspondant à l'émetteur et au destinataire
    //socket.emit('reception_message', message); // Ancienne version qui envoyait le message uniquement à l'émetteur
});
    
// Lorsqu'un client se déconnecte du serveur
socket.on('disconnect', () => {
    console.log(socket.nickname + " s'est déconnecté à " + new Date()); // Affiche le pseudo du client et l'heure de la déconnexion dans la console du serveur
    pseudoList = pseudoList.filter((pseudo) => pseudo !== socket.nickname); // Supprime le pseudo du client déconnecté du tableau des pseudos
    io.emit('user-list', pseudoList.filter((p) => p !== socket.nickname)); // Envoie la liste des utilisateurs connectés (sauf le pseudo du client déconnecté) à tous les clients connectés
});



});