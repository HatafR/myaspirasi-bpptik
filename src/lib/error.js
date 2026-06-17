import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function handleError(err) {
  console.error("[CENTRALIZED ERROR LOG]:", err);

  if (err instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        message: err.message,
        code: err.code,
      },
      { status: err.status }
    );
  }

  // Handle specific Prisma database errors with generic messages
  if (err.code?.startsWith("P")) {
    return NextResponse.json(
      {
        success: false,
        message: "Database operation failed",
        code: "DATABASE_ERROR",
      },
      { status: 500 }
    );
  }

  // Shield all other unhandled program errors/stack traces
  return NextResponse.json(
    {
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
    },
    { status: 500 }
  );
}