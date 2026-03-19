ALTER TABLE "public"."projects" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "projects_isArchived_idx" ON "public"."projects"("isArchived");
