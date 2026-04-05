/*
  Warnings:

  - You are about to drop the `AdminReply` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TicketResponse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TicketStatusHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditLogType" ADD VALUE 'TICKET_CREATED';
ALTER TYPE "AuditLogType" ADD VALUE 'GENERAL_ACTION';

-- DropForeignKey
ALTER TABLE "AdminReply" DROP CONSTRAINT "AdminReply_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "AdminReply" DROP CONSTRAINT "AdminReply_userId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "TicketResponse" DROP CONSTRAINT "TicketResponse_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "TicketStatusHistory" DROP CONSTRAINT "TicketStatusHistory_changedById_fkey";

-- DropForeignKey
ALTER TABLE "TicketStatusHistory" DROP CONSTRAINT "TicketStatusHistory_ticketId_fkey";

-- DropTable
DROP TABLE "AdminReply";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "TicketResponse";

-- DropTable
DROP TABLE "TicketStatusHistory";
