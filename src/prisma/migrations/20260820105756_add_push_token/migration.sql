-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `push_token` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `push_token` VARCHAR(255) NULL;
