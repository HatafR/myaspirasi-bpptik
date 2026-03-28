import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const LIMIT = 5;
const WINDOW = 60; // seconds

function getClientKey(req) {
  const ua = req.headers.get("user-agent") || "unknown";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";

  return `ratelimit:track:${ip}:${ua}`;
}

export async function POST(req) {
  try {
    const key = getClientKey(req);

    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, WINDOW);
    }

    if (current > LIMIT) {
      return NextResponse.json(
        { message: "Terlalu banyak request" },
        { status: 429 },
      );
    }

    const { ticket } = await req.json();

    if (!ticket) {
      return NextResponse.json(
        { message: "Nomor tiket wajib diisi" },
        { status: 400 },
      );
    }

    const found = await prisma.ticket.findUnique({
      where: { ticketNumber: ticket },
      include: {
        service: true,
      },
    });

    if (!found) {
      return NextResponse.json(
        { message: "Nomor tiket tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: found.id,
        name: found.name,
        email: found.email,
        service: found.service,
        status: found.status,
        message: found.message,
        createdAt: found.createdAt,
      },
    });
  } catch (err) {
    console.error("TRACK API ERROR:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
