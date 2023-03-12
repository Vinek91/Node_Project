const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);
var path = require("path");
let PORT = 3030;






server.listen(PORT, () => {
   console.log("Serveur démarré sur le port :"+PORT);
});




app.get("/", (req,res) => {
   res.sendFile(path.join(__dirname, '/views/index.html'));
  
});


app.get("/style", (req,res) => {
   res.sendFile(path.join(__dirname, '/public/css/style.css'));
});


app.get("/script", (req,res) => {
   res.sendFile(path.join(__dirname, '/public/js/client.js'));
});


let pseudoList = [];
io.on('connection',(socket)=>{
  
   socket.on('set-pseudo',(pseudo)=>{
       console.log(pseudo + " vient de se connecter à "+new Date());
       socket.nickname = pseudo;
       pseudoList.push(pseudo);
 
      
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
       })
   });
    socket.on('emission_message',(message)=>{
       console.log(JSON.stringify(message))
       console.log(socket.nickname+": "+message)
       socket.chat = message;
       io.emit('reception_message', message); // envoie le message à tous les clients connectés
       //socket.broadcast.emit('reception_message', socket.nickname + " : " + message); // envoie le message à tous les utilisateurs connectés excepté l'utilisateur actuel


   });


   socket.on('message-prive', (message) => {
       console.log(socket.nickname+": "+message)
       socket.chat = message;
      
       io.to(message.emet_id).to(message.dest_id).emit('reception_message', message);
       //socket.emit('reception_message', message);
   });


   socket.on('disconnect',()=>{
       console.log(socket.nickname+" s'est déconnecter à "+new Date())




      
       pseudoList = pseudoList.filter((pseudo) => pseudo !== socket.nickname); // Supprime le pseudo du client déconnecté du tableau
       io.emit('user-list', pseudoList.filter((p) => p !== socket.nickname)); // Envoie la liste des utilisateurs connectés (sauf le pseudo du client déconnecté) à tous les clients connectés




   });


});


