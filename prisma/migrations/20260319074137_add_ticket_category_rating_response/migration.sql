/*
  Warnings:

  - You are about to drop the column `priority` on the `Ticket` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('kritik', 'saran', 'komentar');

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "priority",
ADD COLUMN     "category" "TicketCategory";

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticketResponse" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticketResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rating_ticketId_key" ON "Rating"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "ticketResponse_ticketId_key" ON "ticketResponse"("ticketId");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticketResponse" ADD CONSTRAINT "ticketResponse_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
