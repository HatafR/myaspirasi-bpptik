import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";

    // If requesting all (including inactive), require SUPER_ADMIN
    if (includeInactive) {
      const user = requireAuth(req);
      requireRole(user, ["SUPER_ADMIN"]);
    }

    const services = await prisma.service.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      success: true,
      data: services,
    });
  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: err.message === "Unauthorized" ? 401 : 500 },
    );
  }
}

export async function POST(req) {
  try {
    const user = requireAuth(req);
    requireRole(user, ["SUPER_ADMIN"]);

    const body = await req.json();
    const {
      name,
      description,
      icon,
      color,
      bgColor,
      requiresManualAssignment,
      assignedAdminId,
    } = body;

    if (!name) {
      throw new Error("Nama layanan wajib diisi");
    }

    // Check unique name
    const existing = await prisma.service.findUnique({ where: { name } });
    if (existing) {
      throw new Error("Nama layanan sudah digunakan");
    }

    const newService = await prisma.service.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
        color: color || null,
        bgColor: bgColor || null,
        requiresManualAssignment: requiresManualAssignment || false,
        assignedAdminId: assignedAdminId || null,
        isActive: true,
      },
      include: {
        assignedAdmin: {
          select: { id: true, name: true, username: true },
        },
        _count: { select: { tickets: true } },
      },
    });

    return Response.json({ success: true, data: newService });
  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: 400 },
    );
  }
}
