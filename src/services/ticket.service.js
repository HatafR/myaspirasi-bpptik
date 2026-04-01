import { prisma } from "@/lib/prisma";
import { generateTicketNumber } from "@/lib/ticket-number";
import { sendTicketCreatedEmail, sendErrorEmail } from "@/lib/mailer";
import { analyzeTextAI } from "@/lib/ai-analyze";
import { notificationHandlers } from "@/lib/notifications";

export async function createTicket(data) {
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  const ai = await analyzeTextAI(data.message);

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
    const logs = [];

    // submitted
    logs.push({
      ticketId: ticket.id,
      type: "STATUS_CHANGED",
      fromValue: null,
      toValue: "SUBMITTED",
      actorId: "system",
    });

    // auto assign
    if (!service.requiresManualAssignment) {
      logs.push({
        ticketId: ticket.id,
        type: "STATUS_CHANGED",
        fromValue: "SUBMITTED",
        toValue: "ASSIGNED",
        actorId: "system",
      });

      logs.push({
        ticketId: ticket.id,
        type: "ASSIGNED",
        fromValue: null,
        toValue: assignedToId,
        actorId: "system",
      });
    }

    await prisma.ticketAuditLog.createMany({
      data: logs,
    });
  } catch (err) {
    console.error("History failed:", err.message);
  }

  // ======================
  // EMAIL + LOG
  // ======================
  let notificationSent = false;

  // Kirim email ke pengirim
  try {
    await sendTicketCreatedEmail(ticket.email, ticket);
  } catch (error) {
    console.error("Failed to send ticket created email:", error.message);
    // Jika gagal kirim ke pengirim, log failed tapi tidak kirim error email
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
    return ticket; // Early return jika gagal kirim ke pengirim
  }

  // Kirim notifikasi ke admin
  try {
    if (service.requiresManualAssignment) {
      // kirim ke admin general
      await notificationHandlers.CREATED(ticket);
      console.log("admin general");
    } else {
      // auto assign → kirim ke PIC + CC general
      const pic = await prisma.user.findUnique({
        where: { id: assignedToId },
      });

      if (pic?.email) {
        await notificationHandlers.AUTO_ASSIGNED(ticket, pic.email);
        console.log("PIC");
      } else {
        throw new Error("PIC email not found");
      }
    }

    notificationSent = true;
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
    console.error("Failed to send admin notification:", error.message);
    // Kirim email error ke pengirim
    try {
      await sendErrorEmail(ticket.email, ticket, error.message);
    } catch (emailError) {
      console.error("Failed to send error email:", emailError.message);
    }

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
