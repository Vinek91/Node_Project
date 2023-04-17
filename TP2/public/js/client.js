// Définition de la variable 'socket' pour la communication avec le serveur
var socket = io();
// Initialisation des variables d'identification et de destinataire
var iddes = null;
var pseudoname = null;
var dest_id = null;

// Récupération des éléments HTML nécessaires
var recipientInput = document.getElementById('recipient-input'); // Ajouter le champ de saisie pour le destinataire
var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');
var id_salon= 'salon';
var lesMessages = [];
const messageprivee = document.getElementById('message-privee');
const messagegeneral = document.getElementById('message-container');
const title  = document.getElementById('chat-title');

// Écouteur d'événement sur le formulaire de saisie de message
form.addEventListener("submit", (e) => {
  e.preventDefault();
  // Création d'un objet 'message' contenant les informations du message à envoyer
  var laDate = new Date();
  var message = {
  emet_id : socket.id, //Id du client socket émetteur du message
  dest_id: iddes, //Id du client socket destinataire du message
  pseudo: pseudoname, //pseudo du client socket émetteur
  msg: input.value, //contenu du message
  date : laDate.toLocaleDateString()+' - '+laDate.toLocaleDateString(),
  recu : false,     //indique le recu
  salon: id_salon // Ajouter l'ID du salon dans le message
};
console.log("wtf : "+message.salon);
  // Vérification du salon dans lequel le message doit être envoyé
  if (id_salon === 'salon') { // si on est dans le salon général
    console.log("ca passe en general")
    message.dest_id=null;
    
    socket.emit('emission_message', message); // envoyer le message à tous les utilisateurs
    
  } else {
    console.log("ca passe en privee")
    socket.emit('message-prive', message); // envoyer le message à un utilisateur spécifique
  }

  // Effacement du champ de saisie de message après envoi
  input.value = '';
});

// Ecouteur d'événement qui reçoit les messages
socket.on('reception_message', (contenu) => {

  // Créer un objet message avec les informations reçues
  const messageObj = {
  emet_id: contenu.emet_id, // ID de l'émetteur
  dest_id: contenu.dest_id, // ID du destinataire
  pseudo: contenu.pseudo, // Pseudo de l'émetteur
  msg: contenu.msg, // Contenu du message
  date: new Date().toLocaleDateString()+' - '+new Date().toLocaleTimeString(), // Date et heure de réception
  recu: true, // Marqueur pour indiquer que le message a été reçu
  salon: id_salon // Ajouter l'ID du salon dans le message
  };
  
  lesMessages.push(messageObj); // Ajouter le message reçu dans le tableau lesMessages[]
  console.log("messages"+JSON.stringify(messageObj))
  
  salon(contenu.dest_id) // Mettre à jour le salon pour l'émetteur

  
});

socket.on('reception_utilisateur', (utilisateurs) => {

  // Affichage des utilisateurs dans la console sous forme de tableau
  console.table(utilisateurs);
  
  // Sélection de l'élément HTML qui contiendra la liste des utilisateurs
  const userListElem = document.getElementById('user-list');
  
  // On vide la liste des utilisateurs à chaque réception de nouveaux utilisateurs
  userListElem.innerHTML = '';
  
  // Parcours de tous les utilisateurs reçus
  utilisateurs.forEach((utilisateur) => {
// Si un seul utilisateur est en ligne, on affiche un message spécial
  if (utilisateurs.length === 1) {
    console.log("voici le pseudo : "+utilisateur.pseudo_client)
    const messageElem = document.createElement('li');
    messageElem.innerText = 'Aucun utilisateur en ligne';
    userListElem.appendChild(messageElem);
    return;
  }

  // Si l'utilisateur n'est pas l'utilisateur actuel et a un pseudonyme défini, on l'ajoute à la liste des utilisateurs
  if (utilisateur.id_client !== socket.id && utilisateur.pseudo_client != null && utilisateur.pseudo_client != undefined ) {

    // Création d'un élément de liste contenant le pseudonyme de l'utilisateur et un lien permettant de lancer une conversation privée avec lui
    const pseudoElem = document.createElement('li');
    pseudoElem.innerHTML = '<a href="#" onClick="startPrivateConversation(\'' + utilisateur.id_client + '\', \'' + utilisateur.pseudo_client + '\')" >' + utilisateur.pseudo_client + '</a>';
    userListElem.appendChild(pseudoElem);

    // Ajout d'un événement de clic sur l'élément de liste pour lancer la conversation privée correspondante
    pseudoElem.addEventListener('click', () => {
      console.log("voici le pseudo : "+utilisateur.pseudo_client)
      iddes = utilisateur.id_client;
      id_salon = utilisateur.id_client;
      dest_id = utilisateur.id_client;
      console.log("dzxs"+iddes)
      console.log("salon "+id_salon)
      console.log("destid "+id_salon)
      const messageContainer = document.getElementById('message-container');
      messageContainer.innerHTML = '';
    });
  }

  // Si l'utilisateur est l'utilisateur actuel et a un pseudonyme défini, on l'ajoute à la liste des utilisateurs en affichant "(you)" à côté de son pseudonyme
  if (utilisateur.id_client == socket.id && utilisateur.pseudo_client != null && utilisateur.pseudo_client != undefined ) {
    pseudoname=utilisateur.pseudo_client;
    const pseudoElem = document.createElement('li');
    pseudoElem.innerHTML = '<a href="#" onClick="startPrivateConversation(\'' + utilisateur.id_client + '\', \'' + utilisateur.pseudo_client + '\')" >' + utilisateur.pseudo_client+'(you)' + '</a>';
    userListElem.appendChild(pseudoElem);

    // Ajout d'un événement de clic sur l'élément de liste pour lancer la conversation privée correspondante
    pseudoElem.addEventListener('click', () => {
      console.log("voici le pseudo : "+utilisateur.pseudo_client)
      const messageContainer = document.getElementById('message-container');
      messageContainer.innerHTML = '';
    });
  }
  });
});


function startPrivateConversation(dest_id, dest_pseudo) {
  
  messageprivee.innerHTML = '';

  // Créer une nouvelle salle de discussion pour la conversation privée
  const privateRoomName = dest_id;
  socket.emit('creer_salon_prive', privateRoomName);

  // Mettre à jour l'ID de la salle de discussion actuelle
  id_salon = privateRoomName;
  dest_id = dest_id;
  console.log('Destination ID : ' + dest_id);
  

  // Vider le contenu des messages du salon stockés dans le message-container
  messagegeneral.innerHTML = '';
  
  title.innerText = 'Chat privé avec ' + dest_pseudo;
  // Afficher le contenu de la conversation privée dans le conteneur de messages
  lesMessages.forEach((message) => {
    if ((message.emet_id === socket.id && message.dest_id === dest_id) || (message.emet_id === dest_id && message.dest_id === socket.id)) {
      const messageElem = document.createElement('div');
      if (message.emet_id === socket.id) {
        console.log("ca passe en privée")
        messageElem.innerHTML = '<ul  style="background-color: #665dfe; float:right;" ><b>Vous : </b>' + message.msg+'</ul>';
        messageprivee.appendChild(messageElem);

      } else if (message.emet_id === dest_id) {
        console.log("ca passe en privée")
        messageElem.innerHTML = '<ul   style="background-color: #fe5d5d; float:left;" >'+dest_pseudo + ' : ' +message.msg+'</ul>';
        messageprivee.appendChild(messageElem);
        checkUnread();
      }
      
    }
   
  })
  
}


function salon(id) {
  title.innerHTML=""; //remmetre le titre à zeros
  this.id_salon=id_salon;

  if (id==null){
  }else{
    id_salon=id;  //dans le cas des messages privées
  }
  
  console.log('voici l id : '+id);

  messageprivee.innerHTML='';
  messagegeneral.innerHTML='';

  console.log("voici le dest id "+dest_id)
  // Afficher chaque message dans le conteneur de messages
  
  lesMessages.forEach((message) => {
    message.recu =false;
      const messageElem = document.createElement('div');
      console.log("voici le destid ca mere : "+message.dest_id)
      if(message.dest_id == null){
          if (message.emet_id === socket.id) {
          console.log("ça passe")
          // Si le message a été envoyé par l'utilisateur courant, le mettre en gras
          messageElem.innerHTML = '<ul  style="background-color: #665dfe; float:right;" ><b>Vous : </b>' + message.msg+'</ul>';
          messagegeneral.appendChild(messageElem);
        } else if (message.emet_id !== socket.id) {
          // Si le message a été envoyé par un autre utilisateur, afficher son pseudo
          messageElem.innerHTML = '<ul   style="background-color: #fe5d5d; float:left;" >'+message.pseudo + ' : ' +message.msg+'</ul>';
          messagegeneral.appendChild(messageElem);
          message.recu =true;
        }
      }
      
    
  });
  checkUnread();
}


function checkUnread() {
 
  
  const userListElem = document.getElementById('user-list');
  const unreadCounts = {};

  // Compter le nombre de messages non lus pour chaque utilisateur
  lesMessages.forEach((message) => {
    if (message.recu && message.dest_id === socket.id) {
      if (unreadCounts[message.emet_id] === undefined) {
        unreadCounts[message.emet_id] = 1;
      } else {
        unreadCounts[message.emet_id]++;
      }
    }
  });

  // Afficher le nombre de messages non lus à côté de chaque utilisateur dans la liste
  userListElem.childNodes.forEach((userElem) => { 
    const userId = userElem.childNodes[0].getAttribute('onclick').match(/'([^']+)'/)[1];
      const unreadCount = unreadCounts[userId] || 0;
      const unreadCountElem = document.createElement('span');
    if (userElem.childNodes[0] && userElem.childNodes[0].tagName === "A") {
     
      unreadCountElem.className = 'unread-count';
      unreadCountElem.innerText = unreadCount > 0 ? `(${unreadCount})` : '';
      userElem.appendChild(unreadCountElem);
      
      userElem.addEventListener('click', () => {
       /* if (unreadCount > 0) {
          unreadCountElem.innerText = `(${unreadCount - 1})`;
        } else {
          unreadCountElem.innerText = '';
        }*/
      });
      
    }
  });
  
}
