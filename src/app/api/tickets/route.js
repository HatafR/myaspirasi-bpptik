import { createTicket } from "@/services/ticket.service";
import { ticketSchema } from "@/validations/ticket.validation";
import { prisma } from "@/lib/prisma";
import { requireAuthFromCookie } from "@/lib/auth";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const LIMIT = 5;
const WINDOW = 60; // seconds

// ==========================
// GET /api/tickets
// ==========================
export async function GET(req) {
  try {
    const user = await requireAuthFromCookie(req);
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
        attachments: true,
        ticketAuditLogs: {
          orderBy: { createdAt: "desc" },
          include: { actor: true }
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
    // =====================
    // CREATE TICKET
    // =====================
    const body = await req.json();

    const { captchaToken, ...payload } = body;

    if (!captchaToken) {
      return Response.json(
        {
          success: false,
          message: "Captcha wajib",
        },
        { status: 400 },
      );
    }

    // verify captcha dulu
    const verifyRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        }),
      },
    );

    const data = await verifyRes.json();

    if (!data.success) {
      return Response.json(
        {
          success: false,
          message: "Captcha tidak valid",
        },
        { status: 400 },
      );
    }

    const parsed = ticketSchema.safeParse(payload);

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
