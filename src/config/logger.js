const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { env } = require('./env');

const logsDirectory = path.resolve(process.cwd(), 'src/logs');
fs.mkdirSync(logsDirectory, { recursive: true });

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'ora-de-nuit-api' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDirectory, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({ filename: path.join(logsDirectory, 'combined.log') }),
  ],
});

if (!env.isProduction) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  );
}

module.exports = logger;
