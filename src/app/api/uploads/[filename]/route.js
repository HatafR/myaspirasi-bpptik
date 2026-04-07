import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import fs from "fs";

export async function GET(req, { params }) {
  const { filename } = params;
  
  // Menentukan path absolut ke folder uploads
  const filePath = join(process.cwd(), "public", "uploads", filename);

  // Cek apakah file benar-benar ada di folder
  if (!fs.existsSync(filePath)) {
    return new NextResponse("File tidak ditemukan di server", { status: 404 });
  }

  try {
    const fileBuffer = await readFile(filePath);
    
    // Tentukan Content-Type berdasarkan ekstensi file
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Content-Disposition": "inline", // Agar file bisa langsung terbuka di browser
        "Cache-Control": "no-store, max-age=0", // Mencegah caching agar file terbaru selalu terbaca
      },
    });
  } catch (error) {
    return new NextResponse("Gagal membaca file", { status: 500 });
  }
}