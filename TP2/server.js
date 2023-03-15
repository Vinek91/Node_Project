const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);
var path = require("path");
let PORT = 3030;
let infosUtilisateur;
let utilisateurconnecter ='';

const session = require('express-session');


const mariadb = require('mariadb');
const { connect } = require('http2');
const db = mariadb.createPool({
   host:'localhost',
   user: 'root',
   password : '123456',
   database : 'sio_chat'
})

async function getUser(username, password) {
    let conn;
    try {
        conn = await db.getConnection();
        const rows = await conn.query("SELECT * from user WHERE pseudo = ? AND mdp = ?", [username, password]);
        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        console.log("erreur: " + err);
        return null;
    } finally {
        if (conn) conn.release();
    }
}







server.listen(PORT, () => {
   console.log("Serveur démarré sur le port :"+PORT);
});


app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
 }))
 
 app.use(express.json());
 app.use(express.urlencoded({extended:true}));
 
 const bodyParser = require('body-parser');

 app.use(bodyParser.urlencoded({ extended: true }));
 
 app.post('/login', async (req, res) => {
    
    const username = req.body.username;
    const password = req.body.password;
    
    const user = await getUser(username, password);
    if (user) {
        infosUtilisateur = {
           pseudo: username,
           mail: user.mail // stocke l'e-mail dans infosUtilisateur
         };
         utilisateurconnecter = infosUtilisateur.pseudo;
         const jsonInfosUtilisateur = JSON.stringify(infosUtilisateur);
         console.log("Informations de l'utilisateur : " + jsonInfosUtilisateur);
        req.session.loggedin = true;
        //req.session.username = username;
        res.redirect("/salon");
    } else {
        res.redirect("/erreur");
        
        //res.send("Nom d'utilisateur ou mot de passe incorrect !");
    }
});


 app.get("/", (req,res) => {
    res.sendFile(path.join(__dirname, '/views/login.html'));
   
 });

 app.get("/erreur", (req,res) => {
    res.sendFile(path.join(__dirname, '/views/error403.html'));
   
 });

app.get("/salon", (req,res) => {

    if(req.session.loggedin){
        res.sendFile(path.join(__dirname, '/views/index.html'));
    }else{
        res.redirect("/erreur");
    }
 
   console.log(req.sessionID);
   console.log(req.session)
});




app.get("/style", (req,res) => {
   res.sendFile(path.join(__dirname, '/public/css/style.css'));
});

app.get("/style2", (req,res) => {
    res.sendFile(path.join(__dirname, '/public/css/style2.css'));
 });

 app.get("/style3", (req,res) => {
    res.sendFile(path.join(__dirname, '/public/css/style3.css'));
 });


app.get("/script", (req,res) => {
   res.sendFile(path.join(__dirname, '/public/js/client.js'));
});


let pseudoList = [];
io.on('connection',(socket)=>{
  
       socket.nickname = utilisateurconnecter;
       console.log(socket.nickname + " vient de se connecter à "+new Date());
       
 
      
       io.emit('user-list', pseudoList.filter((p) => p !== pseudo)); // Envoie la liste des utilisateurs connectés (sauf le pseudo de l'utilisateur courant) à tous les clients connectés
  
       io.fetchSockets().then((room)=>{
           var utilisateurs=[];
           room.forEach((item) => {
               utilisateurs.push({
                   id_client : item.id,
                   pseudo_client : item.nickname,
               });
           });
           io.emit('reception_utilisateur',utilisateurs);
           console.table(utilisateurs)
       
   });
   socket.on('emission_message', (message) => {
    console.log(JSON.stringify(message))
    console.log(socket.nickname + ": " + message)
    socket.chat = message;
    io.emit('reception_message', message); // envoie le message à tous les clients connectés
    //socket.broadcast.emit('reception_message', socket.nickname + " : " + message); // envoie le message à tous les utilisateurs connectés excepté l'utilisateur actuel
});

socket.on('message-prive', (message) => {
    console.log(socket.nickname + ": " + message)
    socket.chat = message;
    io.to(message.emet_id).to(message.dest_id).emit('reception_message', message);
    //socket.emit('reception_message', message);
});

socket.on('disconnect', () => {
    console.log(socket.nickname + " s'est déconnecté à " + new Date())
    pseudoList = pseudoList.filter((pseudo) => pseudo !== socket.nickname); // Supprime le pseudo du client déconnecté du tableau
    io.emit('user-list', pseudoList.filter((p) => p !== socket.nickname)); // Envoie la liste des utilisateurs connectés (sauf le pseudo du client déconnecté) à tous les clients connectés
});



});


