const { HTTP_STATUS } = require('../constants/http-status');
const { ApiError } = require('../utils/api-error');
const { AuthService } = require('../services/auth.service');

/**
 * Verifies the Bearer JWT on every /admin/* request and attaches the fresh
 * admin user (not just the token's decoded claims) as req.adminUser — so a
 * deactivated/deleted account or a role change is enforced immediately
 * rather than only once the old token expires.
 */
function createAuthenticateMiddleware(authService = new AuthService()) {
  return async function authenticate(req, _res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required.'));
    }

    try {
      const decoded = authService.verifyToken(token);
      req.adminUser = await authService.getCurrentAdminUser(BigInt(decoded.sub));
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

/**
 * Optional role gate, layered after authenticate(). Kept separate since not
 * every /admin/* route needs it — most just need "is a logged-in admin."
 */
function requireRole(...allowedRoles) {
  return function requireRoleMiddleware(req, _res, next) {
    if (!req.adminUser || !allowedRoles.includes(req.adminUser.role)) {
      return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to do this.'));
    }
    return next();
  };
}

const authenticate = createAuthenticateMiddleware();

module.exports = { createAuthenticateMiddleware, authenticate, requireRole };
