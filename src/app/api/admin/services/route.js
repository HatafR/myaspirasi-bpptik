import { prisma } from "@/lib/prisma";
import { requireAuthFromCookie, requireRole } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, handleError } from "@/lib/error";

const serviceSchema = z.object({
  name: z.string().trim().min(2, "Nama layanan minimal 2 karakter"),
  description: z.string().trim().max(1000, "Deskripsi maksimal 1000 karakter").optional().nullable(),
  icon: z.string().trim().max(20).optional().nullable(),
  color: z.string().trim().max(20).optional().nullable(),
  bgColor: z.string().trim().max(20).optional().nullable(),
  requiresManualAssignment: z.boolean().optional(),
  assignedAdminId: z.string().uuid().optional().nullable(),
});

export async function GET(req) {
  try {
    const user = await requireAuthFromCookie(req);
    // RBAC: allow SUPER_ADMIN, GENERAL_ADMIN, and SERVICE_ADMIN to read internal services
    requireRole(user, ["SUPER_ADMIN", "GENERAL_ADMIN", "SERVICE_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";

    // Only allow SUPER_ADMIN or GENERAL_ADMIN to view inactive services
    if (includeInactive && !["SUPER_ADMIN", "GENERAL_ADMIN"].includes(user.role)) {
      throw new AppError("Forbidden", "FORBIDDEN", 403);
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

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req) {
  try {
    const user = await requireAuthFromCookie(req);
    // RBAC: only allow SUPER_ADMIN and GENERAL_ADMIN to create services
    requireRole(user, ["SUPER_ADMIN", "GENERAL_ADMIN"]);

    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON body", "VALIDATION_ERROR", 400);
    }

    // 1. Zod validation
    const parsed = serviceSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errorMsg = Object.values(fieldErrors).flat().join(". ");
      throw new AppError(errorMsg, "VALIDATION_ERROR", 400);
    }

    const {
      name,
      description,
      icon,
      color,
      bgColor,
      requiresManualAssignment,
      assignedAdminId,
    } = parsed.data;

    // Check unique name
    const existing = await prisma.service.findUnique({ where: { name } });
    if (existing) {
      throw new AppError("Nama layanan sudah digunakan", "DUPLICATE_SERVICE", 400);
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

    // Logging action
    console.info(`[SECURITY MONITORING] Service created: ${newService.name} by User: ${user.userId}`);

    return NextResponse.json({ success: true, data: newService });
  } catch (err) {
    return handleError(err);
  }
}
