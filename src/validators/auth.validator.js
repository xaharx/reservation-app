const { z } = require('zod');

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Email must be valid.').max(191),
    password: z.string().min(1, 'Password is required.').max(255),
  })
  .strict();

module.exports = { loginSchema };
