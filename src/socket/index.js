// socket/index.js
const { Server } = require('socket.io');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*', // you can restrict later using process.env.FRONTEND_URL
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', socket.id, reason);
    });
  });

  return io;
}

module.exports = { initSocket };
