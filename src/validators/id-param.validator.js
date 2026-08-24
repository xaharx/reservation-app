const { z } = require('zod');

/**
 * Shared BigInt-id path-param schema, matching the pattern already used for
 * reservations (see reservationIdSchema) — kept here once so every new
 * admin CMS resource doesn't redefine the same regex/range checks.
 */
function bigIntIdParamSchema(paramName = 'id') {
  return z
    .object({
      [paramName]: z
        .string()
        .regex(/^\d+$/, `${paramName} must be a positive integer.`)
        .refine((value) => BigInt(value) > 0n, `${paramName} must be a positive integer.`)
        .refine(
          (value) => BigInt(value) <= 18446744073709551615n,
          `${paramName} exceeds the supported range.`,
        ),
    })
    .strict();
}

module.exports = { bigIntIdParamSchema };
