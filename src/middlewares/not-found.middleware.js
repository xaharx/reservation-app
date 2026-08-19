const { HTTP_STATUS } = require('../constants/http-status');
const { ApiError } = require('../utils/api-error');

function notFoundHandler(req, _res, next) {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = { notFoundHandler };
