import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { scanFileForMalware } from "@/services/antivirus.service";

const ALLOWED_EXTENSIONS = ["pdf", "docx", "jpg", "jpeg", "png"];
const ALLOWED_MIME_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export async function POST(req) {
  try {
    const data = await req.formData();
    const file = data.get("file");
    const ticketId = data.get("ticketId");
    const uploadToken = data.get("uploadToken");

    // 1. Check required parameters
    if (!file || !ticketId || !uploadToken) {
      return NextResponse.json(
        { success: false, message: "File, Ticket ID, and Upload Token are required" },
        { status: 400 }
      );
    }

    // 2. Validate token scopes and expiration
    let decoded;
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT secret not configured");
      }
      decoded = jwt.verify(uploadToken, process.env.JWT_SECRET);
    } catch (err) {
      console.warn(`[SECURITY MONITORING] Invalid or expired upload token provided for Ticket ID: ${ticketId}`);
      return NextResponse.json(
        { success: false, message: "Token upload tidak valid atau kedaluwarsa" },
        { status: 401 }
      );
    }

    if (decoded.ticketId !== ticketId || decoded.action !== "upload_attachment") {
      console.warn(`[SECURITY MONITORING] Token scope mismatch for Ticket ID: ${ticketId}`);
      return NextResponse.json(
        { success: false, message: "Token upload tidak cocok dengan ID tiket" },
        { status: 403 }
      );
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Tiket tidak ditemukan" },
        { status: 404 }
      );
    }

    // 3. Enforce maximum file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.warn(`[SECURITY MONITORING] File size limit exceeded for Ticket ID: ${ticketId} (${file.size} bytes)`);
      return NextResponse.json(
        { success: false, message: "Ukuran file melebihi batas maksimal 10MB" },
        { status: 400 }
      );
    }

    // 4. Validate extension and MIME types (Anti-spoofing)
    const filenameParts = file.name.split(".");
    if (filenameParts.length < 2) {
      return NextResponse.json({ success: false, message: "Nama file tidak valid" }, { status: 400 });
    }
    const ext = filenameParts.pop().toLowerCase();
    
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      console.warn(`[SECURITY MONITORING] Blocked forbidden extension upload: ${ext} for Ticket ID: ${ticketId}`);
      return NextResponse.json(
        { success: false, message: `Ekstensi .${ext} tidak diizinkan` },
        { status: 400 }
      );
    }

    if (ALLOWED_MIME_TYPES[ext] !== file.type) {
      console.warn(`[SECURITY MONITORING] MIME type mismatch: expected ${ALLOWED_MIME_TYPES[ext]}, got ${file.type}`);
      return NextResponse.json(
        { success: false, message: "Tipe MIME file tidak cocok dengan ekstensi" },
        { status: 400 }
      );
    }

    // 5. Read file buffer and check magic bytes / file signature
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const hex = buffer.slice(0, 4).toString("hex").toLowerCase();

    let validMagic = false;
    if (ext === "png" && hex === "89504e47") validMagic = true;
    else if ((ext === "jpg" || ext === "jpeg") && hex.startsWith("ffd8ff")) validMagic = true;
    else if (ext === "pdf" && hex === "25504446") validMagic = true;
    else if (ext === "docx" && hex === "504b0304") validMagic = true;

    if (!validMagic) {
      console.warn(`[SECURITY MONITORING] Blocked invalid magic bytes upload: ${hex} for ext: ${ext}`);
      return NextResponse.json(
        { success: false, message: "Format signature file tidak valid" },
        { status: 400 }
      );
    }

    // 6. Image Re-encoding to strip EXIF data and neutralize polyglot files
    let processedBuffer = buffer;
    if (ext === "png" || ext === "jpg" || ext === "jpeg") {
      try {
        const sharp = (await import("sharp")).default;
        const img = sharp(buffer);
        if (ext === "png") {
          processedBuffer = await img.png({ force: true }).toBuffer();
        } else {
          processedBuffer = await img.jpeg({ force: true }).toBuffer();
        }
        console.log(`[FILE PROCESS] Image successfully re-encoded using sharp`);
      } catch (sharpError) {
        console.error("[SHARP ERROR] Failed to re-encode image:", sharpError);
        return NextResponse.json(
          { success: false, message: "Gagal memproses dan menyaring gambar" },
          { status: 500 }
        );
      }
    }

    // 7. Malware scanning hook
    try {
      await scanFileForMalware(processedBuffer, file.name);
    } catch (virusErr) {
      console.warn(`[SECURITY MONITORING] Malware detection hit for file: ${file.name}, ticket ID: ${ticketId}: ${virusErr.message}`);
      return NextResponse.json(
        { success: false, message: "File ditolak karena terdeteksi mengandung ancaman keamanan / malware" },
        { status: 400 }
      );
    }

    // 8. Save to Private Storage (outside of public root)
    const privateUploadsDir = join(process.cwd(), "private_uploads");
    await mkdir(privateUploadsDir, { recursive: true });

    // Generate secure randomized UUID filename
    const uniqueFilename = `${crypto.randomUUID()}.${ext}`;
    const filePath = join(privateUploadsDir, uniqueFilename);
    await writeFile(filePath, processedBuffer);

    // 9. Save Attachment record to DB
    const attachment = await prisma.attachment.create({
      data: {
        ticketId: ticketId,
        url: `/api/uploads/${uniqueFilename}`,
        key: `private_uploads/${uniqueFilename}`,
        filename: file.name,
        mimeType: file.type,
        size: processedBuffer.length,
      },
    });

    // Write audit log entry
    await prisma.ticketAuditLog.create({
      data: {
        ticketId: ticketId,
        type: "GENERAL_ACTION",
        actorId: null,
        metadata: {
          action: "ATTACHMENT_UPLOADED",
          filename: file.name,
          size: processedBuffer.length,
        },
      },
    });

    console.info(`[SECURITY MONITORING] Attachment uploaded and connected. Ticket ID: ${ticketId}, Attachment ID: ${attachment.id}`);

    return NextResponse.json({
      success: true,
      data: {
        url: attachment.url,
        key: attachment.key,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during file upload" },
      { status: 500 }
    );
  }
}
