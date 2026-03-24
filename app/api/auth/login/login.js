import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/auth/login
export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, message: "Username/email dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Cari admin by username atau email
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { username: identifier.trim() },
          { email:    identifier.trim() },
        ],
        isActive: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Username/email atau password salah" },
        { status: 401 }
      );
    }

    // Verifikasi password
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Username/email atau password salah" },
        { status: 401 }
      );
    }

    // Return session data (tanpa password)
    const session = {
      id:        admin.id,
      name:      admin.name,
      role:      admin.role,
      roleLabel: admin.role === "admin_general"
        ? "Admin General"
        : `Admin Layanan · ${admin.division}`,
      division:  admin.division,
    };

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}