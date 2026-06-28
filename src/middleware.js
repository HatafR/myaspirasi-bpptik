import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { applySecurityHeaders } from "@/lib/security-headers";

// Routes yang membutuhkan login
const PROTECTED_ROUTES = ["/admin/dashboard", "/dashboard"];

// Routes yang hanya bisa diakses saat BELUM login
const AUTH_ONLY_ROUTES = ["/login"];

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET tidak dikonfigurasi");
  return new TextEncoder().encode(secret);
}

async function verifyToken(token, expectedType = "access") {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== expectedType) return null;
    return payload;
  } catch {
    return null;
  }
}

async function generateAccessToken(userId, role) {
  return await new SignJWT({
    userId,
    role,
    type: "access"
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
  const isAuthOnly = AUTH_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (isProtected) {
    let payload = null;
    if (token) {
      payload = await verifyToken(token, "access");
    }

    // Access token is invalid or missing, attempt refresh
    if (!payload && refreshToken) {
      const refreshPayload = await verifyToken(refreshToken, "refresh");
      if (refreshPayload) {
        const newAccessToken = await generateAccessToken(refreshPayload.userId, refreshPayload.role);
        
        // Return response, setting the new auth_token cookie
        const response = NextResponse.next();
        response.cookies.set("auth_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 15 * 60,
          path: "/",
        });
        return applySecurityHeaders(response);
      }
    }

    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      response.cookies.delete("refresh_token");
      return applySecurityHeaders(response);
    }

    return applySecurityHeaders(NextResponse.next());
  }

  if (isAuthOnly) {
    let payload = null;
    if (token) {
      payload = await verifyToken(token, "access");
    }
    if (!payload && refreshToken) {
      payload = await verifyToken(refreshToken, "refresh");
    }

    if (payload) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/admin/dashboard", request.url)),
      );
    }

    return applySecurityHeaders(NextResponse.next());
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
