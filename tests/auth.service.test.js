const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { AuthService } = require('../src/services/auth.service');

function makeAdminUser(overrides = {}) {
  return {
    id: 1n,
    firstName: 'Ora',
    lastName: 'Admin',
    email: 'admin@oradenuit.com',
    // bcrypt hash of "correct-password"
    passwordHash: bcrypt.hashSync('correct-password', 4),
    role: 'SUPER_ADMIN',
    isActive: true,
    deletedAt: null,
    lastLoginAt: null,
    ...overrides,
  };
}

function makeRepository(adminUser) {
  let stored = adminUser;
  return {
    async findByEmail(email) {
      return stored && stored.email === email ? stored : null;
    },
    async findById(id) {
      return stored && stored.id === id ? stored : null;
    },
    async updateLastLoginAt(id, lastLoginAt) {
      stored = { ...stored, id, lastLoginAt };
      return stored;
    },
  };
}

test('AuthService.login succeeds with correct credentials and returns a usable token', async () => {
  const adminUser = makeAdminUser();
  const service = new AuthService({ adminUserRepository: makeRepository(adminUser) });

  const result = await service.login({ email: 'admin@oradenuit.com', password: 'correct-password' });

  assert.equal(typeof result.token, 'string');
  assert.equal(result.adminUser.email, 'admin@oradenuit.com');
  assert.equal(result.adminUser.role, 'SUPER_ADMIN');
  assert.equal('passwordHash' in result.adminUser, false);

  const decoded = service.verifyToken(result.token);
  assert.equal(decoded.sub, '1');
  assert.equal(decoded.role, 'SUPER_ADMIN');
});

test('AuthService.login rejects an incorrect password', async () => {
  const service = new AuthService({ adminUserRepository: makeRepository(makeAdminUser()) });

  await assert.rejects(
    () => service.login({ email: 'admin@oradenuit.com', password: 'wrong-password' }),
    (error) => error.statusCode === 401,
  );
});

test('AuthService.login rejects an unknown email without revealing that distinction', async () => {
  const service = new AuthService({ adminUserRepository: makeRepository(makeAdminUser()) });

  await assert.rejects(
    () => service.login({ email: 'nobody@oradenuit.com', password: 'correct-password' }),
    (error) => error.statusCode === 401 && error.message === 'Invalid email or password.',
  );
});

test('AuthService.login rejects a deactivated account even with the correct password', async () => {
  const adminUser = makeAdminUser({ isActive: false });
  const service = new AuthService({ adminUserRepository: makeRepository(adminUser) });

  await assert.rejects(
    () => service.login({ email: 'admin@oradenuit.com', password: 'correct-password' }),
    (error) => error.statusCode === 401,
  );
});

test('AuthService.login rejects a soft-deleted account', async () => {
  const adminUser = makeAdminUser({ deletedAt: new Date('2026-01-01T00:00:00.000Z') });
  const service = new AuthService({ adminUserRepository: makeRepository(adminUser) });

  await assert.rejects(
    () => service.login({ email: 'admin@oradenuit.com', password: 'correct-password' }),
    (error) => error.statusCode === 401,
  );
});

test('AuthService.login updates lastLoginAt on success', async () => {
  const adminUser = makeAdminUser();
  const clock = () => new Date('2026-08-24T10:00:00.000Z');
  const service = new AuthService({ adminUserRepository: makeRepository(adminUser), clock });

  const result = await service.login({ email: 'admin@oradenuit.com', password: 'correct-password' });

  assert.equal(result.adminUser.lastLoginAt, '2026-08-24T10:00:00.000Z');
});

test('AuthService.verifyToken rejects a garbage token', () => {
  const service = new AuthService({ adminUserRepository: makeRepository(makeAdminUser()) });

  assert.throws(() => service.verifyToken('not-a-real-token'), (error) => error.statusCode === 401);
});

test('AuthService.getCurrentAdminUser rejects a deactivated account', async () => {
  const adminUser = makeAdminUser({ isActive: false });
  const service = new AuthService({ adminUserRepository: makeRepository(adminUser) });

  await assert.rejects(
    () => service.getCurrentAdminUser(1n),
    (error) => error.statusCode === 401,
  );
});
