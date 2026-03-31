import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.Service.findMany({
      where: { isActive: true },
      orderBy: { id: "desc" },
    });

    return Response.json({
      success: true,
      data: services,
    });
  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: 500 },
    );
  }
}
