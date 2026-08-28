-- AlterTable
ALTER TABLE `devices` MODIFY `first_launched_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `last_launched_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `delivery_address_line_1` VARCHAR(255) NULL,
    ADD COLUMN `delivery_address_line_2` VARCHAR(255) NULL,
    ADD COLUMN `delivery_city` VARCHAR(100) NULL,
    ADD COLUMN `delivery_country` VARCHAR(100) NULL,
    ADD COLUMN `delivery_postal_code` VARCHAR(24) NULL,
    ADD COLUMN `delivery_state` VARCHAR(100) NULL;
