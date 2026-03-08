/**
 * POST /api/analyze
 * Menerima { text }, mengembalikan { kategori, source }
 * source: "anthropic" | "rule-based"
 */

const ruleBased = (text) => {
  const lower = text.toLowerCase();
  if (lower.match(/tolong|mohon|sebaiknya|harap|usul|perlu|disarankan/)) return "Saran";
  if (lower.match(/buruk|anjing|lambat|eror|kecewa|gagal|tidak bisa|kurang|masalah|rusak/)) return "Kritik";
  return "Komentar";
};

export async function POST(request) {
  const { text } = await request.json();
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  // Tidak ada API key → langsung rule-based
  if (!ANTHROPIC_API_KEY) {
    return Response.json({ kategori: ruleBased(text), source: "rule-based" });
  }

  const prompt = `
Analisis teks berikut dan tentukan KATEGORI saja:
- Kritik: keluhan, protes, ketidakpuasan
- Saran: usulan perbaikan, rekomendasi
- Komentar: pendapat umum, apresiasi

Jawab HANYA JSON ini tanpa teks lain:
{"kategori":"Komentar"}

Teks: "${text}"
`.trim();

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 50,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim() || "";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const kategori = ["Kritik", "Saran", "Komentar"].includes(parsed.kategori)
      ? parsed.kategori : ruleBased(text);

    return Response.json({ kategori, source: "anthropic" });
  } catch {
    return Response.json({ kategori: ruleBased(text), source: "rule-based" });
  }
}