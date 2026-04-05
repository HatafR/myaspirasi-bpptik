import { prisma } from "@/lib/prisma";
import { requireAuthFromCookie, requireRole } from "@/lib/auth";

// ==========================
// GET /api/tickets/:id/response
// ==========================
export async function GET(req, { params }) {
  try {
    const { id } = params;

    const response = await prisma.ticketResponse.findUnique({
      where: { ticketId: id },
    });

    return Response.json({
      success: true,
      data: response,
    });
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

// ==========================
// POST /api/tickets/:id/response
// ==========================
export async function POST(req, { params }) {
  try {
    const user = await requireAuthFromCookie(req);
    requireRole(user, ["SERVICE_ADMIN", "SUPER_ADMIN"]);

    const { id } = params;
    const body = await req.json();

    if (!body.content?.trim()) {
      throw new Error("Response content is required");
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // ❗ enforce hanya boleh respon kalau sudah assigned / in_progress
    if (!["ASSIGNED", "IN_PROGRESS", "RESOLVED"].includes(ticket.status)) {
      throw new Error("Ticket not ready for response");
    }

    const response = await prisma.ticketResponse.upsert({
      where: { ticketId: id },
      update: {
        content: body.content.trim(),
      },
      create: {
        ticketId: id,
        content: body.content.trim(),
      },
    });

    return Response.json({
      success: true,
      data: response,
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
