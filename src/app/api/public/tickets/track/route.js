import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();

    const ticket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: body.ticketNumber,
        email: body.email,
      },
      include: {
        service: true,
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
