// const express = require("express");
// const decryptBodyMiddleware = require("./middlewares/decryptBody.middleware");
// const cors = require("cors");

// function buildApp() {
//   const app = express();

//    app.use(
//     cors({
//       origin: "*", // your React frontend
//       credentials: true,
//       methods: ["GET", "POST", "PUT", "DELETE"],
//       allowedHeaders: ["Content-Type", "Authorization"],
//     })
//   );

//   app.use(express.json({ limit: "15mb" }));
//   app.use(express.urlencoded({ extended: true }));
//   app.use(decryptBodyMiddleware);

//   app.get("/", (req, res) => res.send("✅ Mark Care API running"));

//   app.use(require("./routes/index.routes"));

//   // error handler
//   app.use((err, req, res, next) => {
//     console.error(err);
//     res.status(err.status || 500).json({ success: false, message: err.message || "Error" });
//   });

//   return app;
// }

// module.exports = { buildApp };












const express = require("express");
const decryptBodyMiddleware = require("./middlewares/decryptBody.middleware");
const cors = require("cors");

function buildApp() {

  const app = express();

  /*
  =====================================
  CORS
  =====================================
  */

  app.use(
    cors({
      origin: "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  /*
  =====================================
  BODY PARSER
  =====================================
  */

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true }));

  /*
  =====================================
  CUSTOM MIDDLEWARE
  =====================================
  */

  app.use(decryptBodyMiddleware);

  /*
  =====================================
  HEALTH CHECK
  =====================================
  */

  app.get("/", (req, res) => {
    res.send("✅ Mark Care API running");
  });

  /*
  =====================================
  ROUTES
  =====================================
  */

  app.use(require("./routes/index.routes"));

  /*
  =====================================
  ERROR HANDLER
  =====================================
  */

  app.use((err, req, res, next) => {

    console.error("❌ Error:", err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });

  });

  return app;
}

module.exports = { buildApp };