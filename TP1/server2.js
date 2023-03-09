const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);


app.get('/',(req, res) => {
    res.writeHead(200);
    res.end('Hello World! Salut tout le monde !');
});


app.get('/page1',(req, res) => {
    res.sendFile(__dirname+'/page1.html');
});


server.listen(8080, () => {
    console.log("Serveur démarré sur le port 8080")
});


app.use((req, res, next) =>{
    res.setHeader("Content-Type","text/plain");
    res.status(404).send("Erreur,Page Introuvable !")
});