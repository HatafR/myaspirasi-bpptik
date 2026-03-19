import { verifyToken } from "@/lib/verify-token";

export function requireAuth(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    throw new Error("Unauthorized");
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.replace("Bearer ", "");

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
