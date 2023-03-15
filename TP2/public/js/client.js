var socket = io();
var iddes = null;
var pseudoname = null;
var dest_id = null;
//socket.emit('set-pseudo',prompt("Pseudo ?"));


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
 console.log("messages"+JSON.stringify(messageObj))
  salon(contenu.emet_id)
  checkUnread();

});

socket.on('reception_utilisateur', (utilisateurs) => {

  
  console.table(utilisateurs);
  const userListElem = document.getElementById('user-list');
  userListElem.innerHTML = '';

 
  utilisateurs.forEach((utilisateur) => {
    
    if (utilisateurs.length === 1) {
      console.log("voici le pseudo : "+utilisateur.pseudo_client)
      const messageElem = document.createElement('li');
      messageElem.innerText = 'Aucun utilisateur en ligne';
      userListElem.appendChild(messageElem);
      return;
    }
    if (utilisateur.id_client !== socket.id && utilisateur.pseudo_client != null && utilisateur.pseudo_client != undefined ) {
  
      
      const pseudoElem = document.createElement('li');
      pseudoElem.innerHTML = '<a href="#" onClick="startPrivateConversation(\'' + utilisateur.id_client + '\', \'' + utilisateur.pseudo_client + '\')" >' + utilisateur.pseudo_client + '</a>';
      userListElem.appendChild(pseudoElem);

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
    if (utilisateur.id_client == socket.id && utilisateur.pseudo_client != null && utilisateur.pseudo_client != undefined ) {
      pseudoname=utilisateur.pseudo_client;
      const pseudoElem = document.createElement('li');
      pseudoElem.innerHTML = '<a href="#" onClick="startPrivateConversation(\'' + utilisateur.id_client + '\', \'' + utilisateur.pseudo_client + '\')" >' + utilisateur.pseudo_client+'(you)' + '</a>';
      userListElem.appendChild(pseudoElem);

      pseudoElem.addEventListener('click', () => {
        console.log("voici le pseudo : "+utilisateur.pseudo_client)
        iddes = utilisateur.id_client;
        id_salon = utilisateur.id_client;
        const messageContainer = document.getElementById('message-container');
        messageContainer.innerHTML = '';
      });
    }
  });
});


function startPrivateConversation(dest_id, dest_pseudo) {
  const messageprivee = document.getElementById('message-privee');
  messageprivee.innerHTML = '';

  // Créer une nouvelle salle de discussion pour la conversation privée
  const privateRoomName = dest_id;
  socket.emit('creer_salon_prive', privateRoomName);

  // Mettre à jour l'ID de la salle de discussion actuelle
  id_salon = privateRoomName;
  dest_id = dest_id;
  console.log('Destination ID : ' + dest_id);

  // Vider le contenu des messages du salon stockés dans le message-container
  const messageContainer = document.getElementById('message-container');
  messageContainer.innerHTML = '';

  // Afficher le contenu de la conversation privée dans le conteneur de messages
  lesMessages.forEach((message) => {
    if ((message.emet_id === socket.id && message.dest_id === dest_id) || (message.emet_id === dest_id && message.dest_id === socket.id)) {
      const messageElem = document.createElement('div');
      if (message.emet_id === socket.id) {
        messageprivee.innerHTML = '<ul  style="background-color: #665dfe; float:right;" ><b>Vous : </b>' + message.msg+'</ul>';
        messageContainer.appendChild(messageElem);
      } else if (message.emet_id === dest_id) {
        messageprivee.innerHTML = '<ul   style="background-color: #fe5d5d; float:left;" >'+dest_pseudo + ' : ' +message.msg+'</ul>';
        messageContainer.appendChild(messageElem);

      }
    }
  })
}


function salon(id) {
  console.log('voici l id : '+id);
  const messageContainer = document.getElementById('message-container');
  messageContainer.innerHTML='';

  // Afficher chaque message dans le conteneur de messages
  lesMessages.forEach((message) => {
    message.recu =false;
      const messageElem = document.createElement('div');
      if(message.dest_id == null){
          if (message.emet_id === socket.id) {
          console.log("ça passe")
          // Si le message a été envoyé par l'utilisateur courant, le mettre en gras
          messageElem.innerHTML = '<ul  style="background-color: #665dfe; float:right;" ><b>Vous : </b>' + message.msg+'</ul>';
          messageContainer.appendChild(messageElem);
        } else if (message.emet_id !== socket.id) {
          // Si le message a été envoyé par un autre utilisateur, afficher son pseudo
          messageElem.innerHTML = '<ul   style="background-color: #fe5d5d; float:left;" >'+message.pseudo + ' : ' +message.msg+'</ul>';
          messageContainer.appendChild(messageElem);
          message.recu =true;
        }
        /*if (message.dest_id === socket.id) {
          // Si le message est un message privé pour l'utilisateur courant, afficher l'émetteur du message
          messageElem.innerHTML += '<span style="font-size: 10px; color: grey;"> de ' + message.pseudo + '</span>';
          messageContainer.appendChild(messageElem);
        }*/
      }
      
    
  });
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


/*
function checkUnread() {
  const userListElem = document.getElementById('user-list');
  const listItems = userListElem.getElementsByTagName('li');

  for (let i = 0; i < listItems.length; i++) {
    const anchorElem = listItems[i].getElementsByTagName('a')[0];
    const destId = anchorElem.getAttribute('onClick').match(/'(.*?)'/)[1];
    let countUnread = 0;

    lesMessages.forEach((message) => {
      if (message.dest_id === destId && !message.recu) {
        countUnread++;
      }
    });

    if (countUnread > 0) {
      anchorElem.innerText = anchorElem.innerText.replace(/\(\d+\)/, '') + ` (${countUnread})`;
    } else {
      anchorElem.innerText = anchorElem.innerText.replace(/\(\d+\)/, '');
    }

    anchorElem.addEventListener('click', () => {
      for (let j = 0; j < lesMessages.length; j++) {
        if (lesMessages[j].dest_id === destId) {
          lesMessages[j].recu = true;
        }
      }
      checkUnread();
    });
  }
}


/*
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
    if (userElem.childNodes[0] && userElem.childNodes[0].tagName === "A") {
      const userId = userElem.childNodes[0].getAttribute('onclick').match(/'([^']+)'/)[1];
      const unreadCount = unreadCounts[userId] || 0;
      const unreadCountElem = document.createElement('span');
      unreadCountElem.className = 'unread-count';
      unreadCountElem.innerText = unreadCount > 0 ? `(${unreadCount})` : '';
      userElem.appendChild(unreadCountElem);
    }
  });
}

/*
function checkUnread() {
  const userListElem = document.getElementById('user-list');
  const users = userListElem.querySelectorAll('li');
  for (let i = 0; i < users.length; i++) {
    const userId = users[i].querySelector('a').getAttribute('data-id');
    let count = 0;
 
    for (let j = 0; j < lesMessages.length; j++) {
      const message = lesMessages[j];
      if (message.emet_id === userId && message.recu === true) {
        count++;
      }
    }
    const badge = users[i].querySelector('.badge');
    if (badge) {
      badge.innerText = count;
    } else {
      const badgeElem = document.createElement('span');
      badgeElem.classList.add('badge');
      badgeElem.innerText = count;
      users[i].appendChild(badgeElem);
    }
  }
}


/*
function checkUnread() {
  const unreadcount = document.getElementById('unread-count');
  var unreadCount = 0;
  for (var i = 0; i < lesMessages.length; i++) {
    if (lesMessages[i].recu === true) {
      unreadCount++;
    }
  }
  if (unreadCount > 0) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML ="(" + unreadCount + ")";
    unreadcount.appendChild(messageElement);
  } else {
    document.title = "Chat";
   
  }
}

/*
function checkUnread() {
  const userListElem = document.getElementById('user-list');
  const messages = lesMessages.filter((msg) => msg.recu === false && msg.dest_id === socket.id);
  userListElem.childNodes.forEach((child) => {
    const pseudo = child.firstChild.innerText;
    const badgeElem = document.createElement('span');
    badgeElem.className = 'badge badge-primary badge-pill';
    const userMsgs = messages.filter((msg) => msg.pseudo === pseudo);
    if (userMsgs.length > 0) {
      badgeElem.innerText = userMsgs.length;
    }
    console.log("nombre badge "+badgeElem)
    child.appendChild(badgeElem);
  });
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