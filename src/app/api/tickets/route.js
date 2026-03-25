import { createTicket } from "@/services/ticket.service";
import { ticketSchema } from "@/validations/ticket.validation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// ==========================
// GET /api/tickets
// ==========================
export async function GET(req) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const serviceId = searchParams.get("serviceId");
    const search = searchParams.get("search");

    let where = {};

    // 🔐 Role-based access
    if (user.role === "SERVICE_ADMIN") {
      where.assignedToId = user.userId;
    }

    // 🔍 Filters
    if (status && status !== "all") {
      where.status = status;
    }

    if (serviceId && serviceId !== "all") {
      where.serviceId = serviceId;
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        service: true,
        assignedTo: true,
        response: true,
        rating: true,
        statusHistories: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
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
        status: err.message === "Unauthorized" ? 401 : 500,
      },
    );
  }
}

// ==========================
// POST /api/tickets
// ==========================
export async function POST(req) {
  try {
    const body = await req.json();

    // ✅ VALIDATION (single source of truth)
    const parsed = ticketSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // ✅ BUSINESS LOGIC DI SERVICE
    const ticket = await createTicket(parsed.data);

    return Response.json(
      {
        success: true,
        data: ticket,
      },
      { status: 201 },
    );
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: err.message,
      },
      { status: 500 },
    );
  }
}
