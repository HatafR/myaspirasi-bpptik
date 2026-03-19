import { analyzeTextAI } from "@/lib/ai-analyze";

export async function POST(request) {
  const { text } = await request.json();

  if (!text) {
    return Response.json({ error: "Text wajib diisi" }, { status: 400 });
  }

  const result = await analyzeTextAI(text);

  return Response.json(result);
}
