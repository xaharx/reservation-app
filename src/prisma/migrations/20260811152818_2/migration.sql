-- CreateTable
CREATE TABLE `menu_categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(500) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `menu_categories_name_key`(`name`),
    INDEX `idx_menu_categories_display`(`is_published`, `sort_order`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `description` TEXT NULL,
    `price_cents` INTEGER UNSIGNED NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'usd',
    `image_url` VARCHAR(500) NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `idx_menu_items_display`(`category_id`, `is_published`, `sort_order`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `confirmation_code` VARCHAR(32) NOT NULL,
    `guest_name` VARCHAR(120) NOT NULL,
    `guest_email` VARCHAR(191) NOT NULL,
    `guest_phone` VARCHAR(32) NOT NULL,
    `status` ENUM('PENDING_PAYMENT', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `payment_status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `payment_provider` VARCHAR(30) NOT NULL DEFAULT 'stripe',
    `payment_reference` VARCHAR(191) NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'usd',
    `subtotal_cents` INTEGER UNSIGNED NOT NULL,
    `total_cents` INTEGER UNSIGNED NOT NULL,
    `notes` VARCHAR(500) NULL,
    `source` ENUM('MOBILE_APP', 'WEB', 'PHONE', 'WALK_IN', 'ADMIN') NOT NULL DEFAULT 'MOBILE_APP',
    `device_id` VARCHAR(255) NULL,
    `os` VARCHAR(30) NULL,
    `paid_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `cancellation_note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_confirmation_code_key`(`confirmation_code`),
    INDEX `idx_orders_guest_email`(`guest_email`),
    INDEX `idx_orders_status`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `menu_item_id` BIGINT UNSIGNED NOT NULL,
    `item_name` VARCHAR(160) NOT NULL,
    `unit_cents` INTEGER UNSIGNED NOT NULL,
    `quantity` SMALLINT UNSIGNED NOT NULL,
    `line_cents` INTEGER UNSIGNED NOT NULL,
    `notes` VARCHAR(255) NULL,

    INDEX `idx_order_items_order`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `menu_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_menu_item_id_fkey` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
