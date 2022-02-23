class Moderator {
  constructor() {}

  checkIfClientIsAlreadyInConnection(connArray, peerId) {
    let isAllocated = false;
    let connection = connArray.filter((conn) => {
      return conn.sender === peerId || conn.reciever === peerId;
    });
    if (connection.length === 0) {
      return isAllocated;
    } else {
      isAllocated = connection[0].connectionId;
      return isAllocated;
    }
  }

  getConnectionWaiting(connArray) {
    let result;
    connArray.forEach((conn) => {
      if (conn.reciever === null && conn.sender != null) {
        result = conn.id;
      } else if (conn.sender === null && conn.reciever != null) {
        result = conn.id;
      } else {
        result = false;
      }
    });
    return result;
  }

  getConnectionsPairedUp(connArray) {
    return connArray.filter((conn) => {
      return conn.reciever != null && conn.sender != null;
    });
  }

  checkIfPeerIsInSpecificConnection(connArray, peerId) {
    let resultBoolean;
    for (let i = 0; i < connArray.length; i++) {
      if (connArray[i].reciever != null && connArray[i].sender != null) {
        if (
          connArray[i].reciever === peerId ||
          connArray[i].sender === peerId
        ) {
          resultBoolean = true;
        } else {
          resultBoolean = false;
        }
      }
    }

    return resultBoolean;
  }

  findPartner(connArray, peerId) {
    let partnerId;
    let conn = connArray.filter((connexion) => {
      return connexion.reciever === peerId || connexion.sender === peerId;
    });
    console.log(connArray, peerId, "conn 56");
    if (conn.length > 0) {
      if (conn[0].reciever === peerId) {
        partnerId = conn[0].sender;
      } else if (conn[0].sender === peerId) {
        partnerId = conn[0].reciever;
      }
    }
    return partnerId;
  }

  insertPeerInConnection(connArray, connId, peerid) {
    connArray.forEach((conn) => {
      if (
        conn.id === connId &&
        conn.reciever === null &&
        conn.sender != peerid
      ) {
        conn.reciever = peerid;
      } else if (
        conn.id === connId &&
        conn.sender === null &&
        conn.reciever != peerid
      ) {
        conn.sender = peerid;
      }
    });
  }

  setIsReadyOnPeer(peerArray, peerId) {
    peerArray.forEach((peer) => {
      if (peer.socketid === peerId) {
        peer.isReady = true;
      }
    });
  }

  setNicknameOnPeer(peerArray, peerId, nickname) {
    peerArray.forEach((peer) => {
      if (peer.socketid === peerId) {
        peer.nickname = nickname;
      }
    });
  }

  deletePeerOnDisconnection(array, peerToBeDeletedId) {
    array.forEach((peer, index) => {
      if (peer.socketid === peerToBeDeletedId) {
        array.splice(index, 1);
      }
    });
  }

  deletePeerFromConnection(connArray, socketid) {
    connArray.forEach((conn, index) => {
      if (conn.reciever === socketid) {
        conn.reciever = null;
      } else if (conn.sender === socketid) {
        conn.sender = null;
      }
    });
  }

  deleteConnectionWhenEmpty(connArray) {
    connArray.forEach((conn, index) => {
      if (conn.sender === null && conn.reciever === null) {
        connArray.splice(index, 1);
      }
    });
  }

  setConexionSender(connectionArray, senderId) {
    connectionArray.forEach((connection) => {
      if (connection.sender === null) {
        connection.sender = senderId;
      }
    });
  }

  setConexionReciever(connectionArray, recieverId) {
    connectionArray.forEach((connection) => {
      if (connection.reciever === null) {
        connection.reiever = recieverId;
      }
    });
  }

  returnUnpairedPeerIdInConn(conn) {
    let peerId;
    if (conn.reciever != null) {
      peerId = conn.reciever;
    } else if (conn.sender != null) {
      peerId = conn.sender;
    }
    return peerId;
  }

  returnIndexOfUnpairedConnection(connectionArray, connId) {
    let index;
    connectionArray.forEach((connection, ind) => {
      if (connection.id === connId) {
        index = ind;
      }
    });
    return index;
  }

  deleteConnection(array, connectionId) {
    array.forEach((connection, index) => {
      if (connection.id === connectionId) {
        array.splice(index, 1);
      }
    });
  }

  pairUpAfterDisconnection(connectionArray) {
    let arrayOfUnparedConnections = connectionArray.filter((connection) => {
      return (
        (connection.sender === null && connection.reciever != null) ||
        (connection.reciever === null && connection.sender != null)
      );
    });

    while (arrayOfUnparedConnections.length >= 2) {
      let unpairedConn1 = arrayOfUnparedConnections[0];
      let unpairedConn2 = arrayOfUnparedConnections[1];
      connectionArray.forEach((connection) => {
        if (
          connection.id === unpairedConn1.id &&
          connection.reciever === null
        ) {
          let movingPeer = this.returnUnpairedPeerIdInConn(unpairedConn2);
          connection.reciever = movingPeer;
          this.deleteConnection(connectionArray, unpairedConn2.id);
          arrayOfUnparedConnections.splice(0, 2);
        } else if (
          connection.id === unpairedConn1.id &&
          connection.sender === null
        ) {
          let movingPeer = this.returnUnpairedPeerIdInConn(unpairedConn2);
          connection.sender = movingPeer;
          this.deleteConnection(connectionArray, unpairedConn2.id);
          arrayOfUnparedConnections.splice(0, 2);
        }
      });

      console.log(connectionArray);
    }
  }
}

module.exports = Moderator;
