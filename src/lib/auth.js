import { verifyToken } from "@/lib/verify-token";
import { cookies } from "next/headers";

// Auth dari Authorization: Bearer header ATAU HttpOnly cookie (dual support)
export function requireAuth(request) {
  const authHeader = request.headers.get("authorization");

  // Coba dari Bearer header dulu
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    try {
      return verifyToken(token);
    } catch {
      throw new Error("Unauthorized");
    }
  }

  // Fallback: coba dari cookie (digunakan setelah migrasi frontend)
  // Catatan: requireAuth sinkron, untuk cookie perlu requireAuthFromCookie
  throw new Error("Unauthorized");
}

// Auth dari HttpOnly cookie (untuk API routes yang ingin mendukung cookie)
export async function requireAuthFromCookie(request) {
  // Coba dari Bearer header dulu (backward compatibility)
  const authHeader = request?.headers?.get?.("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    try {
      return verifyToken(token);
    } catch {
      throw new Error("Unauthorized");
    }
  }

  // Fallback ke cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    return verifyToken(token);
  } catch {
    throw new Error("Unauthorized");
  }
}

export function requireRole(user, allowedRoles) {
  if (!user || !user.role) {
    throw new Error("Forbidden");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
}

