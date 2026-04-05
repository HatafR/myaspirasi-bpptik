import { prisma } from "@/lib/prisma";
import { validateStatusTransition } from "@/lib/ticket-status";
import { requireAuthFromCookie, requireRole } from "@/lib/auth";
import { AppError } from "@/lib/error";
import { sendTicketResolvedEmail } from "@/lib/mailer";

const STATUS = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RETURNED", "RESOLVED", "CLOSED"];

const statusHandlers = {
  RESOLVED: sendTicketResolvedEmail,
};

// ==========================
// GET /api/tickets/:id
// ==========================
export async function GET(req, { params }) {
  try {
    const user = await requireAuthFromCookie(req);
    const { id } = params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        service: true,
        assignedTo: true,
        response: true,
        rating: true,
        replies: {
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
        ticketAuditLogs: {
          orderBy: { createdAt: "desc" },
          include: { actor: true },
        },
      },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // 🔐 Access control
    if (user.role === "SERVICE_ADMIN" && ticket.assignedToId !== user.userId) {
      throw new Error("Forbidden");
    }

    return Response.json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: err.message,
      },
      {
        status:
          err.message === "Ticket not found"
            ? 404
            : err.message === "Forbidden"
              ? 403
              : 500,
      },
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await requireAuthFromCookie(req);
    if (!user) throw AppError("Required Login", "AUTH_INVALID", 401);

    const { id } = await params;
    const body = await req.json();

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        service: true,
      },
    });

    if (!ticket)
      throw new AppError("Ticket not found", "TICKET_NOT_FOUND", 404);

    // ======================
    // ASSIGN / REASSIGN
    // ======================
    if (body.assignedToId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: body.assignedToId },
      });

      if (!targetUser) {
        throw new AppError("Assigned user not found", "USER_NOT_FOUND", 404);
      }

      const isAutoAssign =
        !ticket.assignedToId && user.role !== "ADMIN_GENERAL";

      const isReassign = ticket.assignedToId !== null;

      const [updated] = await prisma.$transaction([
        prisma.ticket.update({
          where: { id },
          data: {
            assignedToId: body.assignedToId,
            status: "ASSIGNED",
          },
        }),

        prisma.ticketAuditLog.createMany({
          data: [
            // status change (kalau sebelumnya bukan ASSIGNED)
            ...(ticket.status !== "ASSIGNED"
              ? [
                  {
                    ticketId: ticket.id,
                    type: "STATUS_CHANGED",
                    fromValue: ticket.status,
                    toValue: "ASSIGNED",
                    actorId: user.userId,
                  },
                ]
              : []),

            // assignment event
            {
              ticketId: ticket.id,
              type: isReassign ? "REASSIGNED" : "ASSIGNED",
              fromValue: ticket.assignedToId,
              toValue: body.assignedToId,
              actorId: user.userId,
            },
          ],
        }),
      ]);

      if (isAutoAssign) {
        notificationHandlers.AUTO_ASSIGNED(updated, targetUser.email).catch((err) => {
          console.error("EMAIL_FAILED", err);
        });
      } else {
        notificationHandlers.ASSIGNED_BY_ADMIN(updated, targetUser.email).catch((err) => {
          console.error("EMAIL_FAILED", err);
        });
      }

      return Response.json({
        success: true,
        data: updated,
      });
    }

    // ======================
    // UPDATE STATUS
    // ======================
    if (!body.status) {
      throw new AppError("No update payload", "PAYLOAD_NOT_FOUND", 404);
    }

    if (!STATUS.includes(body.status)) {
      throw new AppError("Invalid status value", "VALIDATION_ERROR", 400);
    }

    if (!validateStatusTransition(ticket.status, body.status)) {
      throw new AppError("Invalid status transition", "VALIDATION_ERROR", 400);
    }

    const [updated] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id },
        data: {
          status: body.status,
          closedAt:
            body.status === "CLOSED"
              ? ticket.closedAt || new Date()
              : ticket.closedAt,
        },
        include: {
          service: true,
        },
      }),

      prisma.ticketAuditLog.create({
        data: {
          ticketId: ticket.id,
          type: "STATUS_CHANGED",
          fromValue: ticket.status,
          toValue: body.status,
          actorId: user.userId,
        },
      }),
    ]);

    // console.log(updated);

    const handler = statusHandlers[body.status];

    if (handler && ticket.status !== body.status) {
      handler(updated.email, updated)
        .then(() => {
          console.log("TICKET SENT");
        })
        .catch((err) => {
          console.error("EMAIL_FAILED", {
            ticketId: updated.id,
            error: err.message,
          });
        });
    }

    return Response.json({
      success: true,
      data: updated,
    });
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json(
        {
          success: false,
          message: e.message,
          code: e.code,
        },
        { status: e.status },
      );
    }

    // unknown error (JANGAN expose)
    return Response.json(
      {
        success: false,
        message: "Internal server error",
        code: "SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
