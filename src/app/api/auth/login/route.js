import { loginAdmin } from "@/services/auth.service";
import { AppError, handleError } from "@/lib/error";
import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Username atau email minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  captchaToken: z.string().optional(),
});

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON body", "VALIDATION_ERROR", 400);
    }

    // 1. Zod input validation
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errorMsg = Object.values(fieldErrors).flat().join(". ");
      throw new AppError(errorMsg, "VALIDATION_ERROR", 400);
    }

    const { identifier, password, captchaToken } = parsed.data;
    const isDev = process.env.NODE_ENV === "development";

    // 2. Verify Captcha in Production
    if (!isDev) {
      if (!captchaToken) {
        throw new AppError("Captcha wajib", "CAPTCHA_REQUIRED", 400);
      }

      const verifyRes = await fetch(
        "https://www.google.com/recaptcha/api/siteverify",
        {
          method: "POST",
          headers: {
            "Content-type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: captchaToken,
          }),
        }
      );

      const data = await verifyRes.json();

      if (!data.success) {
        throw new AppError("Captcha tidak valid", "CAPTCHA_INVALID", 400);
      }
    }

    // 3. Authenticate Admin Kredensial
    const result = await loginAdmin(identifier, password);

    const response = NextResponse.json({
      success: true,
      data: {
        user: result.user,
      },
    });

    // Set Access Token (auth_token) HttpOnly cookie (15 mins)
    response.cookies.set("auth_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });

    // Set Refresh Token (refresh_token) HttpOnly cookie (7 days)
    response.cookies.set("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // Log successful login
    console.info(`[SECURITY MONITORING] Successful login for admin: ${result.user.username}`);

    return response;
  } catch (e) {
    if (e.code === "AUTH_INVALID") {
      // Log failed login attempt
      console.warn(`[SECURITY MONITORING] Failed login attempt for user: ${req.headers.get("x-forwarded-for") || "anonymous"}`);
    }
    return handleError(e);
  }
}
