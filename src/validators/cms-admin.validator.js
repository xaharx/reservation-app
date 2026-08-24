const { z } = require('zod');

const ISO_DATETIME = z.string().datetime({ offset: true }).or(z.string().datetime());

// Multipart form fields (gallery upload) always arrive as strings, even for
// booleans — same trap as SMTP_SECURE in config/env.js. This mirrors that
// fix instead of trusting z.coerce.boolean(), which treats the literal
// string "false" as truthy.
const stringBoolean = z.enum(['true', 'false']).transform((value) => value === 'true');

// NOTE ON *UpdateSchema BELOW: deliberately NOT built via baseSchema.partial().
// Zod's .partial() only makes keys optional in the input — any field that
// still has a .default() keeps applying it when the key is absent, which
// would silently reset that field on every partial update (e.g. a PATCH
// that only sends { title } would also reset sortOrder back to 0). Update
// schemas below repeat the field shapes without any .default() instead, so
// an absent field truly means "leave unchanged."

const bannerSchema = z
  .object({
    title: z.string().trim().min(1).max(180),
    subtitle: z.string().trim().max(300).optional(),
    imageUrl: z.string().trim().min(1).max(500),
    actionLabel: z.string().trim().max(80).optional(),
    actionUrl: z.string().trim().max(500).optional(),
    placement: z.enum(['HOME_HERO', 'HOME_PROMOTION', 'RESERVATION', 'APP_MODAL']),
    startsAt: ISO_DATETIME.optional(),
    endsAt: ISO_DATETIME.optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
    isPublished: z.coerce.boolean().default(false),
  })
  .strict();

const bannerUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(180).optional(),
    subtitle: z.string().trim().max(300).optional(),
    imageUrl: z.string().trim().min(1).max(500).optional(),
    actionLabel: z.string().trim().max(80).optional(),
    actionUrl: z.string().trim().max(500).optional(),
    placement: z.enum(['HOME_HERO', 'HOME_PROMOTION', 'RESERVATION', 'APP_MODAL']).optional(),
    startsAt: ISO_DATETIME.optional(),
    endsAt: ISO_DATETIME.optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    isPublished: z.coerce.boolean().optional(),
  })
  .strict();

const aboutSchema = z
  .object({
    sectionKey: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(180),
    content: z.string().trim().min(1).max(20000),
    imageUrl: z.string().trim().max(500).optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
    isPublished: z.coerce.boolean().default(true),
  })
  .strict();

const aboutUpdateSchema = z
  .object({
    sectionKey: z.string().trim().min(1).max(100).optional(),
    title: z.string().trim().min(1).max(180).optional(),
    content: z.string().trim().min(1).max(20000).optional(),
    imageUrl: z.string().trim().max(500).optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    isPublished: z.coerce.boolean().optional(),
  })
  .strict();

const contactSchema = z
  .object({
    label: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(32).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    addressLine1: z.string().trim().max(255).optional(),
    addressLine2: z.string().trim().max(255).optional(),
    city: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().max(24).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    openingHours: z.record(z.string(), z.unknown()).optional(),
    isPrimary: z.coerce.boolean().default(false),
  })
  .strict();

const contactUpdateSchema = z
  .object({
    label: z.string().trim().min(1).max(100).optional(),
    phone: z.string().trim().max(32).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    addressLine1: z.string().trim().max(255).optional(),
    addressLine2: z.string().trim().max(255).optional(),
    city: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().max(24).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    openingHours: z.record(z.string(), z.unknown()).optional(),
    isPrimary: z.coerce.boolean().optional(),
  })
  .strict();

const socialMediaSchema = z
  .object({
    platform: z.string().trim().min(1).max(50),
    profileUrl: z.string().trim().min(1).max(500),
    iconUrl: z.string().trim().max(500).optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
    isPublished: z.coerce.boolean().default(true),
  })
  .strict();

const socialMediaUpdateSchema = z
  .object({
    platform: z.string().trim().min(1).max(50).optional(),
    profileUrl: z.string().trim().min(1).max(500).optional(),
    iconUrl: z.string().trim().max(500).optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    isPublished: z.coerce.boolean().optional(),
  })
  .strict();

const settingSchema = z
  .object({
    // AppSetting.value is a Prisma Json column — any JSON-serializable
    // value is valid (string, number, boolean, object, array).
    value: z.unknown(),
    description: z.string().trim().max(500).optional(),
    isPublic: z.coerce.boolean().default(false),
  })
  .strict();

const settingKeyParamSchema = z
  .object({
    key: z.string().trim().min(1).max(191),
  })
  .strict();

// Gallery metadata arrives as multipart text fields alongside the uploaded
// file (see admin-cms.routes.js), hence stringBoolean/coerced numbers here.
const galleryCreateSchema = z
  .object({
    title: z.string().trim().max(180).optional(),
    altText: z.string().trim().max(255).optional(),
    category: z.string().trim().max(80).optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
    // .default() bypasses parsing entirely when the key is absent, so the
    // default value must already be the schema's OUTPUT type (boolean),
    // not the raw enum string stringBoolean parses from.
    isPublished: stringBoolean.default(true),
  })
  .strict();

const galleryUpdateSchema = z
  .object({
    title: z.string().trim().max(180).optional(),
    altText: z.string().trim().max(255).optional(),
    category: z.string().trim().max(80).optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    isPublished: stringBoolean.optional(),
  })
  .strict();

module.exports = {
  bannerSchema,
  bannerUpdateSchema,
  aboutSchema,
  aboutUpdateSchema,
  contactSchema,
  contactUpdateSchema,
  socialMediaSchema,
  socialMediaUpdateSchema,
  settingSchema,
  settingKeyParamSchema,
  galleryCreateSchema,
  galleryUpdateSchema,
};
