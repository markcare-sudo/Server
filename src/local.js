require("dotenv").config();
const http = require("http");
const { buildApp } = require("./app");
const { initDbOnce } = require("./config/db"); // or ./config/db

const PORT = process.env.PORT || 3000;

(async () => {
  await initDbOnce(); // authenticate + sync (dev)
  const app = buildApp();
  http.createServer(app).listen(PORT, () => {
    console.log(`✅ Local server: http://localhost:${PORT}`);
  });
})();
