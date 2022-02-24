const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, {cors: {
  origins: ['http://localhost:4200']
}});
let Peermoderator = require("./moderator.js");
let BattleConnection = require("./battleconnection.js");
let Peer = require("./peer.js");
let words = require("an-array-of-spanish-words");

let Moderator = new Peermoderator();
let broadcaster;
const clients = [];
const activeConnections = [];
let connectionsPairedUp = [];
let wordsForBattle = [];


function createWordsList(){
  let array = [];
  for(let i = 0; i < 10; i++){
    let index = getRandomInt(words.length)
    array.push(words[index])
  }
  return array;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

createWordsList();

io.sockets.on('connection', function (socket) {
  let peer = new Peer();
  peer.socketid = socket.id;
  clients.push(peer);
  // for(let i = 0; i < ;i++){
  //   clients.push(peer);
  // }
  socket.on('setnickname', function(nickname){
    setNickname(socket.id, nickname);
    socket.emit('getAllPeers', clients);
    socket.broadcast.emit('getAllPeers', clients);
  });
 

 


  console.log('Currently there are ' + clients.length + ' connected', clients);

  socket.on('readyToBattle', function (socketid) {
    createConnections(socket.id);
    let wordsForPeer1 = createWordsList();
    let wordsForPeer2 = createWordsList();
    let words = {peer1: wordsForPeer1, peer2:wordsForPeer2}
    connectionsPairedUp = Moderator.getConnectionsPairedUp(activeConnections);
    let peerHasAPair = Moderator.checkIfPeerIsInSpecificConnection(connectionsPairedUp, socketid)
    if (connectionsPairedUp.length > 0 && peerHasAPair) {
      connectionsPairedUp.forEach((conn) => {
        if (conn.reciever === socketid || conn.sender === socketid) {
          socket.to(conn.reciever).emit('onOffer', conn.sender, words);
          socket.emit('onSendOffer', conn.reciever, words);
          // connectionsPairedUp.splice(connectionsPairedUp.indexOf(conn), 1);
        }
      });
    }
  });
  socket.on('broadcaster', function () {
    broadcaster = socket.id;
    socket.broadcast.emit('broadcaster');
  });

  socket.on('watcher', function () {
    socket.to(broadcaster).emit('watcher', socket.id);
  });
  socket.on('offer', function (id /* of the watcher */, message, userDetails) {
    if (id != socket.id) {
      socket.to(id).emit('offer', socket.id /* of the broadcaster */, message, userDetails);
    }
  });
  socket.on('answer', function (id /* of the broadcaster */, message, userDetails) {
    socket.to(id).emit('answer', socket.id /* of the watcher */, message, userDetails);
    
  });
  socket.on('candidate', function (id, message) {
    if (id != socket.id) {
      socket.to(id).emit('candidate', socket.id, message);

    }
  });
  socket.on('disconnect', function (message) {
    let partnerId = Moderator.findPartner(connectionsPairedUp, socket.id);
    console.log(partnerId, "partner id")
    io.sockets.to(partnerId).emit('bye', socket.id);
    Moderator.deletePeerOnDisconnection(clients, socket.id);
    Moderator.deletePeerFromConnection(activeConnections, socket.id);
    Moderator.deleteConnectionWhenEmpty(activeConnections);
    Moderator.pairUpAfterDisconnection(activeConnections);
    console.log(activeConnections, "activeconnections on disconnect")
    socket.broadcast.emit('getAllPeers', clients);
    socket.emit('getAllPeers', clients);
    connectionsPairedUp = Moderator.getConnectionsPairedUp(activeConnections)
    console.log(activeConnections, "activeconnections on disconnect after getconnectionspairedup")
    socket.emit('bye', socket.id)
    socket.broadcast.emit('getAllPeers', clients )
    console.log("client" + socket.id, "has disconnected, currently there are", clients.length, "connected")
  });

  socket.on('imfree', (freePeerId) => {
    Moderator.deletePeerFromConnection(activeConnections, freePeerId);
    Moderator.deleteConnectionWhenEmpty(activeConnections);
    Moderator.pairUpAfterDisconnection(activeConnections);
    // connectionsPairedUp = Moderator.getConnectionsPairedUp(activeConnections)
  })

  socket.on('bye', function (id) {
    console.log(id, "id on bye")
    socket.broadcast.emit('getAllPeers', clients);

    broadcaster && socket.to(broadcaster).emit('bye', id);
    // socket.broadcast.emit('bye');
    Moderator.pairUpAfterDisconnection(activeConnections);
  });
});


///tools
function createConnections(socketid) {
  let connectionId;
  if (activeConnections.length === 0) {
    let conn = new BattleConnection();
    conn.reciever = socketid;
    activeConnections.push(conn)
    connectionId = conn.id;
  } else {
    let isPeerAlreadyInConnection = Moderator.checkIfClientIsAlreadyInConnection(activeConnections, socketid);
    let connWaiting = Moderator.getConnectionWaiting(activeConnections)
    if (!isPeerAlreadyInConnection && !connWaiting) {
      let conn = new BattleConnection();
      conn.reciever = socketid;
      activeConnections.push(conn);
      connectionId = conn.id;
    } else if (!isPeerAlreadyInConnection && connWaiting) {
      Moderator.insertPeerInConnection(activeConnections, connWaiting, socketid)
      connectionId = connWaiting;
    }
  }
  return connectionId;
}


function setNickname(socketid, nickname){
  for(let i = 0; i < clients.length; i++){
    if(clients[i].socketid === socketid){
      clients[i].nickname = nickname
    }
  }
}
createWordsList()

console.log(this.wordsForBattle, "words")


server.listen(3000, () => {
  console.log("socket.io server is listening on port 3000");
});