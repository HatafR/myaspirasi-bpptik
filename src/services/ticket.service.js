import { prisma } from "@/lib/prisma";
import { generateTicketNumber } from "@/lib/ticket-number";
import { sendTicketCreatedEmail } from "@/lib/mailer";
import { analyzeTextAI } from "@/lib/ai-analyze";

export async function createTicket(data) {
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  const ai = await analyzeTextAI(data.message);

  // console.log("ini ai: " + ai.usage);

  const assignedToId = service.requiresManualAssignment
    ? null
    : service.assignedAdminId;

  const status = service.requiresManualAssignment ? "SUBMITTED" : "ASSIGNED";

  const ticketNumber = await generateTicketNumber();

  // ======================
  // CREATE TICKET (CRITICAL)
  // ======================
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      name: data.name,
      subject: data.subject,
      email: data.email,
      message: data.message,
      serviceId: data.serviceId,
      assignedToId,
      status,
      sentiment: ai.sentimen.toUpperCase(),
      category: ai.kategori.toUpperCase(),
      aiSource: ai.source,
    },
    include: {
      service: true,
    },
  });

  // ======================
  // HISTORY (NON-CRITICAL)
  // ======================
  try {
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        status,
      },
    });
  } catch (err) {
    console.error("History failed:", err.message);
  }

  // ======================
  // EMAIL + LOG
  // ======================
  try {
    await sendTicketCreatedEmail(ticket.email, ticket);

    await prisma.notificationLog.create({
      data: {
        ticketId: ticket.id,
        email: ticket.email,
        type: "SUBMITTED",
        subject: "Tiket Anda berhasil dibuat",
        status: "sent",
        sentAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.notificationLog.create({
      data: {
        ticketId: ticket.id,
        email: ticket.email,
        type: "SUBMITTED",
        subject: "Tiket Anda berhasil dibuat",
        status: "failed",
        errorMessage: error.message,
      },
    });
  }

  return ticket;
}
