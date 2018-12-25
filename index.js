require('dotenv').config();
const hapi = require('hapi');
const firearch = require('firearch');

const firebaseConfig = JSON.parse(process.env.FIREBASECONFIG);
firearch.connect(firebaseConfig, { timestampsInSnapshots: true });

// swagger section
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Package = require('./package');

// routes
const UserRoutes = require('./routes/User');

const server = hapi.server({
  port: process.env.PORT || 3000,
  routes: {
    cors: true
  }
});

const io = require('socket.io')(server.listener);

class SocketHandler {
  constructor(io) {
    this._io = io;
    this._init();
  }

  _init() {
    this._io.sockets.on('connection', (socket) => {
			console.log('connected');
			socket.emit('connection_server', 'hello');
			console.log('sent');
		});
    this._io.on('contact_request', (socket) => {
			console.log('contact_request');
			socket.emit('contact_request_server', 'thanks');
			console.log('sent');
		});
  }

  // _connection(socket) {
  //   console.log('connected');
  //   socket.emit('connection_server', 'hello');
  //   console.log('sent');
  // }

  // _contactRequest(socket) {
  //   console.log('contact_request');
  //   socket.emit('contact_request_server');
  //   console.log('sent');
  // }
}

const socketHandler = new SocketHandler(io);

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
				grouping: 'tags'
			}
		}
  ]);
  
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