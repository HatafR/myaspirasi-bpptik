/**
 * analyzeText — dipanggil dari client component.
 * Sentimen  → ML Railway API
 * Kategori  → /api/analyze (Next.js API route) → Anthropic (aman di server)
 * Fallback  → rule-based
 */

const ML_API_URL =
  "https://router.huggingface.co/hf-inference/models/w11wo/indonesian-roberta-base-sentiment-classifier";

// ── Rule-based fallback ───────────────────────────────────────────────────────
const ruleBased = (text) => {
  const lower = text.toLowerCase();
  const kategori = lower.match(
    /tolong|mohon|sebaiknya|harap|usul|perlu|disarankan/,
  )
    ? "Saran"
    : lower.match(
          /buruk|anjing|lambat|eror|kecewa|gagal|tidak bisa|kurang|masalah|rusak/,
        )
      ? "Kritik"
      : "Komentar";
  const sentimen = lower.match(
    /bagus|baik|terima kasih|hebat|mantap|puas|senang|luar biasa/,
  )
    ? "Positif"
    : lower.match(
          /buruk|jelek|lambat|kecewa|gagal|marah|tidak puas|parah|payah|anjing/,
        )
      ? "Negatif"
      : "Netral";
  return { sentimen, kategori };
};

// ── Prioritas 1: ML Railway → sentimen ───────────────────────────────────────
const analyzeWithML = async (text) => {
  const res = await fetch(ML_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
    },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  const results = data[0];
  const top = results.reduce((a, b) => (a.score > b.score ? a : b));
  const labelMap = {
    negative: "Negatif",
    positive: "Positif",
    neutral: "Netral",
  };
  return labelMap[top.label] || "Netral";
};

// ── Prioritas 2: Next.js API route → Anthropic (server-side, API key aman) ───
const analyzeKategoriViaAPI = async (text) => {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  // Jika source rule-based berarti Anthropic gagal di server → return null
  if (data.source === "rule-based") return null;
  return data.kategori;
};

// ── Main ──────────────────────────────────────────────────────────────────────
const analyzeText = async (text) => {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    return await res.json();
  } catch {
    return {
      sentimen: "Netral",
      kategori: "Komentar",
      source: "fallback",
    };
  }
};

export default analyzeText;
