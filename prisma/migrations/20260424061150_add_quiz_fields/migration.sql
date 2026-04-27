-- AlterTable
ALTER TABLE "LiveParticipant" ADD COLUMN "quizAnswersJson" TEXT;
ALTER TABLE "LiveParticipant" ADD COLUMN "quizQuestionsJson" TEXT;
ALTER TABLE "LiveParticipant" ADD COLUMN "quizScore" REAL;
ALTER TABLE "LiveParticipant" ADD COLUMN "roleplayScore" REAL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "uploadedFileData" TEXT;
ALTER TABLE "Project" ADD COLUMN "uploadedFileName" TEXT;
ALTER TABLE "Project" ADD COLUMN "uploadedFileText" TEXT;
