const multer = require('multer');
const { Prisma } = require('@prisma/client');
const logger = require('../config/logger');
const { env } = require('../config/env');
const { HTTP_STATUS } = require('../constants/http-status');

function errorHandler(error, req, res, _next) {
  let statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = error.message || 'Internal server error.';

  if (error instanceof multer.MulterError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? `File is too large. Maximum size is ${Math.round(env.MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB.`
        : error.message;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = HTTP_STATUS.BAD_REQUEST;
      message = 'A record with this value already exists.';
    } else if (error.code === 'P2025') {
      statusCode = HTTP_STATUS.NOT_FOUND;
      message = 'Requested record was not found.';
    } else {
      statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
      message = 'Database request failed.';
    }
  }

  logger.error('Request failed', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: error.message,
    stack: error.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.details && { details: error.details }),
    ...(env.isDevelopment && statusCode >= 500 && { stack: error.stack }),
  });
}

module.exports = { errorHandler };
