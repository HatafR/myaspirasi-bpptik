import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "crypto";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function main() {
  console.log("Starting UUID and Tracking Token migration...");

  const tickets = await prisma.ticket.findMany({
    include: {
      attachments: true,
      ticketAuditLogs: true,
    }
  });

  console.log(`Found ${tickets.length} tickets to process.`);

  let migratedCount = 0;

  for (const ticket of tickets) {
    const needsNewTicketNumber = !UUID_REGEX.test(ticket.ticketNumber);
    // If trackingToken is missing, or is not a valid UUID, generate one
    const needsNewTrackingToken = !ticket.trackingToken || !UUID_REGEX.test(ticket.trackingToken);

    if (needsNewTicketNumber || needsNewTrackingToken) {
      const newTicketNumber = needsNewTicketNumber ? randomUUID() : ticket.ticketNumber;
      const newTrackingToken = needsNewTrackingToken ? randomUUID() : ticket.trackingToken;

      console.log(`Migrating ticket ID ${ticket.id}:`);
      if (needsNewTicketNumber) {
        console.log(`  - ticketNumber: ${ticket.ticketNumber} -> ${newTicketNumber}`);
      }
      if (needsNewTrackingToken) {
        console.log(`  - trackingToken: ${ticket.trackingToken || "none"} -> ${newTrackingToken}`);
      }

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          ticketNumber: newTicketNumber,
          trackingToken: newTrackingToken,
        },
      });

      // Write an audit log entry for the security migration
      await prisma.ticketAuditLog.create({
        data: {
          ticketId: ticket.id,
          type: "GENERAL_ACTION",
          fromValue: ticket.ticketNumber,
          toValue: newTicketNumber,
          actorId: null,
          metadata: {
            action: "SECURITY_MIGRATION",
            previousTicketNumber: ticket.ticketNumber,
            newTicketNumber: newTicketNumber,
            reason: "VAPT IDOR remediation & UUID conversion"
          }
        }
      });

      migratedCount++;
    }
  }

  console.log(`Migration finished. Successfully updated ${migratedCount} tickets.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Migration failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
