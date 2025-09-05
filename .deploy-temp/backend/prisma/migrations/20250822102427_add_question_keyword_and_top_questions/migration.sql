-- prisma/migrations/20250822102427_add_question_keyword_and_top_questions/migration.sql
-- 0) Concept 먼저 (TopQuestion/ConceptKeyword가 참조하므로)
CREATE TABLE `Concept` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `createdById` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Concept_slug_key`(`slug`),
  INDEX `Concept_createdById_idx`(`createdById`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Concept`
  ADD CONSTRAINT `Concept_createdById_fkey`
  FOREIGN KEY (`createdById`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 1) ConceptKeyword 먼저 생성 (QuestionKeyword에서 참조하므로)
CREATE TABLE `ConceptKeyword` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `conceptId` INT NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `position` INT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `currentQuestionId` INT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ConceptKeyword_conceptId_position_key`(`conceptId`, `position`),
    UNIQUE INDEX `ConceptKeyword_conceptId_keyword_key`(`conceptId`, `keyword`),
    INDEX `ConceptKeyword_currentQuestionId_idx`(`currentQuestionId`),
    INDEX `ConceptKeyword_conceptId_idx`(`conceptId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2) QuestionKeyword 생성 (ConceptKeyword를 참조)
CREATE TABLE `QuestionKeyword` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `questionId` INTEGER NOT NULL,
    `keywordId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `QuestionKeyword_questionId_key`(`questionId`),
    INDEX `QuestionKeyword_keywordId_idx`(`keywordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3) TopQuestion 생성 (Question/Concept 참조)
CREATE TABLE `TopQuestion` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `conceptId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `rank` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TopQuestion_questionId_key`(`questionId`),
    INDEX `TopQuestion_conceptId_rank_idx`(`conceptId`, `rank`),
    UNIQUE INDEX `TopQuestion_conceptId_rank_key`(`conceptId`, `rank`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4) FK 추가 (모두 대상 테이블 생성 이후에 추가)

-- ConceptKeyword FKs
ALTER TABLE `ConceptKeyword`
  ADD CONSTRAINT `ConceptKeyword_conceptId_fkey`
  FOREIGN KEY (`conceptId`) REFERENCES `Concept`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ConceptKeyword`
  ADD CONSTRAINT `ConceptKeyword_currentQuestionId_fkey`
  FOREIGN KEY (`currentQuestionId`) REFERENCES `Question`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- QuestionKeyword FKs
ALTER TABLE `QuestionKeyword`
  ADD CONSTRAINT `QuestionKeyword_questionId_fkey`
  FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `QuestionKeyword`
  ADD CONSTRAINT `QuestionKeyword_keywordId_fkey`
  FOREIGN KEY (`keywordId`) REFERENCES `ConceptKeyword`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- TopQuestion FKs
ALTER TABLE `TopQuestion`
  ADD CONSTRAINT `TopQuestion_conceptId_fkey`
  FOREIGN KEY (`conceptId`) REFERENCES `Concept`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `TopQuestion`
  ADD CONSTRAINT `TopQuestion_questionId_fkey`
  FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
