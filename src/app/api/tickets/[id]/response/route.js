import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export async function POST(req, { params }) {
  try {
    const user = requireAuth(req);
    requireRole(user, ["service_admin", "super_admin"]);

    const { id } = params;
    const body = await req.json();

    if (!body.content?.trim()) {
      throw new Error("Response content is required");
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: id,
      },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const response = await prisma.ticketResponse.upsert({
      where: {
        ticketId: ticket.id,
      },
      update: {
        content: body.content,
      },
      create: {
        ticketId: ticket.id,
        content: body.content,
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
