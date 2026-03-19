"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DIVISIONS from "@/constants/divisions";
import analyzeText from "@/services/analyzeText";
import generateTicketId from "@/utils/generateTicketId";
import formatDate from "@/utils/formatDate";
import SentimentBadge from "@/components/SentimentBadge";
import CategoryBadge from "@/components/CategoryBadge";
import Navbar from "@/components/Navbar";

const STATUS_MAP = {
  "Open":        { bg: "#EFF6FF", color: "#1A3A8F", border: "#C8D8EE",  icon: "🔵" },
  "On Progress": { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A",  icon: "🟡" },
  "Resolved":    { bg: "#DCFCE7", color: "#15803D", border: "#BBF7D0",  icon: "🟢" },
  "Closed":      { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1",  icon: "⚫" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP["Open"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 999,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: 12, fontWeight: 700,
    }}>{s.icon} {status}</span>
  );
};

const LandingPage = () => {
  const router = useRouter();
  const [division, setDivision]     = useState("");
  const [message, setMessage]       = useState("");
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(null);
  const [ticketId, setTicketId]     = useState("");
  const [mounted, setMounted]       = useState(false);

  useEffect(() => {
    setTicketId(generateTicketId());
    setMounted(true);
  }, []);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async () => {
    if (!division || !message.trim()) return;
    if (!email.trim()) { setEmailError("Email wajib diisi"); return; }
    if (!validateEmail(email)) { setEmailError("Format email tidak valid"); return; }
    setEmailError("");
    setSubmitting(true);
    const { sentimen, kategori } = await analyzeText(message);
    const ticket = {
      id: ticketId,
      division,
      message,
      name: name.trim() || "Anonim",
      email: email.trim(),
      status: "Open",
      sentiment: sentimen,
      category: kategori,
      createdAt: new Date().toISOString(),
    };
    // TODO MongoDB: POST /api/tickets
    const existing = JSON.parse(localStorage.getItem("tickets") || "[]");
    localStorage.setItem("tickets", JSON.stringify([ticket, ...existing]));
    setSubmitted(ticket);
    setSubmitting(false);
  };

  // BG pattern
  const bgStyle = {
    minHeight: "100vh",
    background: "var(--bg)",
    backgroundImage: `radial-gradient(circle at 20% 20%, rgba(30,80,162,0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(26,58,143,0.05) 0%, transparent 50%)`,
  };

  // Hero banner with gedung photo
  const HeroBanner = () => (
    <div style={{
      position: "relative", width: "100%", height: 200,
      overflow: "hidden", borderRadius: 20, marginBottom: 28,
    }}>
      {/* Gedung photo */}
      <img
        src="/gedung-bpptik.jpg"
        alt="Gedung BPT BPT Komdigi"
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 60%" }}
      />
      {/* Overlay gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(26,58,143,0.82) 0%, rgba(30,80,162,0.65) 100%)",
      }} />
      {/* Content on top */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 32px", textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 999, padding: "4px 14px",
          fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)",
          marginBottom: 12, letterSpacing: 0.5,
          backdropFilter: "blur(4px)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#60C0FF", display: "inline-block", animation: "pulse-dot 2s infinite" }} />
          Platform Aspirasi Digital · BPT BPT Komdigi BPT Komdigi
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 900, color: "#fff",
          margin: "0 0 8px", lineHeight: 1.2, letterSpacing: -0.3,
          textShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}>
          Sampaikan <span style={{ color: "#60C9EC" }}>Aspirasi</span> Anda
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          Kritik, saran, dan masukan Anda membantu BPT BPT Komdigi berkembang lebih baik
        </p>
      </div>
    </div>
  );

  // ── Sukses ──────────────────────────────────────────────────────────────────
  if (submitted) {
    const div = DIVISIONS.find((d) => d.id === submitted.division);
    return (
      <div style={bgStyle}>
        <Navbar />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>
          <div className="fade-up" style={{
            background: "#fff", borderRadius: 20, overflow: "hidden",
            boxShadow: "0 4px 32px rgba(26,58,143,0.10)",
            border: "1px solid #C8D8EE",
          }}>
            {/* Header sukses */}
            <div style={{
              background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
              padding: "32px 32px 24px", textAlign: "center",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: "2px solid rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, margin: "0 auto 16px",
              }}>✅</div>
              <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>
                Tiket Berhasil Dikirim!
              </h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, margin: 0 }}>
                Terima kasih atas aspirasi Anda
              </p>
            </div>

            {/* Detail tiket */}
            <div style={{ padding: "24px 32px 32px" }}>
              <div style={{
                background: "#F8FAFF", borderRadius: 12, padding: "6px 0",
                border: "1px solid #C8D8EE", marginBottom: 24,
              }}>
                {[
                  ["Nomor Tiket", submitted.id],
                  ["Divisi", `${div?.icon} ${div?.label}`],
                  ["Tanggal", formatDate(submitted.createdAt)],
                  ["Email", submitted.email],
                ].map(([label, val], i) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 20px",
                    borderBottom: i < 3 ? "1px solid #C8D8EE" : "none",
                  }}>
                    <span style={{ fontSize: 13, color: "var(--gray)", fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 13, color: "#0F2744", fontWeight: 700, fontFamily: i === 0 ? "monospace" : "inherit" }}>{val}</span>
                  </div>
                ))}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 20px", borderBottom: "1px solid #C8D8EE",
                }}>
                  <span style={{ fontSize: 13, color: "var(--gray)", fontWeight: 500 }}>Sentimen</span>
                  <SentimentBadge sentiment={submitted.sentiment} />
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 20px", borderBottom: "1px solid #C8D8EE",
                }}>
                  <span style={{ fontSize: 13, color: "var(--gray)", fontWeight: 500 }}>Kategori</span>
                  <CategoryBadge category={submitted.category} />
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 20px",
                }}>
                  <span style={{ fontSize: 13, color: "var(--gray)", fontWeight: 500 }}>Status</span>
                  <StatusBadge status={submitted.status} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => router.push("/dashboard")} style={{
                  flex: 1, padding: "13px", borderRadius: 10,
                  border: "2px solid #C8D8EE", background: "#fff",
                  color: "#0F2744", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  📊 Lihat Dashboard
                </button>
                <button onClick={() => window.location.reload()} style={{
                  flex: 1, padding: "13px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
                  color: "#fff", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  ✏️ Kirim Tiket Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div style={bgStyle}>
      <Navbar />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Hero Banner dengan foto gedung */}
        <div className="fade-up">
          <HeroBanner />
        </div>

        {/* Ticket ID preview */}
        <div className="fade-up-1" style={{
          background: "linear-gradient(135deg, #1A3A8F 0%, #1E50A2 60%, #29ABE2 100%)",
          borderRadius: 16, padding: "18px 24px", marginBottom: 24,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 4px 24px rgba(26,58,143,0.2)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", right: 40, bottom: -30, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
              Nomor Tiket Anda
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "monospace", letterSpacing: 2 }}>
              {mounted ? ticketId : "TKT-••••••••-••••"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
              Tanggal
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
              {mounted ? formatDate(new Date()) : "—"}
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="fade-up-2" style={{
          background: "#fff", borderRadius: 20, padding: 32,
          boxShadow: "0 2px 24px rgba(26,58,143,0.08)",
          border: "1px solid #C8D8EE",
          display: "flex", flexDirection: "column", gap: 24,
        }}>

          {/* Nama */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#0F2744", letterSpacing: 0.2 }}>
              Nama <span style={{ color: "var(--gray)", fontWeight: 500 }}>(opsional)</span>
            </label>
            <input
              style={{
                padding: "11px 14px", borderRadius: 10,
                border: "1.5px solid #C8D8EE", outline: "none",
                fontSize: 14, color: "#0F2744", fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              placeholder="Nama Anda, atau kosongkan untuk anonim"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = "#1E50A2"}
              onBlur={(e) => e.target.style.borderColor = "#C8D8EE"}
            />
          </div>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#0F2744", letterSpacing: 0.2 }}>
              Email <span style={{ color: "#C0272D" }}>*</span>
            </label>
            <input
              type="email"
              style={{
                padding: "11px 14px", borderRadius: 10,
                border: emailError ? "1.5px solid #C0272D" : "1.5px solid #C8D8EE",
                outline: "none", fontSize: 14, color: "#0F2744", fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              placeholder="email@contoh.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              onFocus={(e) => e.target.style.borderColor = "#1E50A2"}
              onBlur={(e) => e.target.style.borderColor = emailError ? "#C0272D" : "#C8D8EE"}
            />
            {emailError && (
              <span style={{ fontSize: 12, color: "#C0272D", fontWeight: 600 }}>⚠ {emailError}</span>
            )}
          </div>

          {/* Divisi */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#0F2744", letterSpacing: 0.2 }}>
              Divisi <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {DIVISIONS.map((d) => {
                const active = division === d.id;
                return (
                  <button key={d.id} onClick={() => setDivision(d.id)} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                    border: active ? `2px solid ${d.color}` : "2px solid #C8D8EE",
                    background: active ? d.bg : "#fff",
                    color: active ? d.color : "#374151",
                    fontFamily: "inherit", transition: "all 0.15s",
                    boxShadow: active ? `0 0 0 3px ${d.color}22` : "none",
                  }}>
                    <span style={{ fontSize: 22 }}>{d.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{d.label}</span>
                    {active && <span style={{ marginLeft: "auto", fontSize: 16 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pesan */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#0F2744", letterSpacing: 0.2 }}>
              Pesan / Aspirasi <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <textarea
              rows={5}
              maxLength={1000}
              placeholder="Tuliskan kritik, saran, atau komentar Anda di sini..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = "#1E50A2"}
              onBlur={(e) => e.target.style.borderColor = "#C8D8EE"}
              style={{
                padding: "12px 14px", borderRadius: 10,
                border: "1.5px solid #C8D8EE", outline: "none",
                fontSize: 14, color: "#0F2744", resize: "vertical",
                fontFamily: "inherit", lineHeight: 1.7, transition: "border-color 0.15s",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{
                display: "flex", gap: 8, fontSize: 12, color: "var(--gray)",
              }}>
                {["Kritik 🔴", "Saran 💡", "Komentar 💬"].map((t) => (
                  <span key={t} style={{
                    background: "#F1F5F9", borderRadius: 999, padding: "2px 8px", fontWeight: 500,
                  }}>{t}</span>
                ))}
              </div>
              <span style={{ fontSize: 12, color: message.length > 900 ? "#DC2626" : "var(--gray)" }}>
                {message.length}/1000
              </span>
            </div>
          </div>

          {/* AI info */}
          <div style={{
            display: "flex", gap: 12, alignItems: "flex-start",
            background: "#EBF4FB", borderRadius: 10, padding: "14px 16px",
            border: "1px solid #C8D8EE",
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🤖</span>
            <div style={{ fontSize: 13, color: "#1A3A8F", lineHeight: 1.7 }}>
              <strong>Analisis AI Otomatis</strong> — Pesan Anda akan dianalisis menggunakan model ML
              untuk mendeteksi <strong>sentimen</strong> dan <strong>kategori</strong> secara otomatis.
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!division || !message.trim() || submitting}
            style={{
              padding: "15px", borderRadius: 12, border: "none",
              background: !division || !message.trim() || submitting
                ? "#CBD5E1"
                : "linear-gradient(135deg, #1A3A8F, #1E50A2)",
              color: "#fff", fontWeight: 800, fontSize: 15,
              cursor: !division || !message.trim() || submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit", letterSpacing: 0.3,
              boxShadow: !division || !message.trim() || submitting
                ? "none" : "0 4px 16px rgba(30,80,162,0.3)",
              transition: "all 0.2s",
            }}
          >
            {submitting ? "🤖 Menganalisis & Mengirim..." : "🚀 Kirim Aspirasi"}
          </button>
        </div>

        {/* Footer */}
        <div className="fade-up-3" style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "var(--gray)" }}>
          © 2026 BPT BPT Komdigi · Kementerian Komunikasi dan Digital Republik Indonesia
        </div>
      </div>
    </div>
  );
};

export default LandingPage;