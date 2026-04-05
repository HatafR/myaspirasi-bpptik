import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes yang membutuhkan login
const PROTECTED_ROUTES = ["/admin/dashboard", "/dashboard"];

// Routes yang hanya bisa diakses saat BELUM login
const AUTH_ONLY_ROUTES = ["/login"];

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET tidak dikonfigurasi");
  return new TextEncoder().encode(secret);
}

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
  const isAuthOnly = AUTH_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }

    return NextResponse.next();
  }

  if (isAuthOnly) {
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(
          new URL("/admin/dashboard", request.url),
        );
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/admin/dashboard/:path*",
  ],
};
