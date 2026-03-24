import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/tickets/:id/tanggapan — user kirim tanggapan
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isi } = body;

    if (!isi?.trim()) {
      return NextResponse.json(
        { success: false, message: "Isi tanggapan tidak boleh kosong" },
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

    if (ticket.status !== "Resolved") {
      return NextResponse.json(
        { success: false, message: "Tanggapan hanya bisa dikirim saat tiket Resolved" },
        { status: 400 }
      );
    }

    const result = await prisma.tanggapan.create({
      data: { ticketId: id, isi: isi.trim() },
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tickets/:id/tanggapan error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan tanggapan" },
      { status: 500 }
    );
  }
}

// GET /api/tickets/:id/tanggapan
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const tanggapan = await prisma.tanggapan.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: tanggapan });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil tanggapan" },
      { status: 500 }
    );
  }
}