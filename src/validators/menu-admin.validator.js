const { z } = require('zod');

// Multipart form fields (menu item create/update, since the photo is
// optional on both) always arrive as strings, even for booleans — same trap
// as SMTP_SECURE in config/env.js and the gallery upload validators. See
// cms-admin.validator.js for the full explanation.
const stringBoolean = z.enum(['true', 'false']).transform((value) => value === 'true');

// NOTE ON *UpdateSchema BELOW: deliberately NOT built via baseSchema.partial().
// Zod's .partial() only makes keys optional in the input — any field that
// still has a .default() keeps applying it when the key is absent, which
// would silently reset that field on every partial update. Update schemas
// below repeat the field shapes without any .default() instead, so an
// absent field truly means "leave unchanged."

const menuCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
    isPublished: z.coerce.boolean().default(true),
  })
  .strict();

const menuCategoryUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    isPublished: z.coerce.boolean().optional(),
  })
  .strict();

// Menu item create/update are both multipart (an optional "image" file
// alongside these fields — see admin-menu.routes.js), hence
// stringBoolean/coerced numbers/string categoryId throughout.
const menuItemSchema = z
  .object({
    categoryId: z.string().regex(/^\d+$/, 'categoryId must be a positive integer.'),
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().max(5000).optional(),
    priceCents: z.coerce.number().int().min(0),
    currency: z.string().trim().toLowerCase().length(3).default('usd'),
    isAvailable: stringBoolean.default(true),
    sortOrder: z.coerce.number().int().min(0).default(0),
    // .default() bypasses parsing entirely when the key is absent, so the
    // default value must already be the schema's OUTPUT type (boolean),
    // not the raw enum string stringBoolean parses from.
    isPublished: stringBoolean.default(true),
  })
  .strict();

const menuItemUpdateSchema = z
  .object({
    categoryId: z.string().regex(/^\d+$/, 'categoryId must be a positive integer.').optional(),
    name: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(5000).optional(),
    priceCents: z.coerce.number().int().min(0).optional(),
    currency: z.string().trim().toLowerCase().length(3).optional(),
    isAvailable: stringBoolean.optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    isPublished: stringBoolean.optional(),
  })
  .strict();

module.exports = {
  menuCategorySchema,
  menuCategoryUpdateSchema,
  menuItemSchema,
  menuItemUpdateSchema,
};
