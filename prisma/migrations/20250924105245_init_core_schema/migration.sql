-- CreateEnum
CREATE TYPE "public"."ErrorType" AS ENUM ('PHON', 'GRAM', 'LEX');

-- CreateEnum
CREATE TYPE "public"."SrsItemType" AS ENUM ('WORD', 'PATTERN');

-- CreateEnum
CREATE TYPE "public"."AdaptAction" AS ENUM ('ADVANCE', 'REPEAT', 'REMEDIATE');

-- CreateEnum
CREATE TYPE "public"."TaskKind" AS ENUM ('DIALOGUE', 'MODELING', 'ROLEPLAY', 'FORMATIVE', 'SRS', 'EXTENSION');

-- CreateTable
CREATE TABLE "public"."Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "cefrRange" TEXT,
    "goals" TEXT,
    "interests" TEXT,
    "nativeLanguage" TEXT,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LessonTemplate" (
    "id" TEXT NOT NULL,
    "cefr" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "stages" JSONB NOT NULL,
    "rubricRefs" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskTemplate" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "kind" "public"."TaskKind" NOT NULL,
    "inputs" JSONB NOT NULL,
    "kbRefs" TEXT[],
    "minCefr" TEXT NOT NULL,
    "maxCefr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lessonTemplateId" TEXT,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LessonPlan" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LessonRun" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "targetStructures" TEXT[],
    "targetVocab" TEXT[],
    "feedbackJson" JSONB,
    "audioRef" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "LessonRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ErrorLog" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "lessonRunId" TEXT,
    "errorType" "public"."ErrorType" NOT NULL,
    "snippet" TEXT NOT NULL,
    "correction" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SrsQueue" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" "public"."SrsItemType" NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "ease" DOUBLE PRECISION NOT NULL,
    "interval" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SrsQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdaptiveAbility" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "theta" DOUBLE PRECISION NOT NULL,
    "sigma" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdaptiveAbility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdaptiveEvent" (
    "id" TEXT NOT NULL,
    "lessonRunId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "action" "public"."AdaptAction" NOT NULL,
    "decisionJson" JSONB NOT NULL,
    "abilityBefore" JSONB,
    "abilityAfter" JSONB,
    "signals" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdaptiveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskDifficulty" (
    "id" TEXT NOT NULL,
    "taskTemplateId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "beta" DOUBLE PRECISION NOT NULL,
    "discrimination" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskDifficulty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "lessonRunId" TEXT,
    "eventName" TEXT NOT NULL,
    "props" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KbDoc" (
    "id" TEXT NOT NULL,
    "externalRef" TEXT NOT NULL,
    "cefr" TEXT,
    "topic" TEXT,
    "kind" TEXT,
    "content" JSONB NOT NULL,
    "embedding" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KbDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Media" (
    "id" TEXT NOT NULL,
    "lessonRunId" TEXT,
    "profileId" TEXT,
    "kind" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeploymentLog" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "commitHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeploymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "public"."Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_cefrRange_idx" ON "public"."Profile"("cefrRange");

-- CreateIndex
CREATE UNIQUE INDEX "TaskTemplate_templateKey_key" ON "public"."TaskTemplate"("templateKey");

-- CreateIndex
CREATE UNIQUE INDEX "LessonPlan_lessonId_key" ON "public"."LessonPlan"("lessonId");

-- CreateIndex
CREATE INDEX "LessonPlan_userId_createdAt_idx" ON "public"."LessonPlan"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LessonRun_lessonId_key" ON "public"."LessonRun"("lessonId");

-- CreateIndex
CREATE INDEX "LessonRun_profileId_idx" ON "public"."LessonRun"("profileId");

-- CreateIndex
CREATE INDEX "ErrorLog_profileId_occurredAt_idx" ON "public"."ErrorLog"("profileId", "occurredAt");

-- CreateIndex
CREATE INDEX "ErrorLog_lessonRunId_idx" ON "public"."ErrorLog"("lessonRunId");

-- CreateIndex
CREATE INDEX "SrsQueue_profileId_dueAt_idx" ON "public"."SrsQueue"("profileId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "SrsQueue_profileId_itemId_itemType_key" ON "public"."SrsQueue"("profileId", "itemId", "itemType");

-- CreateIndex
CREATE UNIQUE INDEX "AdaptiveAbility_profileId_skillId_key" ON "public"."AdaptiveAbility"("profileId", "skillId");

-- CreateIndex
CREATE INDEX "AdaptiveEvent_lessonRunId_idx" ON "public"."AdaptiveEvent"("lessonRunId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDifficulty_taskTemplateId_skillId_key" ON "public"."TaskDifficulty"("taskTemplateId", "skillId");

-- CreateIndex
CREATE INDEX "Event_profileId_recordedAt_idx" ON "public"."Event"("profileId", "recordedAt");

-- CreateIndex
CREATE INDEX "Event_eventName_idx" ON "public"."Event"("eventName");

-- CreateIndex
CREATE UNIQUE INDEX "KbDoc_externalRef_key" ON "public"."KbDoc"("externalRef");

-- CreateIndex
CREATE INDEX "KbDoc_cefr_idx" ON "public"."KbDoc"("cefr");

-- CreateIndex
CREATE INDEX "KbDoc_topic_idx" ON "public"."KbDoc"("topic");

-- CreateIndex
CREATE INDEX "Media_profileId_createdAt_idx" ON "public"."Media"("profileId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."TaskTemplate" ADD CONSTRAINT "TaskTemplate_lessonTemplateId_fkey" FOREIGN KEY ("lessonTemplateId") REFERENCES "public"."LessonTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LessonRun" ADD CONSTRAINT "LessonRun_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LessonRun" ADD CONSTRAINT "LessonRun_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."LessonPlan"("lessonId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ErrorLog" ADD CONSTRAINT "ErrorLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ErrorLog" ADD CONSTRAINT "ErrorLog_lessonRunId_fkey" FOREIGN KEY ("lessonRunId") REFERENCES "public"."LessonRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SrsQueue" ADD CONSTRAINT "SrsQueue_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdaptiveAbility" ADD CONSTRAINT "AdaptiveAbility_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdaptiveEvent" ADD CONSTRAINT "AdaptiveEvent_lessonRunId_fkey" FOREIGN KEY ("lessonRunId") REFERENCES "public"."LessonRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskDifficulty" ADD CONSTRAINT "TaskDifficulty_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "public"."TaskTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_lessonRunId_fkey" FOREIGN KEY ("lessonRunId") REFERENCES "public"."LessonRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Media" ADD CONSTRAINT "Media_lessonRunId_fkey" FOREIGN KEY ("lessonRunId") REFERENCES "public"."LessonRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Media" ADD CONSTRAINT "Media_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
