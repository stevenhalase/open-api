require('dotenv').config();
const hapi = require('hapi');
const firearch = require('firearch');

firearch.connect({ timestampsInSnapshots: true }, 'peaceful-basis-227118.appspot.com');

// swagger section
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Package = require('./package');

// routes
const UserRoutes = require('./routes/User');

//models
const User = require('./models/User');

const server = hapi.server({
  port: process.env.PORT || 3000,
  routes: {
    cors: true
  }
});


const validate = async function (decoded, request) {

	// do your checks to see if the person is valid
	const user = await User.findById(decoded.id);
	if (!user) {
		return { isValid: false };
	}
	else {
		request._currentUser = user;
		return { isValid: true };
	}
};

const io = require('socket.io')(server.listener);

const users = [];

class SocketHandler {
  constructor(socket, users) {
    this._socket = socket;
    this._socketId = socket.id;
    this._users = users;
    this._users.push({ socketId: this._socketId });
    this._init();
  }

  _init() {
    this._connection = this._connection.bind(this);
    this._userId = this._userId.bind(this);
    this._messageSend = this._messageSend.bind(this);
    this._messageReceived = this._messageReceived.bind(this);
    this._pingOnlineUsers = this._pingOnlineUsers.bind(this);

    this._socket.on('user_id', this._userId);
    this._socket.on('message_send', this._messageSend);
    this._socket.on('message_received', this._messageReceived);
    this._socket.on('ping_online_users', this._pingOnlineUsers);
    this._connection()
  }

  _connection() {
    this._socket.emit('connection_server');
  }

  _userId(id) {
    const oldConnectionInd = this._users.findIndex(u => u.userId === id);
    if (oldConnectionInd > -1) {
      this._users.splice(oldConnectionInd, 1);
    }

    const user = this._users.find(u => u.socketId === this._socketId);
    user.userId = id;
    this._socket.emit('user_id_server');
  }

  _messageSend(message) {
    this._socket.emit('message_confirmation_sent', message);
    const to = this._users.find(u => u.userId === message.to);
    io.to(to.socketId).emit('message_incoming', message);
  }

  _messageReceived(message) {
    const from = this._users.find(u => u.userId === message.from);
    io.to(from.socketId).emit('message_confirmation_received', message);
  }

  _pingOnlineUsers(contacts) {
    const response = [];
    for (const contact of contacts) {
      const ind = this._users.findIndex(u => u.userId === contact);
      const contactRes = { online: ind > -1, contact };
      response.push(contactRes);
    }
    this._socket.emit('ping_online_users_response', response);
  }
}


io.sockets.on('connection', (socket) => {
  const socketHandler = new SocketHandler(socket, users);
});


const init = async () => {

  await server.register([
		Inert,
		Vision,
		{
			plugin: HapiSwagger,
			options: {
				info: {
					title: 'Open API Documentation',
					version: Package.version
				},
				grouping: 'tags',
				securityDefinitions: {
						'jwt': {
								'type': 'apiKey',
								'name': 'Authorization',
								'in': 'header'
						}
				},
				security: [{ 'jwt': [] }],
			}
		}
  ]);
	
	await server.register(require('hapi-auth-jwt2'));

  server.auth.strategy('jwt', 'jwt',
  { key: process.env.JWT_SECRET,
    validate: validate,
    verifyOptions: { algorithms: [ 'HS256' ] }
  });

	server.auth.default('jwt');
  
  server.route([
		{
			method: 'GET',
			path: '/',
			config: {
				handler: (req, reply) => {
					return reply.redirect('/documentation');
				}
			}
		},
		...UserRoutes
	]);

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

init();