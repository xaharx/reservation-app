-- CreateTable
CREATE TABLE `devices` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `device_id` VARCHAR(255) NOT NULL,
    `os` VARCHAR(30) NOT NULL,
    `firebase_token` VARCHAR(255) NULL,
    `app_version` VARCHAR(30) NULL,
    `os_version` VARCHAR(30) NULL,
    `device_model` VARCHAR(120) NULL,
    `device_manufacturer` VARCHAR(120) NULL,
    `locale` VARCHAR(35) NULL,
    `timezone` VARCHAR(60) NULL,
    `notification_permission_status` VARCHAR(20) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `first_launched_at` DATETIME(3) NOT NULL,
    `last_launched_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `devices_device_id_key`(`device_id`),
    INDEX `idx_devices_os`(`os`),
    INDEX `idx_devices_active_last_launch`(`is_active`, `last_launched_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4;
