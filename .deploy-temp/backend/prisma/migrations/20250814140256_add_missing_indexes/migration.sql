-- RenameIndex
ALTER TABLE `Answer` RENAME INDEX `Answer_questionId_createdAt_idx` TO `idx_q_created`;

-- RenameIndex
ALTER TABLE `Comment` RENAME INDEX `Comment_answerId_createdAt_idx` TO `idx_a_created`;

-- RenameIndex
ALTER TABLE `Comment` RENAME INDEX `Comment_questionId_createdAt_idx` TO `idx_q_created`;

-- RenameIndex
ALTER TABLE `Notification` RENAME INDEX `Notification_userId_isRead_createdAt_idx` TO `idx_user_read`;

-- RenameIndex
ALTER TABLE `Question` RENAME INDEX `Question_authorId_createdAt_idx` TO `idx_author`;

-- RenameIndex
ALTER TABLE `Question` RENAME INDEX `Question_categoryId_createdAt_idx` TO `idx_category`;
