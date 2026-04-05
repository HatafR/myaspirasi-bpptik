import jwt from "jsonwebtoken";

// Verifikasi token menggunakan jsonwebtoken (hanya untuk API route, bukan middleware Edge)
export function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret not configured");
  }

  return jwt.verify(token, process.env.JWT_SECRET);
}
