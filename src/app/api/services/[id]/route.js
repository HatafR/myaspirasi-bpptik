import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json({ message: "Not Found" }, { status: 404 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Not Found" }, { status: 404 });
}
