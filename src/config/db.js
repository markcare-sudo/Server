// // src/config/database.js
// require("dotenv").config();
// const { Sequelize } = require("sequelize");

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASS, // ✅ make sure .env has DB_PASS
//   {
//     host: process.env.DB_HOST || "localhost",
//     port: Number(process.env.DB_PORT || 3306),
//     dialect: "mysql",
//     logging: false,
//   }
// );

// let initialized = false;

// async function initDbOnce() {
//   if (initialized) return;

//   await sequelize.authenticate();
//   console.log("✅ DB connected");

//   // ✅ IMPORTANT: load all models BEFORE sync
//   require("../models");

//   // await sequelize.sync({ alter: true }); // dev only
//   await sequelize.sync();
//   console.log("✅ DB synced (tables created/updated)");

//   initialized = true;
// }

// module.exports = { sequelize, initDbOnce };



















// src/config/database.js
require("dotenv").config();
const { Sequelize } = require("sequelize");

const isProduction = process.env.NODE_ENV === "production";

const sequelize = isProduction
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      protocol: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // required for Render
        },
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432), // ✅ Postgres port
        dialect: "postgres",
        logging: false,
      }
    );

let initialized = false;

async function initDbOnce() {
  if (initialized) return;

  await sequelize.authenticate();
  console.log("✅ PostgreSQL connected");

  // ✅ Load all models BEFORE sync
  require("../models");

  // ⚠ Use alter:true only in development
  // await sequelize.sync({ alter: true });
  await sequelize.sync();

  console.log("✅ DB synced (tables created/updated)");

  initialized = true;
}

module.exports = { sequelize, initDbOnce };











// // src/config/database.js
// require("dotenv").config();
// const { Sequelize } = require("sequelize");

// const useSSL = process.env.DB_SSL === "true";

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASS,
//   {
//     host: process.env.DB_HOST || "localhost",
//     port: Number(process.env.DB_PORT || 5432),
//     dialect: "postgres",
//     logging: false,

//     dialectOptions: useSSL
//       ? {
//           ssl: {
//             require: true,
//             rejectUnauthorized: false,
//           },
//         }
//       : {},
//   }
// );

// let initialized = false;

// async function initDbOnce() {
//   if (initialized) return;

//   try {
//     await sequelize.authenticate();
//     console.log("✅ PostgreSQL connected");

//     require("../models");

//     await sequelize.sync();
//     console.log("✅ DB synced");

//     initialized = true;
//   } catch (error) {
//     console.error("❌ Database connection failed:", error.message);
//     process.exit(1);
//   }
// }

// module.exports = { sequelize, initDbOnce };