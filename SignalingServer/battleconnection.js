module.exports = class BattleConnection {
  constructor() {
    this.id = Date.now();
    this.reciever = null;
    this.sender = null;
    this.connected = false;
  }
};
