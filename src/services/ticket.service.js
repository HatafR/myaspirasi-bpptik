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
      // Default placeholder until AI processes it
      sentiment: "NETRAL",
      category: "KOMENTAR",
      aiSource: "PENDING",
      ...(data.attachment && {
        attachments: {
          create: [
            {
              url: data.attachment.url,
              key: data.attachment.key,
              filename: data.attachment.filename,
              mimeType: data.attachment.mimeType,
              size: data.attachment.size,
            },
          ],
        },
      }),
    },
    include: {
      service: true,
      attachments: true,
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
  // ASYNC TASKS: AI + EMAIL
  // ======================
  const processAsyncTasks = async () => {
    // 1. Jalankan AI Asynchronous
    try {
      const ai = await analyzeTextAI(data.message);
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          sentiment: ai.sentimen.toUpperCase(),
          category: ai.kategori.toUpperCase(),
          aiSource: ai.source,
        },
      });
      // Update object tiketnya agar punya info dari AI yang baru diproses
      ticket.sentiment = ai.sentimen.toUpperCase();
      ticket.category = ai.kategori.toUpperCase();
    } catch (aiErr) {
      console.error("Async AI analysis failed:", aiErr.message);
    }

    // 2. Transaksi Email
    // Kirim email ke pengirim
    try {
      await sendTicketCreatedEmail(ticket.email, ticket);
    } catch (error) {
      console.error("Failed to send ticket created email:", error.message);
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
      // Email ke pengirim gagal, tidak lanjut ke admin agar flow lebih aman sesuai kondisi async
    }

    // Kirim notifikasi ke admin
    try {
      if (service.requiresManualAssignment) {
        await notificationHandlers.CREATED(ticket);
        console.log("admin general");
      } else {
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
  };

  // Jalankan asinkronus ("fire-and-forget")
  processAsyncTasks().catch((err) => {
    console.error("Unhandled processAsyncTasks error:", err);
  });

  return ticket;
}
