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
    this._io.to(socket.socketid).emit('connection_server');
  }

  _contactRequest(socket) {
    console.log('contact_request');
    this._io.to(socket.socketid).emit('contact_request_server');
  }
}