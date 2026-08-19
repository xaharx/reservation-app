const { HTTP_STATUS } = require('../constants/http-status');

function getHealth(_req, res) {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'API is running',
  });
}

module.exports = { getHealth };
