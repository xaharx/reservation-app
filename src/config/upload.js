const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { env } = require('./env');
const { ApiError } = require('../utils/api-error');
const { HTTP_STATUS } = require('../constants/http-status');

const GALLERY_SUBDIR = 'gallery';
const MENU_SUBDIR = 'menu';
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function createUploadDir(subdir) {
  const dir = path.join(env.uploadPath, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Shared factory behind galleryImageUpload/menuItemImageUpload — same disk storage, filename, size limit, and mimetype allowlist, just a different destination folder. */
function createImageUpload(uploadDir) {
  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDir),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
      callback(null, `${crypto.randomUUID()}${extension}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: env.MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return callback(
          new ApiError(HTTP_STATUS.BAD_REQUEST, 'Only JPEG, PNG, WEBP, or GIF images are allowed.'),
        );
      }
      return callback(null, true);
    },
  }).single('image');
}

const galleryUploadDir = createUploadDir(GALLERY_SUBDIR);
const galleryImageUpload = createImageUpload(galleryUploadDir);

// Menu item photos are optional on both create and update (see
// admin-menu.routes.js) — the field name is still "image" so the same
// multer instance shape works, just pointed at its own subfolder.
const menuUploadDir = createUploadDir(MENU_SUBDIR);
const menuItemImageUpload = createImageUpload(menuUploadDir);

/**
 * Mobile's <Image> uses the stored imageUrl directly as a URI (see
 * mobile/src/screens/GalleryScreen.tsx) — it must be an absolute URL, a
 * relative path won't resolve. Uses PUBLIC_API_URL when set (see
 * src/swagger/openapi.js for the same variable), falling back to localhost
 * for local dev. `subdir` defaults to gallery for existing call sites.
 */
function toPublicUploadUrl(filename, subdir = GALLERY_SUBDIR) {
  const base = env.PUBLIC_API_URL || `http://localhost:${env.PORT}`;
  return `${base}/uploads/${subdir}/${filename}`;
}

module.exports = {
  galleryImageUpload,
  galleryUploadDir,
  menuItemImageUpload,
  menuUploadDir,
  toPublicUploadUrl,
  GALLERY_SUBDIR,
  MENU_SUBDIR,
};
