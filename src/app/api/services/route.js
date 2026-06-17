import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Public DTO serializer to filter out admin internal details
    const publicServices = services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description || null,
      category: null, // Default category field as required by VAPT, schema currently does not store category
    }));

    return NextResponse.json({
      success: true,
      data: publicServices,
    });
  } catch (err) {
    console.error("GET SERVICES API ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
