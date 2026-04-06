import { GoogleGenerativeAI } from "@google/generative-ai";

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
Lakukan analisis sentimen dan kategorisasi teks secara ketat.

Definisi Sentimen:
- Positif: Ekspresi kepuasan, pujian, atau emosi menyenangkan.
- Netral: Pernyataan fakta, pertanyaan tanpa emosi, atau informasi tanpa opini.
- Negatif: Ekspresi kekecewaan, keluhan, kemarahan, atau ketidakpuasan.

Definisi Kategori:
- Kritik: Penilaian yang menunjukkan kekurangan atau kesalahan spesifik.
- Saran: Ide, usul, atau rekomendasi untuk perbaikan di masa depan.
- Komentar: Tanggapan umum, observasi, atau pertanyaan yang tidak mengandung masukan teknis.

Tugas:
Analisa teks berikut dan kembalikan respons HANYA dalam format JSON mentah tanpa penjelasan, tanpa markdown block, dan tanpa teks tambahan.

Teks: "${text}"

Output Format:
{"sentimen":"isi","kategori":"isi"}
`;

    const res = await fetch(
      "https://mlapi.run/926b7d22-d3cc-4b2f-8e93-bd7dd0751698/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4-5",
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

    const raw = await res.text();

    // console.log(raw);

    const data = JSON.parse(raw);

    const parsed = extractJSON(data.choices[0].message.content || "");

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

// export async function analyzeTextAI(text) {
//   const API_KEY = process.env.GEMINI_API_KEY; // Ganti dengan key dari AI Studio
//   if (!API_KEY) return ruleBased(text);

//   const genAI = new GoogleGenerativeAI(API_KEY);
  
//   // Menggunakan Gemini 2.0 Flash (Tercepat dan support JSON mode dengan baik)
//   const model = genAI.getGenerativeModel({ 
//     model: "gemini-2.0-flash",
//     generationConfig: {
//       responseMimeType: "application/json", // Memaksa output JSON
//     }
//   });

//   try {
//     const prompt = `
//       Analisis teks berikut: "${text}"
//       Berikan output dalam JSON sesuai skema:
//       {"sentimen": "Positif" | "Netral" | "Negatif", "kategori": "Kritik" | "Saran" | "Komentar"}
//     `;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const data = JSON.parse(response.text());

//     return {
//       sentimen: VALID_SENTIMEN.includes(data.sentimen) ? data.sentimen : "Netral",
//       kategori: VALID_KATEGORI.includes(data.kategori) ? data.kategori : "Komentar",
//       source: "gemini-2.0-flash",
//     };
//   } catch (err) {
//     console.error("Gemini Error:", err);
//     return ruleBased(text);
//   }
// }
