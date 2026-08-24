const { HTTP_STATUS } = require('../constants/http-status');
const { AuthService } = require('../services/auth.service');
const { asyncHandler } = require('../utils/async-handler');

function createAuthController(authService = new AuthService()) {
  return {
    login: asyncHandler(async (req, res) => {
      const { token, adminUser } = await authService.login(req.body);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logged in successfully.',
        data: { token, adminUser },
      });
    }),
    me: asyncHandler(async (req, res) => {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Current admin user retrieved successfully.',
        data: req.adminUser,
      });
    }),
    logout: asyncHandler(async (_req, res) => {
      // JWTs are stateless here (no server-side session/blacklist), so
      // logout is enforced client-side by discarding the token. This
      // endpoint exists for a consistent API surface and so a future
      // token-blacklist/refresh-token scheme has somewhere to hook in
      // without changing the frontend's contract.
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logged out successfully.',
        data: null,
      });
    }),
  };
}

const authController = createAuthController();

module.exports = { createAuthController, authController };
