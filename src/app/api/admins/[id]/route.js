import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function PATCH(req, { params }) {
  try {
    const user = requireAuth(req);
    requireRole(user, ["SUPER_ADMIN"]);

    const { id } = await params;
    const body = await req.json();
    const { name, username, email, password, role, serviceIds, isActive } = body;

    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (email !== undefined) updateData.email = email || null; // allow clearing email
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (role === "SERVICE_ADMIN" || updateData.role === "SERVICE_ADMIN") {
      updateData.assignedServices = {
        set: [], // disconnect all existing
        ...(serviceIds?.length > 0
          ? { connect: serviceIds.map((srvId) => ({ id: srvId })) }
          : {}),
      };
    } else {
      updateData.assignedServices = {
        set: [], 
      };
    }

    const updatedAdmin = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return Response.json({ success: true, data: updatedAdmin });
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

    // soft delete by setting isActive to false
    const deletedAdmin = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return Response.json({ success: true, data: deletedAdmin });
  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: 400 },
    );
  }
}
