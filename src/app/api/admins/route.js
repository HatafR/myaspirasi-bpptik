import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = requireAuth(req);
    requireRole(user, ["super_admin", "general_admin"]);

    const admins = await prisma.user.findMany({
      where: {
        role: "service_admin",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        assignedServices: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return Response.json({
      success: true,
      data: admins,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: err.message,
      },
      {
        status: err.message === "Unauthorized" ? 401 : 400,
      },
    );
  }
}
