-- CreateEnum
CREATE TYPE "public"."EntitlementStatus" AS ENUM ('ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELED');

-- CreateTable
CREATE TABLE "public"."Entitlement" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" "public"."EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "quotaLessons" INTEGER,
    "lessonsUsed" INTEGER NOT NULL DEFAULT 0,
    "renewsAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Entitlement_profileId_idx" ON "public"."Entitlement"("profileId");

-- CreateIndex
CREATE INDEX "Entitlement_stripeSubscriptionId_idx" ON "public"."Entitlement"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_profileId_plan_key" ON "public"."Entitlement"("profileId", "plan");

-- AddForeignKey
ALTER TABLE "public"."Entitlement" ADD CONSTRAINT "Entitlement_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
