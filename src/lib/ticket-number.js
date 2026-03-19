import { prisma } from "@/lib/prisma";

export async function generateTicketNumber() {
  while (true) {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randPart = Math.floor(1000 + Math.random() * 9000);

    const ticketNumber = `TKT-${datePart}-${randPart}`;

    const exists = await prisma.ticket.findUnique({
      where: { ticketNumber },
    });

    if (!exists) return ticketNumber;
  }
}
