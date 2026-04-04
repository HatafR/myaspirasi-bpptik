import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function GET(req) {
  try {
    const user = requireAuth(req);
    requireRole(user, ["SUPER_ADMIN", "GENERAL_ADMIN"]);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "all" for dashboard, empty for assign dropdown
    const includeInactive = searchParams.get("all") === "true";

    const admins = await prisma.user.findMany({
      where: {
        role: type === "all" ? { not: "SUPER_ADMIN" } : "SERVICE_ADMIN",
        ...(includeInactive ? {} : { isActive: true }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
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

export async function POST(req) {
  try {
    const user = requireAuth(req);
    requireRole(user, ["SUPER_ADMIN"]);

    const body = await req.json();
    const { name, username, email, password, role, serviceIds } = body;

    if (!name || !username || !password || !role) {
      throw new Error("Missing required fields");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.user.create({
      data: {
        name,
        username,
        email: email || null,
        password: hashedPassword,
        role,
        isActive: true,
        ...(role === "SERVICE_ADMIN" && serviceIds?.length > 0
          ? {
              assignedServices: {
                connect: serviceIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
    });

    return Response.json({ success: true, data: newAdmin });
  } catch (err) {
    return Response.json(
      { success: false, message: err.message },
      { status: 400 },
    );
  }
}
