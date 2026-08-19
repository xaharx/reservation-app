const { PrismaClient } = require('@prisma/client');
const { env } = require('./env');
const logger = require('./logger');

const prisma = new PrismaClient({
  log: env.isDevelopment ? ['warn', 'error'] : ['error'],
});

async function connectDatabase() {
  if (!env.DATABASE_URL) {
    logger.warn('DATABASE_URL is not configured; database connection was skipped.');
    return;
  }

  await prisma.$connect();
  logger.info('MySQL connection established through Prisma.');
}

async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('MySQL connection closed.');
}

module.exports = { prisma, connectDatabase, disconnectDatabase };
