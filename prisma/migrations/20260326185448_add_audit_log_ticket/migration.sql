-- CreateEnum
CREATE TYPE "AuditLogType" AS ENUM ('STATUS_CHANGED', 'ASSIGNED', 'REASSIGNED', 'RATING_GIVEN');

-- CreateTable
CREATE TABLE "TicketAuditLog" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "type" "AuditLogType" NOT NULL,
    "actorId" TEXT,
    "fromValue" TEXT,
    "toValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketAuditLog_ticketId_idx" ON "TicketAuditLog"("ticketId");

-- CreateIndex
CREATE INDEX "TicketAuditLog_type_idx" ON "TicketAuditLog"("type");

-- CreateIndex
CREATE INDEX "TicketAuditLog_actorId_idx" ON "TicketAuditLog"("actorId");

-- AddForeignKey
ALTER TABLE "TicketAuditLog" ADD CONSTRAINT "TicketAuditLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAuditLog" ADD CONSTRAINT "TicketAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
