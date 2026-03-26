import { loginAdmin } from "@/services/auth.service";
import { AppError } from "@/lib/error";

export async function POST(req) {
  try {
    const body = await req.json();

    const result = await loginAdmin(body.identifier, body.password);

    return Response.json({
      success: true,
      data: result,
    });
  } catch (e) {
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

    // unknown error (JANGAN expose)
    return Response.json(
      {
        success: false,
        message: "Internal server error",
        code: "SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
