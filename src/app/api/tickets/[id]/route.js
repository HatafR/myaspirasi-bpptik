import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/verify-token";
import { validateStatusTransition } from "@/lib/ticket-status";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const user = requireAuth(req);

    if (user.role === "service_admin" && ticket.assignedToId !== user.userId) {
      throw new Error("Forbidden");
    }

    const { id } = params;

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: id,
      },
      include: {
        service: true,
        assignedTo: true,
        statusHistories: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
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
        status: 400,
      },
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = requireAuth(req);
    requireRole(user, ["service_admin", "super_admin"]);

    const { id } = params;
    const body = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: {
          id: id,
        },
      });

      if (!ticket) {
        throw new Error("Ticket not found");
      }

      // ASSIGN ADMIN
      if (body.assignedToId) {
        const targetUser = await tx.user.findUnique({
          where: {
            id: body.assignedToId,
          },
        });

        if (!targetUser) {
          throw new Error("Assigned user not found");
        }

        const updatedTicket = await tx.ticket.update({
          where: {
            ticketNumber: id,
          },
          data: {
            assignedToId: body.assignedToId,
            status: "assigned",
          },
        });

        await tx.ticketStatusHistory.create({
          data: {
            ticketId: ticket.id,
            status: "assigned",
            changedById: user.userId,
          },
        });

        return updatedTicket;
      }

      // UPDATE STATUS

      if (!body.status && !body.assignedToId) {
        throw new Error("No update payload");
      }
      if (!validateStatusTransition(ticket.status, body.status)) {
        throw new Error("Invalid status transition");
      }

      const updatedTicket = await tx.ticket.update({
        where: {
          id: id,
        },
        data: {
          status: body.status,
          closedAt:
            body.status === "closed"
              ? ticket.closedAt || new Date()
              : ticket.closedAt,
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          status: body.status,
          changedById: user.userId,
        },
      });

      return updatedTicket;
    });

    return Response.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: err.message,
      },
      {
        status: err.message === "Ticket not found" ? 404 : 400,
      },
    );
  }
}
