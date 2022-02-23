module.exports = class Peer {
  constructor() {
    this.socketid = null;
    this.state = false;
    this.nickname = null;
    this.isReady = false;
  }
};
