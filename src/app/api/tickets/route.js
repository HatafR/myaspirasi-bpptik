import { createTicket } from "@/services/ticket.service";
import { ticketSchema } from "@/validations/ticket.validation";
import { verifyToken } from "@/lib/verify-token";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = ticketSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        },
        {
          status: 500,
        },
      );
    }

    const ticket = await createTicket(parsed.data);

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
        status: 500,
      },
    );
  }
}

export async function GET(req) {
  try {
    const user = requireAuth(req);

    let where = {};

    if (user.role === "service_admin") {
      where = {
        assignedToId: user.userId,
      };
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        service: true,
        assignedTo: true,
        response: true,
        statusHistories: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      success: true,
      data: tickets,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: err.message,
      },
      {
        status: err.message === "Unauthorized" ? 401 : 400,
      },
    );
  }
}
