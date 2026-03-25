import { prisma } from "@/lib/prisma";

// ==========================
// GET /api/tickets/:id/rating
// ==========================
export async function GET(req, { params }) {
  try {
    const { id } = params;

    const rating = await prisma.rating.findUnique({
      where: { ticketId: id },
    });

    return Response.json({
      success: true,
      data: rating,
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
// POST /api/tickets/:id/rating
// ==========================
export async function POST(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { rating, comment } = body;

    // ✅ VALIDATION
    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1-5");
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // ✅ STATUS CHECK (ENUM BARU)
    if (!["RESOLVED", "CLOSED"].includes(ticket.status)) {
      throw new Error("Rating only allowed after ticket is resolved or closed");
    }

    // ✅ CREATE (rely on unique constraint)
    const result = await prisma.rating.create({
      data: {
        ticketId: id,
        score: rating,
        comment: comment?.trim() || null,
      },
    });

    return Response.json(
      {
        success: true,
        data: result,
      },
      { status: 201 },
    );
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
            : err.message.includes("Unique constraint")
              ? 409
              : 400,
      },
    );
  }
}
