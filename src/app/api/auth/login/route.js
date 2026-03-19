import { loginAdmin } from "@/services/auth.service";
import { success } from "zod";

export async function POST(req) {
  try {
    const body = await req.json();

    const result = await loginAdmin(body.identifier, body.password);

    return Response.json({
      success: true,
      data: result,
    });
  } catch (e) {
    return Response.json(
      {
        success: false,
        message: e.message,
      },
      {
        status: 400,
      },
    );
  }
}
