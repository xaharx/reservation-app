const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { HTTP_STATUS } = require('../constants/http-status');
const { ApiError } = require('../utils/api-error');
const { AdminUserRepository } = require('../repositories/admin-user.repository');

function toAdminUserResponse(adminUser) {
  return {
    id: adminUser.id.toString(),
    firstName: adminUser.firstName,
    lastName: adminUser.lastName,
    email: adminUser.email,
    role: adminUser.role,
    lastLoginAt: adminUser.lastLoginAt ? adminUser.lastLoginAt.toISOString() : null,
  };
}

class AuthService {
  constructor({
    adminUserRepository = new AdminUserRepository(),
    clock = () => new Date(),
  } = {}) {
    this.adminUserRepository = adminUserRepository;
    this.clock = clock;
  }

  /**
   * JWT_SECRET is optional at the env-schema level (so the rest of the API
   * still boots without it) but auth cannot function without it — fail loud
   * and clear here rather than letting jwt.sign throw a cryptic error.
   */
  requireJwtSecret() {
    if (!env.JWT_SECRET) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Admin authentication is not configured on this server (missing JWT_SECRET).',
      );
    }
    return env.JWT_SECRET;
  }

  signToken(adminUser) {
    const secret = this.requireJwtSecret();
    return jwt.sign(
      { sub: adminUser.id.toString(), email: adminUser.email, role: adminUser.role },
      secret,
      { expiresIn: env.JWT_EXPIRES_IN },
    );
  }

  verifyToken(token) {
    const secret = this.requireJwtSecret();
    try {
      return jwt.verify(token, secret);
    } catch {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired session. Please log in again.');
    }
  }

  async login({ email, password }) {
    const adminUser = await this.adminUserRepository.findByEmail(email);

    // Same generic error whether the email doesn't exist, the account is
    // deactivated/deleted, or the password is wrong — never leak which one,
    // to avoid letting an attacker enumerate valid admin email addresses.
    const invalidCredentialsError = new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Invalid email or password.',
    );

    if (!adminUser || adminUser.deletedAt || !adminUser.isActive) {
      throw invalidCredentialsError;
    }

    const passwordMatches = await bcrypt.compare(password, adminUser.passwordHash);
    if (!passwordMatches) {
      throw invalidCredentialsError;
    }

    const updatedAdminUser = await this.adminUserRepository.updateLastLoginAt(
      adminUser.id,
      this.clock(),
    );

    return {
      token: this.signToken(updatedAdminUser),
      adminUser: toAdminUserResponse(updatedAdminUser),
    };
  }

  async getCurrentAdminUser(adminUserId) {
    const adminUser = await this.adminUserRepository.findById(adminUserId);
    if (!adminUser || adminUser.deletedAt || !adminUser.isActive) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired session. Please log in again.');
    }
    return toAdminUserResponse(adminUser);
  }
}

module.exports = { AuthService, toAdminUserResponse };
