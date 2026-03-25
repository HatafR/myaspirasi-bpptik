import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tickets — ambil semua tiket
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status   = searchParams.get("status");
    const division = searchParams.get("division");
    const search   = searchParams.get("search");

    const where = {
      ...(status   && status !== "all" && { status }),
      ...(division && division !== "all" && { division }),
      ...(search   && {
        OR: [
          { id:      { contains: search, mode: "insensitive" } },
          { name:    { contains: search, mode: "insensitive" } },
          { message: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        history: { orderBy: { changedAt: "desc" } },
        rating:  true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    console.error("GET /api/tickets error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data tiket" },
      { status: 500 }
    );
  }
}

// POST /api/tickets — submit tiket baru
export async function POST(request) {
  try {
    const body = await request.json();
    const { id, name, email, division, subject, message, sentiment, category } = body;

    // Validasi
    if (!id || !email || !division || !message || !sentiment || !category) {
      return NextResponse.json(
        { success: false, message: "Field wajib tidak lengkap" },
        { status: 400 }
      );
    }

    // Cek duplikat ID
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "ID tiket sudah ada" },
        { status: 409 }
      );
    }

    const ticket = await prisma.ticket.create({
      data: {
        id,
        name:      name?.trim() || "Anonim",
        email:     email.trim(),
        division,
        subject:   subject?.trim() || "",
        message:   message.trim(),
        sentiment,
        category,
        status:    "Open",
      },
    });

    // Simpan history awal
    await prisma.ticketHistory.create({
      data: {
        ticketId:     ticket.id,
        status:       "Open",
        changedBy:    "Sistem",
        changedByRole: "Auto",
      },
    });

    return NextResponse.json({ success: true, data: ticket }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tickets error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan tiket" },
      { status: 500 }
    );
  }
}