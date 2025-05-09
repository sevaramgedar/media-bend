const app = require('./app');
const http = require('http');
const socketIO = require('socket.io');
const connectDB = require('./config/db');
const socketSetup = require('./socket/socket');

// Connect to Database
connectDB();

const server = http.createServer(app);

// Socket.io setup
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize socket connections
socketSetup(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});