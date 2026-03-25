/*
  Warnings:

  - The values [submitted,returned,resolved] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [kritik,saran,komentar] on the enum `TicketCategory` will be removed. If these variants are still used in the database, this will fail.
  - The values [submitted,assigned,in_progress,resolved,returned,closed] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [general_admin,service_admin,super_admin] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - The `sentiment` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIF', 'NETRAL', 'NEGATIF');

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('SUBMITTED', 'RETURNED', 'RESOLVED');
ALTER TABLE "NotificationLog" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TicketCategory_new" AS ENUM ('KRITIK', 'SARAN', 'KOMENTAR');
ALTER TABLE "Ticket" ALTER COLUMN "category" TYPE "TicketCategory_new" USING ("category"::text::"TicketCategory_new");
ALTER TYPE "TicketCategory" RENAME TO "TicketCategory_old";
ALTER TYPE "TicketCategory_new" RENAME TO "TicketCategory";
DROP TYPE "public"."TicketCategory_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'RETURNED', 'CLOSED');
ALTER TABLE "public"."Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TABLE "TicketStatusHistory" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "public"."TicketStatus_old";
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('GENERAL_ADMIN', 'SERVICE_ADMIN', 'SUPER_ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED',
DROP COLUMN "sentiment",
ADD COLUMN     "sentiment" "Sentiment";

-- CreateTable
CREATE TABLE "AdminReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminReply_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdminReply" ADD CONSTRAINT "AdminReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminReply" ADD CONSTRAINT "AdminReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
