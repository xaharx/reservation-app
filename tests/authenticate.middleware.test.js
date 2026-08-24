const test = require('node:test');
const assert = require('node:assert/strict');
const { createAuthenticateMiddleware } = require('../src/middlewares/authenticate.middleware');

function makeAuthService({ verifyToken, getCurrentAdminUser }) {
  return { verifyToken, getCurrentAdminUser };
}

function runMiddleware(middleware, req) {
  return new Promise((resolve) => {
    const res = {};
    middleware(req, res, (error) => resolve(error));
  });
}

test('authenticate rejects a request with no Authorization header', async () => {
  const middleware = createAuthenticateMiddleware(makeAuthService({}));
  const error = await runMiddleware(middleware, { headers: {} });

  assert.equal(error.statusCode, 401);
});

test('authenticate rejects a non-Bearer Authorization header', async () => {
  const middleware = createAuthenticateMiddleware(makeAuthService({}));
  const error = await runMiddleware(middleware, { headers: { authorization: 'Basic abc123' } });

  assert.equal(error.statusCode, 401);
});

test('authenticate attaches req.adminUser and calls next() with no error on a valid token', async () => {
  const authService = makeAuthService({
    verifyToken: () => ({ sub: '1', role: 'ADMIN' }),
    getCurrentAdminUser: async (id) => {
      assert.equal(id, 1n);
      return { id: '1', email: 'admin@oradenuit.com', role: 'ADMIN' };
    },
  });
  const middleware = createAuthenticateMiddleware(authService);
  const req = { headers: { authorization: 'Bearer valid-token' } };

  const error = await runMiddleware(middleware, req);

  assert.equal(error, undefined);
  assert.equal(req.adminUser.email, 'admin@oradenuit.com');
});

test('authenticate propagates the error when verifyToken rejects', async () => {
  const authService = makeAuthService({
    verifyToken: () => {
      const error = new Error('Invalid or expired session. Please log in again.');
      error.statusCode = 401;
      throw error;
    },
  });
  const middleware = createAuthenticateMiddleware(authService);
  const error = await runMiddleware(middleware, { headers: { authorization: 'Bearer bad-token' } });

  assert.equal(error.statusCode, 401);
});

test('authenticate propagates the error when the admin user is no longer valid', async () => {
  const authService = makeAuthService({
    verifyToken: () => ({ sub: '1', role: 'ADMIN' }),
    getCurrentAdminUser: async () => {
      const error = new Error('Invalid or expired session. Please log in again.');
      error.statusCode = 401;
      throw error;
    },
  });
  const middleware = createAuthenticateMiddleware(authService);
  const error = await runMiddleware(middleware, { headers: { authorization: 'Bearer valid-token' } });

  assert.equal(error.statusCode, 401);
});
