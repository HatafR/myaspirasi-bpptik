import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import fs from "fs";

export async function GET(req, { params }) {
  const { filename } = params;
  
  // Arahkan ke folder uploads di dalam public
  const filePath = join(process.cwd(), "public", "uploads", filename);

  // 1. Cek apakah file fisik ada di disk
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File tidak ditemukan di server" }, { status: 404 });
  }

  try {
    // 2. Baca file secara dinamis
    const fileBuffer = await readFile(filePath);

    // 3. Tentukan Content-Type sederhana berdasarkan ekstensi
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      pdf: "application/pdf",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Gagal membaca file:", error);
    return NextResponse.json({ error: "Gagal memproses file" }, { status: 500 });
  }
}