const VALID_SENTIMEN = ["Positif", "Netral", "Negatif"];
const VALID_KATEGORI = ["Kritik", "Saran", "Komentar"];

const ruleBased = (text) => {
  const lower = text.toLowerCase();

  const kategori = lower.match(
    /tolong|mohon|sebaiknya|harap|usul|perlu|disarankan/,
  )
    ? "Saran"
    : lower.match(/buruk|lambat|error|kecewa|gagal|tidak bisa|masalah|rusak/)
      ? "Kritik"
      : "Komentar";

  const sentimen = lower.match(/bagus|baik|terima kasih|mantap|puas|senang/)
    ? "Positif"
    : lower.match(/buruk|jelek|lambat|kecewa|gagal|marah/)
      ? "Negatif"
      : "Netral";

  return {
    sentimen,
    kategori,
    source: "rule-based",
  };
};

const extractJSON = (raw) => {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

export async function analyzeTextAI(text) {
  const API_KEY = process.env.MLAPI_KEY;
  if (!API_KEY) return ruleBased(text);

  try {
    const prompt = `
Analisis teks berikut.

Output JSON:
{
  "sentimen":"Positif|Netral|Negatif",
  "kategori":"Kritik|Saran|Komentar"
}

Teks: "${text}"
`;

    const res = await fetch(
      "https://mlapi.run/abc-1234-xyz/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "anthropic/claude-haiku-4-5",
          temperature: 0.7,
          max_tokens: 150,
          messages: [
            {
              role: "system",
              content: "Kamu adalah AI analis sentimen.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      },
    );

    const data = await res.json();

    const content =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      "";

    const parsed = extractJSON(content);
    if (!parsed) return ruleBased(text);

    return {
      sentimen: VALID_SENTIMEN.includes(parsed.sentimen)
        ? parsed.sentimen
        : "Netral",

      kategori: VALID_KATEGORI.includes(parsed.kategori)
        ? parsed.kategori
        : "Komentar",

      source: "haiku-4.5",
    };
  } catch (err) {
    return ruleBased(text);
  }
}