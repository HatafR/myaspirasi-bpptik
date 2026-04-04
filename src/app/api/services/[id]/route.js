import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export async function PATCH(req, { params }) {
  try {
    const user = requireAuth(req);
    requireRole(user, ["SUPER_ADMIN"]);

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
        throw new Error("Nama layanan sudah digunakan");
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

    return Response.json({ success: true, data: updatedService });
  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: 400 },
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = requireAuth(req);
    requireRole(user, ["SUPER_ADMIN"]);

    const { id } = await params;

    // Soft delete: set isActive to false
    const deletedService = await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return Response.json({ success: true, data: deletedService });
  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: 400 },
    );
  }
}
