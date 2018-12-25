module.exports = class SocketHandler {
  constructor(io) {
    this._io = io;
    this._init();
  }

  _init() {
    this._io.on('connection', this._connection);
    this._io.on('contact_request', this._contactRequest);
  }

  _connection(socket) {
    console.log('connected');
    socket.emit('connection_server');
    console.log('sent');
  }

  _contactRequest(socket) {
    console.log('contact_request');
    socket.emit('contact_request_server');
    console.log('sent');
  }
}