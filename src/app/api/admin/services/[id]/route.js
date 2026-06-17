import { prisma } from "@/lib/prisma";
import { requireAuthFromCookie, requireRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  try {
    const user = await requireAuthFromCookie(req);
    // RBAC: only allow SUPER_ADMIN and GENERAL_ADMIN to modify services
    requireRole(user, ["SUPER_ADMIN", "GENERAL_ADMIN"]);

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      description,
      icon,
      color,
      bgColor,
      requiresManualAssignment,
      assignedAdminId,
      isActive,
    } = body;

    const updateData = {};

    if (name !== undefined) {
      // Check unique name (excluding current)
      const existing = await prisma.service.findFirst({
        where: { name, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ success: false, message: "Nama layanan sudah digunakan" }, { status: 400 });
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
    console.error("ADMIN PATCH SERVICE ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: err.message === "Unauthorized" ? 401 : err.message === "Forbidden" ? 403 : 500 }
    );
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
    console.error("ADMIN DELETE SERVICE ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: err.message === "Unauthorized" ? 401 : err.message === "Forbidden" ? 403 : 500 }
    );
  }
}
