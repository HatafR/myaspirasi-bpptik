import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tickets/:id — detail tiket
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        history:   { orderBy: { changedAt: "desc" } },
        rating:    true,
        tanggapan: { orderBy: { createdAt: "desc" } },
        replies:   { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Tiket tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error("GET /api/tickets/:id error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data tiket" },
      { status: 500 }
    );
  }
}

// PATCH /api/tickets/:id — update status / assign admin
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, assignedTo, changedBy, changedByRole } = body;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Tiket tidak ditemukan" },
        { status: 404 }
      );
    }

    // Update tiket
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        ...(status     && { status }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
    });

    // Simpan history jika ada perubahan status
    if (status && status !== ticket.status) {
      await prisma.ticketHistory.create({
        data: {
          ticketId:      id,
          status,
          changedBy:     changedBy     || "Admin",
          changedByRole: changedByRole || "admin",
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/tickets/:id error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengupdate tiket" },
      { status: 500 }
    );
  }
}