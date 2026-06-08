-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'DECLINED');

-- AlterTable
ALTER TABLE "project_members" ADD COLUMN     "invitedBy" TEXT,
ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
