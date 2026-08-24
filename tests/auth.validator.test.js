const test = require('node:test');
const assert = require('node:assert/strict');
const { loginSchema } = require('../src/validators/auth.validator');

test('loginSchema accepts a valid email/password pair', () => {
  const result = loginSchema.safeParse({ email: 'admin@oradenuit.com', password: 'secret123' });
  assert.equal(result.success, true);
});

test('loginSchema lowercases and trims the email', () => {
  const result = loginSchema.safeParse({ email: ' ADMIN@ORADENUIT.COM ', password: 'secret123' });
  assert.equal(result.success, true);
  assert.equal(result.data.email, 'admin@oradenuit.com');
});

test('loginSchema rejects a missing password', () => {
  const result = loginSchema.safeParse({ email: 'admin@oradenuit.com' });
  assert.equal(result.success, false);
});

test('loginSchema rejects an invalid email', () => {
  const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret123' });
  assert.equal(result.success, false);
});

test('loginSchema rejects unknown fields', () => {
  const result = loginSchema.safeParse({
    email: 'admin@oradenuit.com',
    password: 'secret123',
    role: 'SUPER_ADMIN',
  });
  assert.equal(result.success, false);
});
