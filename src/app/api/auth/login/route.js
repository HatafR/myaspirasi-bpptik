import { loginAdmin } from "@/services/auth.service";
import { AppError } from "@/lib/error";

export async function POST(req) {
  try {
    const body = await req.json();

    const { identifier, password, captchaToken } = body;

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

    const result = await loginAdmin(identifier, password);

    return Response.json({
      success: true,
      data: result,
    });
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
