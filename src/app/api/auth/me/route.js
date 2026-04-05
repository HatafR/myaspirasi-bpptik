import { cookies } from "next/headers";
import { verifyToken } from "@/lib/verify-token";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return Response.json(
        { success: false, message: "Tidak terautentikasi" },
        { status: 401 },
      );
    }

    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return Response.json(
        { success: false, message: "User tidak ditemukan atau tidak aktif" },
        { status: 401 },
      );
    }

    return Response.json({ success: true, data: user });
  } catch {
    return Response.json(
      { success: false, message: "Token tidak valid" },
      { status: 401 },
    );
  }
}
