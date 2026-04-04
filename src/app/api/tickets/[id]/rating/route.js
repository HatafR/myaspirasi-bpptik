import { prisma } from "@/lib/prisma";

import { Prisma } from "@prisma/client";

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
    const { id } = await params;
    const body = await req.json();

    // ✅ VALIDATION
    const parsedRating = Number(body.rating);
    const comment = body.comment?.trim() || null;
    console.log(id);

    if (
      !Number.isInteger(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      throw new Error("Rating must be integer 1-5");
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber: id },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // ✅ STATUS CHECK (ENUM BARU)
    if (!["RESOLVED", "CLOSED"].includes(ticket.status)) {
      throw new Error("Rating only allowed after ticket is resolved or closed");
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.rating.findUnique({
        where: { ticketId: ticket.id },
      });

      if (existing) {
        throw new Error("Rating already exists");
      }

      const rating = await tx.rating.create({
        data: {
          ticketId: ticket.id,
          score: parsedRating,
          comment,
        },
      });

      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
        },
      });

      if (ticket.status !== "CLOSED") {
        await tx.ticketAuditLog.create({
          data: {
            ticketId: ticket.id,
            type: "STATUS_CHANGED",
            fromValue: ticket.status,
            toValue: "CLOSED",
            actorId: null,
          },
        });
      }

      await tx.ticketAuditLog.create({
        data: {
          ticketId: ticket.id,
          type: "RATING_GIVEN",
          metadata: { score: parsedRating, comment },
        },
      });

      return rating;
    });

    return Response.json(
      {
        success: true,
        data: result,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return Response.json(
          {
            success: false,
            message: "User already submitted rating",
          },
          { status: 409 },
        );
      }
    }

    return Response.json(
      {
        success: false,
        message: err.message,
      },
      { status: 400 },
    );
  }
}
