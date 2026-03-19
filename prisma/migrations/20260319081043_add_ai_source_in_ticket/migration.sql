/*
  Warnings:

  - You are about to drop the `ticketResponse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ticketResponse" DROP CONSTRAINT "ticketResponse_ticketId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "aiSource" TEXT DEFAULT 'rule-based';

-- DropTable
DROP TABLE "ticketResponse";

-- CreateTable
CREATE TABLE "TicketResponse" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketResponse_ticketId_key" ON "TicketResponse"("ticketId");

-- AddForeignKey
ALTER TABLE "TicketResponse" ADD CONSTRAINT "TicketResponse_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
