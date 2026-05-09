// require("dotenv").config();
// const http = require("http");
// const { buildApp } = require("./app");
// const { initDbOnce } = require("./config/db"); // or ./config/db

// const PORT = process.env.PORT || 3000;

// (async () => {
//   await initDbOnce(); // authenticate + sync (dev)
//   const app = buildApp();
//   http.createServer(app).listen(PORT, () => {
//     console.log(`✅ Local server: http://localhost:${PORT}`);
//   });
// })();



require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const { buildApp } = require("./app");
const { initDbOnce } = require("./config/db");
const { setIO } = require("./socket");
// const { setIO } = require("./utils/socket");

const PORT = process.env.PORT || 3001;

(async () => {
  await initDbOnce();

  const app = buildApp();

  const server = http.createServer(app);

  // SOCKET.IO
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  // SAVE IO INSTANCE
  setIO(io);

  // BOOKINGS NAMESPACE
  io.of("/bookings").on("connection", (socket) => {
    console.log("✅ Booking Socket Connected:", socket.id);

    socket.on("join-booking-room", (bookingId) => {
      socket.join(`booking:${bookingId}`);
      console.log(`Joined booking:${bookingId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Booking Socket Disconnected");
    });
  });

  server.listen(PORT, () => {
    console.log(`✅ Server running on ${PORT}`);
  });
})();