const express = require("express");
const decryptBodyMiddleware = require("./middlewares/decryptBody.middleware");
const cors = require("cors");

function buildApp() {
  const app = express();

  // ✅ CORS (must be before routes)
  app.use(
    cors({
      origin: "http://localhost:5173", // your React frontend
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(decryptBodyMiddleware);

  app.get("/", (req, res) => res.send("✅ iQLIMS API running"));

  app.use(require("./routes/index.routes"));

  // error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ success: false, message: err.message || "Error" });
  });

  return app;
}

module.exports = { buildApp };
