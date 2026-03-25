/*
  Warnings:

  - Added the required column `subject` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "subject" TEXT NOT NULL;
