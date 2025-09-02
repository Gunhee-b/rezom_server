-- AlterTable
ALTER TABLE `User` ADD COLUMN `refreshTokenHash` VARCHAR(191) NULL,
    ADD COLUMN `tokenVersion` INTEGER NOT NULL DEFAULT 0;
