const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { env } = require('./env');
const { ApiError } = require('../utils/api-error');
const { HTTP_STATUS } = require('../constants/http-status');

const GALLERY_SUBDIR = 'gallery';
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const galleryUploadDir = path.join(env.uploadPath, GALLERY_SUBDIR);
fs.mkdirSync(galleryUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, galleryUploadDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const galleryImageUpload = multer({
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

/**
 * Mobile's <Image> uses the stored imageUrl directly as a URI (see
 * mobile/src/screens/GalleryScreen.tsx) — it must be an absolute URL, a
 * relative path won't resolve. Uses PUBLIC_API_URL when set (see
 * src/swagger/openapi.js for the same variable), falling back to localhost
 * for local dev.
 */
function toPublicUploadUrl(filename) {
  const base = env.PUBLIC_API_URL || `http://localhost:${env.PORT}`;
  return `${base}/uploads/${GALLERY_SUBDIR}/${filename}`;
}

module.exports = { galleryImageUpload, galleryUploadDir, toPublicUploadUrl, GALLERY_SUBDIR };
