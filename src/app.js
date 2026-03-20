const express = require("express");
const decryptBodyMiddleware = require("./middlewares/decryptBody.middleware");
const cors = require("cors");

function buildApp() {
  const app = express();

  // Public Health Endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || "development"
    });
  });

  // Swagger UI (Dev explicitly mapped routing structurally gracefully natively blocking Production leaks ideally if checked properly but requested strictly)
  if (process.env.NODE_ENV !== "production") {
    const swaggerUi = require("swagger-ui-express");
    const swaggerSpec = require("./config/swagger");
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  // ✅ CORS (must be before routes)
  app.use(
    cors({
      origin: "*", // your React frontend
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(decryptBodyMiddleware);

  app.get("/", (req, res) => res.send("✅ MCSERVER API running"));

  app.use(require("./routes/index.routes"));

  // error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ success: false, message: err.message || "Error" });
  });

  return app;
}

module.exports = { buildApp };
