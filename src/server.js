const { app } = require('./app');
const { env } = require('./config/env');
const logger = require('./config/logger');
const { connectDatabase, disconnectDatabase } = require('./config/database');

let server;

async function startServer() {
  try {
    await connectDatabase();

    server = app.listen(env.PORT, () => {
      logger.info(`ORA DE NUIT API is listening on port ${env.PORT}.`);
    });
  } catch (error) {
    logger.error('Failed to start the server.', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`${signal} received. Closing server gracefully.`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
