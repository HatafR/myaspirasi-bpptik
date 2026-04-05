import { loginAdmin } from "@/services/auth.service";
import { AppError } from "@/lib/error";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const { identifier, password, captchaToken } = body;
    const isDev = process.env.NODE_ENV === "development";

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
        },
      );

      const data = await verifyRes.json();

      if (!data.success) {
        throw new Error("Captcha tidak valid");
      }
    }

    const result = await loginAdmin(identifier, password);

    const response = NextResponse.json({
      success: true,
      data: {
        user: result.user,
      },
    });

    // Set JWT sebagai HttpOnly cookie
    response.cookies.set("auth_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 jam (sesuai JWT expiresIn)
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("LOGIN ERROR:", e);

    if (e instanceof AppError) {
      return Response.json(
        {
          success: false,
          message: e.message,
          code: e.code,
        },
        { status: e.status },
      );
    }

    return Response.json(
      {
        success: false,
        message: e.message || "Internal server error",
        code: "SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
