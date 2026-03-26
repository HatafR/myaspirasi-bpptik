import { prisma } from "@/lib/prisma";
import { validateStatusTransition } from "@/lib/ticket-status";
import { requireAuth, requireRole } from "@/lib/auth";

// ==========================
// GET /api/tickets/:id
// ==========================
export async function GET(req, { params }) {
  try {
    const user = requireAuth(req);
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
        statusHistories: {
          orderBy: { createdAt: "desc" },
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
    const user = requireAuth(req);

    const { id } = await params;
    const body = await req.json();

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) throw new Error("Ticket not found");

    // ======================
    // ASSIGN ADMIN
    // ======================
    if (body.assignedToId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: body.assignedToId },
      });

      if (!targetUser) {
        throw new Error("Assigned user not found");
      }

      const updated = await prisma.ticket.update({
        where: { id },
        data: {
          assignedToId: body.assignedToId,
          status: "ASSIGNED",
        },
      });

      // log history (non-critical)
      await prisma.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          status: "ASSIGNED",
          changedById: user.userId,
        },
      });

      return Response.json({
        success: true,
        data: updated,
      });
    }

    // ======================
    // UPDATE STATUS
    // ======================
    if (!body.status) {
      throw new Error("No update payload");
    }

    if (!validateStatusTransition(ticket.status, body.status)) {
      throw new Error("Invalid status transition");
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        status: body.status,
        closedAt:
          body.status === "CLOSED"
            ? ticket.closedAt || new Date()
            : ticket.closedAt,
      },
    });

    // history = secondary
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        status: body.status,
        changedById: user.userId,
      },
    });

    return Response.json({
      success: true,
      data: updated,
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
              : 400,
      },
    );
  }
}
