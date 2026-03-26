import { createTicket } from "@/services/ticket.service";
import { ticketSchema } from "@/validations/ticket.validation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const LIMIT = 5;
const WINDOW = 60; // seconds

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

    if (user.role === "SERVICE_ADMIN") {
      where.assignedToId = user.userId;
    }

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
    // ambil IP user
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "anonymous";

    const key = `ratelimit:${ip}`;

    // check rate limit
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, WINDOW);
    }

    if (current > LIMIT) {
      return NextResponse.json(
        {
          success: false,
          message: "Terlalu banyak kirim aspirasi. Tunggu 60 detik.",
        },
        { status: 429 }
      );
    }

    // =====================
    // CREATE TICKET
    // =====================
    const body = await req.json();

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