import { readFile } from "fs/promises";
import { resolve } from "path";
import { NextResponse } from "next/server";
import fs from "fs";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { requireAuthFromCookie } from "@/lib/auth";

export async function GET(req, { params }) {
  const { filename } = await params;

  const basePath = resolve(process.cwd(), "private_uploads");
  const filePath = resolve(basePath, filename);

  if (!filePath.startsWith(basePath)) {
    console.warn(`[SECURITY MONITORING] Blocked path traversal attempt on filename: ${filename}`);
    return new NextResponse("Akses ditolak", { status: 403 });
  }

  const attachment = await prisma.attachment.findFirst({
    where: { url: `/api/uploads/${filename}` },
    include: { ticket: true },
  });

  if (!attachment) {
    return new NextResponse("File tidak ditemukan", { status: 404 });
  }

  let authorized = false;

  try {
    const adminUser = await requireAuthFromCookie(req);
    if (adminUser) {
      if (adminUser.role === "SUPER_ADMIN" || adminUser.role === "GENERAL_ADMIN") {
        authorized = true;
      } else if (
        adminUser.role === "SERVICE_ADMIN" &&
        attachment.ticket.assignedToId === adminUser.userId
      ) {
        authorized = true;
      }
    }
  } catch {
    // Not an authenticated admin; fall through to guest cookie check
  }

  if (!authorized) {
    try {
      const cookieStore = await cookies();
      const trackedToken = cookieStore.get("tracked_session")?.value;
      if (trackedToken && process.env.JWT_SECRET) {
        const decoded = jwt.verify(trackedToken, process.env.JWT_SECRET);
        if (decoded.ticketId === attachment.ticketId && decoded.action === "view_attachments") {
          authorized = true;
        }
      }
    } catch {
      // Invalid or expired guest session cookie
    }
  }

  if (!authorized) {
    console.warn(`[SECURITY MONITORING] Unauthorized download attempt for filename: ${filename}`);
    return new NextResponse("Unauthorized. Anda tidak memiliki akses ke lampiran ini.", { status: 401 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse("File fisik tidak ditemukan di server", { status: 404 });
  }

  try {
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${attachment.filename.replace(/[^a-zA-Z0-9.-]/g, "_")}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("File read error:", error);
    return new NextResponse("Gagal membaca file", { status: 500 });
  }
}
