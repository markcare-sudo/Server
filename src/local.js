require("dotenv").config();
const http = require("http");
const { buildApp } = require("./app");
const { initDbOnce } = require("./config/db"); // or ./config/db

const PORT = process.env.PORT || 3000;

(async () => {
  await initDbOnce(); // authenticate + sync (dev)
  const app = buildApp();
  const httpServer = http.createServer(app);

  const { validateEnv } = require("./config/validateEnv");
  // Validate strict keys BEFORE raw bindings start natively securely gracefully 
  validateEnv();

  // Initialize WebSockets bypassing normal REST pipelines cleanly mapped
  const { Server } = require("socket.io");
  const { setIO } = require("./utils/socketEmitter");
  const { initBookingSocket } = require("./sockets/bookingSocket");

  const io = new Server(httpServer, {
    cors: {
      origin: "*", 
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"]
    }
  });

  setIO(io);
  initBookingSocket(io);

  httpServer.listen(PORT, () => {
    console.log(`✅ Local server: http://localhost:${PORT}`);
  });
})();
