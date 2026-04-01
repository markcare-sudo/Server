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
        rejectUnauthorized: false,
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








