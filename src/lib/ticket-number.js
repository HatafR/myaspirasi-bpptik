import { randomUUID } from "crypto";

export async function generateTicketNumber() {
  return randomUUID();
}
