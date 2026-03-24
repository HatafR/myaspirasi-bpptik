import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/tickets/:id/rating — submit rating
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating harus antara 1-5" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Tiket tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!["Resolved", "Closed"].includes(ticket.status)) {
      return NextResponse.json(
        { success: false, message: "Rating hanya bisa diberikan setelah tiket Resolved/Closed" },
        { status: 400 }
      );
    }

    // Cek sudah pernah rating
    const existing = await prisma.rating.findUnique({ where: { ticketId: id } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Anda sudah memberikan rating untuk tiket ini" },
        { status: 409 }
      );
    }

    const result = await prisma.rating.create({
      data: { ticketId: id, rating, comment: comment?.trim() || null },
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tickets/:id/rating error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan rating" },
      { status: 500 }
    );
  }
}

// GET /api/tickets/:id/rating — cek rating
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const rating = await prisma.rating.findUnique({ where: { ticketId: id } });
    return NextResponse.json({ success: true, data: rating });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil rating" },
      { status: 500 }
    );
  }
}