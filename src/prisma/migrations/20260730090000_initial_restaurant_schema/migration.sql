-- ORA DE NUIT initial schema: MySQL 8.0+, InnoDB, utf8mb4.
-- Prisma migration generated as reviewed SQL so it can be inspected and run by Prisma Migrate.

CREATE TABLE `admin_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(80) NOT NULL,
  `last_name` VARCHAR(80) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('SUPER_ADMIN','ADMIN','MANAGER','EDITOR') NOT NULL DEFAULT 'EDITOR',
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `last_login_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  UNIQUE INDEX `admin_users_email_key` (`email`),
  INDEX `idx_admin_users_access` (`role`, `is_active`, `deleted_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

CREATE TABLE `reservations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `confirmation_code` VARCHAR(32) NOT NULL,
  `guest_name` VARCHAR(120) NOT NULL,
  `guest_email` VARCHAR(191) NOT NULL,
  `guest_phone` VARCHAR(32) NOT NULL,
  `reservation_date` DATE NOT NULL,
  `reservation_time` TIME NOT NULL,
  `party_size` TINYINT UNSIGNED NOT NULL,
  `status` ENUM('PENDING','CONFIRMED','SEATED','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'PENDING',
  `source` ENUM('MOBILE_APP','WEB','PHONE','WALK_IN','ADMIN') NOT NULL DEFAULT 'MOBILE_APP',
  `special_requests` TEXT NULL,
  `occasion` VARCHAR(80) NULL,
  `cancelled_at` DATETIME(3) NULL,
  `cancellation_note` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `reservations_confirmation_code_key` (`confirmation_code`),
  INDEX `idx_reservations_schedule_status` (`reservation_date`, `reservation_time`, `status`),
  INDEX `idx_reservations_guest_email` (`guest_email`),
  INDEX `idx_reservations_guest_phone` (`guest_phone`),
  CHECK (`party_size` > 0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

CREATE TABLE `gallery` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(180) NULL,
  `alt_text` VARCHAR(255) NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `category` VARCHAR(80) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_published` BOOLEAN NOT NULL DEFAULT true,
  `created_by_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  INDEX `idx_gallery_display` (`is_published`, `sort_order`, `deleted_at`),
  INDEX `idx_gallery_category` (`category`),
  PRIMARY KEY (`id`),
  CONSTRAINT `gallery_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

CREATE TABLE `banners` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(180) NOT NULL,
  `subtitle` VARCHAR(300) NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `action_label` VARCHAR(80) NULL,
  `action_url` VARCHAR(500) NULL,
  `placement` ENUM('HOME_HERO','HOME_PROMOTION','RESERVATION','APP_MODAL') NOT NULL,
  `starts_at` DATETIME(3) NULL,
  `ends_at` DATETIME(3) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_published` BOOLEAN NOT NULL DEFAULT false,
  `created_by_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  INDEX `idx_banners_active` (`placement`, `is_published`, `starts_at`, `ends_at`, `deleted_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `banners_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CHECK (`ends_at` IS NULL OR `starts_at` IS NULL OR `ends_at` > `starts_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

CREATE TABLE `about` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `section_key` VARCHAR(100) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `image_url` VARCHAR(500) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_published` BOOLEAN NOT NULL DEFAULT true,
  `created_by_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  UNIQUE INDEX `about_section_key_key` (`section_key`),
  INDEX `idx_about_display` (`is_published`, `sort_order`, `deleted_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `about_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

CREATE TABLE `contact` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(32) NULL,
  `email` VARCHAR(191) NULL,
  `address_line_1` VARCHAR(255) NULL,
  `address_line_2` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `country` VARCHAR(100) NULL,
  `postal_code` VARCHAR(24) NULL,
  `latitude` DECIMAL(10,7) NULL,
  `longitude` DECIMAL(10,7) NULL,
  `opening_hours` JSON NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT false,
  `created_by_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  INDEX `idx_contact_primary` (`is_primary`, `deleted_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `contact_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

CREATE TABLE `social_media` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `platform` VARCHAR(50) NOT NULL,
  `profile_url` VARCHAR(500) NOT NULL,
  `icon_url` VARCHAR(500) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_published` BOOLEAN NOT NULL DEFAULT true,
  `created_by_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  UNIQUE INDEX `social_media_platform_key` (`platform`),
  INDEX `idx_social_media_display` (`is_published`, `sort_order`, `deleted_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `social_media_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

CREATE TABLE `cms_pages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(191) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `meta_title` VARCHAR(255) NULL,
  `meta_description` VARCHAR(500) NULL,
  `is_published` BOOLEAN NOT NULL DEFAULT false,
  `published_at` DATETIME(3) NULL,
  `created_by_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  UNIQUE INDEX `cms_pages_slug_key` (`slug`),
  INDEX `idx_cms_pages_public` (`is_published`, `published_at`, `deleted_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `cms_pages_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

CREATE TABLE `app_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(191) NOT NULL,
  `value` JSON NOT NULL,
  `description` VARCHAR(500) NULL,
  `is_public` BOOLEAN NOT NULL DEFAULT false,
  `updated_by_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `app_settings_setting_key_key` (`setting_key`),
  INDEX `idx_app_settings_public` (`is_public`),
  PRIMARY KEY (`id`),
  CONSTRAINT `app_settings_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(100) NOT NULL,
  `entity_id` VARCHAR(64) NULL,
  `old_values` JSON NULL,
  `new_values` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(512) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_audit_logs_entity` (`entity_type`, `entity_id`, `created_at`),
  INDEX `idx_audit_logs_actor` (`admin_user_id`, `created_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `audit_logs_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;
