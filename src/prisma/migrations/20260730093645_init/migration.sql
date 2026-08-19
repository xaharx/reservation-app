-- AlterTable
ALTER TABLE `about` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `admin_users` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `app_settings` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `banners` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `cms_pages` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `contact` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `gallery` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `reservations` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `social_media` ALTER COLUMN `updated_at` DROP DEFAULT;
