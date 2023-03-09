var socket = io();
var iddes = null;
var pseudoname = null;
var dest_id = null;
socket.emit('set-pseudo',prompt("Pseudo ?"));


var recipientInput = document.getElementById('recipient-input'); // Ajouter le champ de saisie pour le destinataire
var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');
var id_salon= 'salon';
var lesMessages = [];




form.addEventListener("submit", (e) => {
  e.preventDefault();
   var laDate = new Date();
   var message = {
    emet_id : socket.id, //Id du client socket émetteur du message
    dest_id: iddes,  //Id du client socket destinataire du message
    pseudo: pseudoname, //pseudo du client socket émetteur
    msg: input.value, //contenu du message
    date : laDate.toLocaleDateString()+' - '+laDate.toLocaleDateString(),
    recu : false,
    salon: id_salon // Ajouter l'ID du salon dans le message
   };
  
   if (id_salon === 'salon') { // si on est dans le salon général
      
    socket.emit('emission_message', message); // envoyer le message à tous les utilisateurs
  } else {
   
    socket.emit('message-prive', message); // envoyer le message à tous les utilisateurs
  }


    input.value = ''; // efface le champ de saisie
});

socket.on('reception_message', (contenu) => {

  const messageObj = {
     emet_id: contenu.emet_id,
     dest_id: contenu.dest_id,
     pseudo: contenu.pseudo,
     msg: contenu.msg,
     date: new Date().toLocaleDateString()+' - '+new Date().toLocaleTimeString(),
     recu: true,
     salon: id_salon // Ajouter l'ID du salon dans le message
  }; 

  lesMessages.push(messageObj); // Ajouter le message reçu dans le tableau lesMessages[]
 
  salon(contenu.emet_id)
  

});

socket.on('reception_utilisateur', (utilisateurs) => {

  
  console.table(utilisateurs);
  const userListElem = document.getElementById('user-list');
  userListElem.innerHTML = '';

 
  utilisateurs.forEach((utilisateur) => {
    pseudoname=utilisateur.pseudo_client
    if (utilisateurs.length === 1) {
     
      const messageElem = document.createElement('li');
      messageElem.innerText = 'Aucun utilisateur en ligne';
      userListElem.appendChild(messageElem);
      return;
    }
    if (utilisateur.id_client !== socket.id && utilisateur.pseudo_client != null && utilisateur.pseudo_client != undefined ) {
      const pseudoElem = document.createElement('li');
      pseudoElem.innerHTML = '<a href="#" onClick="salon(\'' + utilisateur.id_client + '\')" >' + utilisateur.pseudo_client + '</a>';
      userListElem.appendChild(pseudoElem);

      pseudoElem.addEventListener('click', () => {
        
        iddes = utilisateur.id_client;
        id_salon = utilisateur.id_client;
        const messageContainer = document.getElementById('message-container');
        messageContainer.innerHTML = '';
      });
    }
    if (utilisateur.id_client == socket.id && utilisateur.pseudo_client != null && utilisateur.pseudo_client != undefined ) {
      const pseudoElem = document.createElement('li');
      pseudoElem.innerHTML = '<a href="#" onClick="salon(\'' + utilisateur.id_client + '\')" >' + utilisateur.pseudo_client+'(you)' + '</a>';
      userListElem.appendChild(pseudoElem);

      pseudoElem.addEventListener('click', () => {
       
        iddes = utilisateur.id_client;
        id_salon = utilisateur.id_client;
        const messageContainer = document.getElementById('message-container');
        messageContainer.innerHTML = '';
      });
    }
  });
});


function salon(id) {
  
  
  const messageContainer = document.getElementById('message-container');
  messageContainer.innerHTML='';
  // Afficher chaque message dans le conteneur de messages
  lesMessages.forEach((message) => {
    console.table(message)
    const messageElem = document.createElement('div');
    console.log("emet id"+message.emet_id+" socket"+socket.id)
    if (message.emet_id === socket.id) {
      // Si le message a été envoyé par l'utilisateur courant, le mettre en gras
      messageElem.innerHTML = '<ul  style="background-color: #665dfe; float:right;" ><b>Vous : </b>' + message.msg+'</ul>';
      messageContainer.appendChild(messageElem);
    } else if (message.emet_id !== socket.id) {
      // Si le message a été envoyé par un autre utilisateur, afficher son pseudo
      messageElem.innerHTML = '<ul   style="background-color: #fe5d5d; float:left;" >'+message.pseudo + ' : ' +message.msg+'</ul>';
      messageContainer.appendChild(messageElem);
    }
   
   
  });
  
  // Mettre à jour le champ de saisie pour le destinataire
  recipientInput.value = id;
}

/*
function salon(id) {
  
  console.table(lesMessages)
  console.log("voici l'id"+id)
 
  // Effacer le contenu du conteneur de messages
  
  const messageContainer = document.getElementById('message-container');
  // Parcourir le tableau lesMessages et afficher chaque message
  
    console.log("salut")
      // Créer un nouvel élément de liste avec le contenu du message
      const messageElem = document.createElement('ul');
      messageElem.classList.add('sent');
      messageElem.textContent = lesMessages[lesMessages.length - 1].pseudo+" : "+lesMessages[lesMessages.length - 1].msg;
      messageContainer.appendChild(messageElem);
    
    
  
}
/*
function salon(id) {
  // Mettre à jour iddes avec l'ID du destinataire
  iddes = id;
  // Si on est dans le salon général
  if (id === 'salon') {
    // Mettre à jour id_salon avec 'salon'
    id_salon = 'salon';
  } else {
    // Sinon, mettre à jour id_salon avec l'ID du destinataire
    id_salon = id;
  }
  // Récupérer les messages correspondant à l'ID du salon ou de la conversation
  // en utilisant une requête AJAX ou une méthode de l'API fetch par exemple.
  // Une fois les messages récupérés, mettre à jour le contenu de la div 'message-container'.
  // Voici un exemple de code pour mettre à jour le contenu de la div 'message-container'
  // en utilisant les messages récupérés :
  const messageContainer = document.getElementById('message-container');
  messageContainer.innerHTML = '';
  lesMessages.forEach((message) => {
    if (message.emet_id === socket.id && message.dest_id === id) {
     
      // Le message a été émis par l'utilisateur courant et destiné au salon ou à la conversation sélectionné
      // Ajouter le message au conteneur de messages avec une classe CSS pour le mettre en évidence
      const messageElem = document.createElement('ul');
      messageElem.classList.add('sent');
      messageElem.textContent = message.pseudo+" : "+message.msg;
      messageContainer.appendChild(messageElem);
    } else if (message.emet_id === id && message.dest_id === socket.id) {
      // Le message a été émis par le destinataire sélectionné et destiné à l'utilisateur courant
      // Ajouter le message au conteneur de messages avec une classe CSS pour le mettre en évidence
      const messageElem = document.createElement('li');
      messageElem.classList.add('received');
      messageElem.textContent = message.msg;
      messageContainer.appendChild(messageElem);
      // Mettre à jour l'état de réception du message
      message.recu = true;
    }
  });
  check_unread();
}

function check_unread() {
  // Compter le nombre de messages non lus pour chaque salon et mettre à jour le badge de notifications correspondant
  const badges = document.getElementsByClassName('badge');
  for (let i = 0; i < badges.length; i++) {
    const salonId = badges[i].id.split('-')[0];
    let count = 0;
    lesMessages.forEach((message) => {
      if (message.salon === salonId && !message.recu) {
        count++;
      }
    });
    if (count > 0) {
      badges[i].textContent = count;
    } else {
      badges[i].textContent = '';
    }
  }
}/*
function salon(id) {
  // Mettre à jour iddes avec l'ID du destinataire
  iddes = id;
  // Si on est dans le salon général
  if (id === 'salon') {
    // Mettre à jour id_salon avec 'salon'
    id_salon = 'salon';
  } else {
    // Sinon, mettre à jour id_salon avec l'ID du destinataire
    id_salon = id;
  }
  // Récupérer les messages correspondant à l'ID du salon ou de la conversation
  // en utilisant une requête AJAX ou une méthode de l'API fetch par exemple.
  // Une fois les messages récupérés, mettre à jour le contenu de la div 'message-container'.
  // Voici un exemple de code pour mettre à jour le contenu de la div 'message-container'
  // en utilisant les messages récupérés :
  const messageContainer = document.getElementById('message-container');
  messageContainer.innerHTML = '';
  lesMessages.forEach((message) => {
    if (message.emet_id === socket.id && message.dest_id === id) {
      // Le message a été émis par l'utilisateur courant et destiné au salon ou à la conversation sélectionné
      // Ajouter le message au conteneur de messages avec une classe CSS pour le mettre en évidence
      const messageElem = document.createElement('li');
      messageElem.classList.add('sent');
      messageElem.textContent = message.msg;
      messageContainer.appendChild(messageElem);
    } else if (message.emet_id === id && message.dest_id === socket.id) {
      // Le message a été émis par le destinataire sélectionné et destiné à l'utilisateur courant
      // Ajouter le message au conteneur de messages avec une classe CSS pour le mettre en évidence
      const messageElem = document.createElement('li');
      messageElem.classList.add('received');
      messageElem.textContent = message.msg;
      messageContainer.appendChild(messageElem);
      // Mettre à jour l'état de réception du message
      message.recu = true;
    }
  });
  check_unread();
}

  function check_unread() {
    var socket = io();
    var badges = document.querySelectorAll('.badge');
  
    socket.on('reception_message', () => {
      // Incrémenter le nombre de messages non-lus pour chaque badge
      badges.forEach((badge) => {
        badge.textContent = parseInt(badge.textContent) + 1;
        badge.style.display = 'inline-block';
      });
    });
  
    // Masquer tous les badges lorsqu'on clique dessus
    badges.forEach((badge) => {
      badge.addEventListener('click', () => {
        badge.style.display = 'none';
        badge.textContent = '0';
      });
    });
  }*/