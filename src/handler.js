const serverlessExpress = require("@vendia/serverless-express");
const { buildApp } = require("./src/app");
const { initDbOnce } = require("./src/config/db"); // or ./src/config/database.js (use your real file)

let cachedServer;

async function bootstrap() {
  // DB init once per warm container
  await initDbOnce();

  const app = buildApp();
  return serverlessExpress({ app });
}

exports.handler = async (event, context) => {
  // IMPORTANT for sequelize/mysql in lambda
  context.callbackWaitsForEmptyEventLoop = false;

  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  return cachedServer(event, context);
};
