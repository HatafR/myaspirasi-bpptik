import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppError } from "@/lib/error";

export async function loginAdmin(identifier, password) {
  if (!identifier || !password) {
    throw new AppError("Field wajib diisi", "VALIDATION_ERROR", 400);
  }
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    throw new AppError("User tidak ditemukan", "AUTH_NOT_FOUND", 404);
  }

  if (!user.isActive) {
    throw new Error("User inactive");
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new AppError("Password salah", "AUTH_INVALID", 401);
  }

  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT secret not configured", "AUTH_INVALID", 401);
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
}
