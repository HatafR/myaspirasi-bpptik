import jwt from "jsonwebtoken";

export function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret not configured");
  }

  return jwt.verify(token, process.env.JWT_SECRET);
}
