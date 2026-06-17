import { prisma } from "@/lib/prisma";
import { requireAuthFromCookie, requireRole } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, handleError } from "@/lib/error";

const servicePatchSchema = z.object({
  name: z.string().trim().min(2, "Nama layanan minimal 2 karakter").optional(),
  description: z.string().trim().max(1000, "Deskripsi maksimal 1000 karakter").optional().nullable(),
  icon: z.string().trim().max(20).optional().nullable(),
  color: z.string().trim().max(20).optional().nullable(),
  bgColor: z.string().trim().max(20).optional().nullable(),
  requiresManualAssignment: z.boolean().optional(),
  assignedAdminId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req, { params }) {
  try {
    const user = await requireAuthFromCookie(req);
    // RBAC: only allow SUPER_ADMIN and GENERAL_ADMIN to modify services
    requireRole(user, ["SUPER_ADMIN", "GENERAL_ADMIN"]);

    const { id } = await params;
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON body", "VALIDATION_ERROR", 400);
    }

    // 1. Zod validation
    const parsed = servicePatchSchema.safeParse(body);
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
      isActive,
    } = parsed.data;

    const updateData = {};

    if (name !== undefined) {
      // Check unique name (excluding current)
      const existing = await prisma.service.findFirst({
        where: { name, id: { not: id } },
      });
      if (existing) {
        throw new AppError("Nama layanan sudah digunakan", "DUPLICATE_SERVICE", 400);
      }
      updateData.name = name;
    }

    if (description !== undefined) updateData.description = description || null;
    if (icon !== undefined) updateData.icon = icon || null;
    if (color !== undefined) updateData.color = color || null;
    if (bgColor !== undefined) updateData.bgColor = bgColor || null;
    if (requiresManualAssignment !== undefined)
      updateData.requiresManualAssignment = requiresManualAssignment;
    if (assignedAdminId !== undefined)
      updateData.assignedAdminId = assignedAdminId || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        assignedAdmin: {
          select: { id: true, name: true, username: true },
        },
        _count: { select: { tickets: true } },
      },
    });

    console.info(`[SECURITY MONITORING] Service updated: ${id} by User: ${user.userId}`);

    return NextResponse.json({ success: true, data: updatedService });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await requireAuthFromCookie(req);
    // RBAC: only allow SUPER_ADMIN and GENERAL_ADMIN to delete/disable services
    requireRole(user, ["SUPER_ADMIN", "GENERAL_ADMIN"]);

    const { id } = await params;

    // Soft delete: set isActive to false
    const deletedService = await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    console.info(`[SECURITY MONITORING] Service soft-deleted: ${id} by User: ${user.userId}`);

    return NextResponse.json({ success: true, data: deletedService });
  } catch (err) {
    return handleError(err);
  }
}
