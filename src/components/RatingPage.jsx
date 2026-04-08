"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DIVISIONS from "@/constants/divisions";
import formatDate from "@/utils/formatDate";
import Navbar from "@/components/Navbar";

const STARS = [1, 2, 3, 4, 5];

const STAR_LABELS = {
  1: "Sangat Tidak Puas",
  2: "Tidak Puas",
  3: "Cukup",
  4: "Puas",
  5: "Sangat Puas",
};

const STAR_COLORS = {
  1: "#C0272D",
  2: "#E07B39",
  3: "#F7C200",
  4: "#29ABE2",
  5: "#15803D",
};

const RatingPage = ({ ticketId }) => {
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [notEligible, setNotEligible] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // TODO MongoDB: GET /api/tickets/:id
    const stored = JSON.parse(localStorage.getItem("tickets") || "[]");
    const found = stored.find(t => t.id === ticketId);

    if (!found) { setNotFound(true); return; }
    if (!["Resolved", "Closed"].includes(found.status)) { setNotEligible(true); setTicket(found); return; }

    // Cek sudah pernah rating belum
    const ratings = JSON.parse(localStorage.getItem("ratings") || "[]");
    const existing = ratings.find(r => r.ticketId === ticketId);
    if (existing) { setAlreadyRated(true); setTicket(found); return; }

    setTicket(found);
  }, [ticketId]);

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);

    // TODO MongoDB: POST /api/tickets/:id/rating
    await new Promise(r => setTimeout(r, 700));
    const ratingData = {
      ticketId,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("ratings") || "[]");
    localStorage.setItem("ratings", JSON.stringify([ratingData, ...existing]));

    setSubmitting(false);
    setSubmitted(true);
  };

  const div = ticket ? DIVISIONS.find(d => d.id === ticket.division) : null;
  const activeColor = STAR_COLORS[hover || rating] || "#F7C200";

  const bgStyle = {
    minHeight: "100vh",
    background: "var(--bg)",
    backgroundImage: `radial-gradient(circle at 20% 20%, rgba(30,80,162,0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(26,58,143,0.05) 0%, transparent 50%)`,
  };

  // ── Loading
  if (!mounted) return <div style={bgStyle}><Navbar /></div>;

  // ── Not found
  if (notFound) return (
    <div style={bgStyle}>
      <Navbar />
      <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
        <h2 style={{ color: "#0F1F4B", fontWeight: 900, marginBottom: 8 }}>Tiket Tidak Ditemukan</h2>
        <p style={{ color: "#5A6E8C", marginBottom: 24 }}>Nomor tiket <strong>{ticketId}</strong> tidak ditemukan di sistem.</p>
        <button onClick={() => router.push("/track")} style={{
          padding: "11px 24px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
          color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>Lacak Tiket</button>
      </div>
    </div>
  );

  // ── Not eligible
  if (notEligible) return (
    <div style={bgStyle}>
      <Navbar />
      <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
        <h2 style={{ color: "#0F1F4B", fontWeight: 900, marginBottom: 8 }}>Belum Bisa Memberi Rating</h2>
        <p style={{ color: "#5A6E8C", marginBottom: 8 }}>
          Rating hanya tersedia setelah tiket berstatus <strong>Resolved</strong> atau <strong>Closed</strong>.
        </p>
        <p style={{ color: "#5A6E8C", marginBottom: 24 }}>
          Status tiket Anda saat ini: <strong style={{ color: "#1A3A8F" }}>{ticket?.status}</strong>
        </p>
        <button onClick={() => router.push(`/track`)} style={{
          padding: "11px 24px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
          color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>← Kembali</button>
      </div>
    </div>
  );

  // ── Already rated
  if (alreadyRated) return (
    <div style={bgStyle}>
      <Navbar />
      <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: "#0F1F4B", fontWeight: 900, marginBottom: 8 }}>Sudah Memberi Rating</h2>
        <p style={{ color: "#5A6E8C", marginBottom: 24 }}>Anda sudah memberikan rating untuk tiket ini sebelumnya. Terima kasih!</p>
        <button onClick={() => router.push("/")} style={{
          padding: "11px 24px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
          color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>← Beranda</button>
      </div>
    </div>
  );

  // ── Success
  if (submitted) return (
    <div style={bgStyle}>
      <Navbar />
      <div style={{ maxWidth: 480, margin: "60px auto", padding: "0 24px" }}>
        <div className="fade-up" style={{
          background: "#fff", borderRadius: 20, overflow: "hidden",
          boxShadow: "0 4px 32px rgba(26,58,143,0.10)", border: "1px solid #C8D8EE",
        }}>
          <div style={{
            background: "linear-gradient(135deg, #15803D, #16a34a)",
            padding: "32px", textAlign: "center",
          }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <h2 style={{ color: "#fff", fontWeight: 900, fontSize: 22, margin: "0 0 6px" }}>
              Terima Kasih!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.75)", margin: 0, fontSize: 14 }}>
              Rating Anda telah berhasil dikirim
            </p>
          </div>
          <div style={{ padding: "28px 32px", textAlign: "center" }}>
            {/* Stars display */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
              {STARS.map(s => (
                <span key={s} style={{ fontSize: 36, color: s <= rating ? STAR_COLORS[rating] : "#E2E8F0" }}>★</span>
              ))}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: STAR_COLORS[rating], marginBottom: 6 }}>
              {STAR_LABELS[rating]}
            </div>
            {comment && (
              <div style={{
                marginTop: 16, padding: "12px 16px", background: "#F8FAFF",
                borderRadius: 10, border: "1px solid #C8D8EE",
                fontSize: 13, color: "#374151", lineHeight: 1.7, textAlign: "left"
              }}>
                "{comment}"
              </div>
            )}
            <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => router.push("/")} style={{
                padding: "10px 22px", borderRadius: 9, border: "none",
                background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
                color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13,
              }}>← Beranda</button>
              <button onClick={() => router.push("/track")} style={{
                padding: "10px 22px", borderRadius: 9,
                border: "1.5px solid #C8D8EE", background: "#fff",
                color: "#1A3A8F", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13,
              }}>Lacak Tiket</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Main rating form
  return (
    <div style={bgStyle}>
      <Navbar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#E8EEF8", color: "#1A3A8F", border: "1px solid #C8D8EE",
            borderRadius: 999, padding: "5px 16px", fontSize: 12, fontWeight: 700,
            marginBottom: 16, letterSpacing: 0.3,
          }}>
            ⭐ Penilaian Layanan
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0F1F4B", margin: "0 0 8px", letterSpacing: -0.3 }}>
            Bagaimana Layanan <span style={{
              background: "linear-gradient(135deg, #1A3A8F, #29ABE2)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Kami?</span>
          </h1>
          <p style={{ color: "#5A6E8C", fontSize: 14, margin: 0 }}>
            Penilaian Anda membantu BPT Komdigi terus berkembang
          </p>
        </div>

        {/* Ticket info card */}
        <div className="fade-up-1" style={{
          background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
          borderRadius: 16, padding: "16px 22px", marginBottom: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 4px 20px rgba(26,58,143,0.2)",
        }}>
          <div>
            <div style={{
              fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700,
              letterSpacing: 1, textTransform: "uppercase", marginBottom: 4
            }}>Nomor Tiket</div>
            <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>
              {ticket.id}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 11, background: "#DCFCE7", color: "#15803D",
              border: "1px solid #BBF7D0", borderRadius: 999, padding: "3px 12px",
              fontWeight: 700, marginBottom: 4
            }}>
              {ticket.status === "Resolved" ? "🟢 Resolved" : "⚫ Closed"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              {div?.icon} {div?.label}
            </div>
          </div>
        </div>

        {/* Rating card */}
        <div className="fade-up-2" style={{
          background: "#fff", borderRadius: 20, padding: "28px 32px",
          boxShadow: "0 2px 24px rgba(26,58,143,0.08)",
          border: "1px solid #C8D8EE",
        }}>

          {/* Stars */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1F4B", marginBottom: 16 }}>
              Berikan penilaian Anda
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 10 }}>
              {STARS.map(s => (
                <button key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: 4,
                    fontSize: s <= (hover || rating) ? 46 : 40,
                    color: s <= (hover || rating) ? (STAR_COLORS[hover || rating]) : "#E2E8F0",
                    transition: "all 0.15s", transform: s <= (hover || rating) ? "scale(1.1)" : "scale(1)",
                    filter: s <= (hover || rating) ? "drop-shadow(0 2px 6px rgba(0,0,0,0.15))" : "none",
                  }}>★</button>
              ))}
            </div>
            {(hover || rating) > 0 && (
              <div style={{
                fontSize: 14, fontWeight: 800,
                color: STAR_COLORS[hover || rating],
                transition: "color 0.15s",
              }}>
                {STAR_LABELS[hover || rating]}
              </div>
            )}
            {!hover && !rating && (
              <div style={{ fontSize: 13, color: "#94A3B8" }}>Klik bintang untuk memberi nilai</div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#C8D8EE", margin: "0 0 24px" }} />

          {/* Comment */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#0F1F4B", display: "block", marginBottom: 8 }}>
              Komentar <span style={{ color: "#5A6E8C", fontWeight: 500 }}>(opsional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Ceritakan pengalaman Anda dengan layanan BPT Komdigi..."
              rows={4}
              style={{
                width: "100%", padding: "11px 14px", borderRadius: 10,
                border: "1.5px solid #C8D8EE", outline: "none",
                fontSize: 13, fontFamily: "inherit", color: "#0F1F4B",
                resize: "vertical", lineHeight: 1.7, boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = "#1E50A2"}
              onBlur={e => e.target.style.borderColor = "#C8D8EE"}
            />
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, textAlign: "right" }}>
              {comment.length}/500 karakter
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!rating || submitting}
            style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none",
              background: !rating ? "#C8D8EE" : submitting ? "#C8D8EE" :
                `linear-gradient(135deg, ${activeColor}, ${activeColor}CC)`,
              color: !rating ? "#94A3B8" : "#fff",
              fontWeight: 800, fontSize: 15, cursor: !rating ? "not-allowed" : "pointer",
              fontFamily: "inherit", letterSpacing: 0.2,
              boxShadow: rating && !submitting ? `0 4px 16px ${activeColor}44` : "none",
              transition: "all 0.2s",
            }}>
            {submitting ? "⏳ Mengirim..." : !rating ? "Pilih bintang terlebih dahulu" : `⭐ Kirim Penilaian — ${STAR_LABELS[rating]}`}
          </button>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => router.push("/")} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "#5A6E8C", fontFamily: "inherit", fontWeight: 600,
            }}>← Lewati, kembali ke beranda</button>
          </div>
        </div>

        <div className="fade-up-3" style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "#94A3B8" }}>
          © 2026 BPT Komdigi · Kementerian Komunikasi dan Digital RI
        </div>
      </div>
    </div>
  );
};

export default RatingPage;