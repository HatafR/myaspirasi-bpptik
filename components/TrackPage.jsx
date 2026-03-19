"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import DIVISIONS from "@/constants/divisions";
import formatDate from "@/utils/formatDate";

const STATUS_MAP = {
  "Open":        { bg: "#EFF6FF", color: "#1A3A8F", border: "#C8D8EE", icon: "🔵", desc: "Tiket telah diterima dan menunggu ditindaklanjuti" },
  "On Progress": { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A", icon: "🟡", desc: "Tiket sedang dalam proses penanganan" },
  "Resolved":    { bg: "#DCFCE7", color: "#15803D", border: "#BBF7D0", icon: "🟢", desc: "Tiket telah diselesaikan" },
  "Closed":      { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1", icon: "⚫", desc: "Tiket telah ditutup" },
};

const STEPS = ["Open", "On Progress", "Resolved", "Closed"];

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP["Open"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 14px", borderRadius: 999,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: 13, fontWeight: 700,
    }}>{s.icon} {status}</span>
  );
};

const TrackPage = () => {
  const router = useRouter();
  const [input, setInput]     = useState("");
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [tanggapan, setTanggapan] = useState("");
  const [tanggapanSent, setTanggapanSent] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleTrack = () => {
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) { setError("Masukkan nomor tiket terlebih dahulu"); return; }
    if (!trimmed.startsWith("TKT-")) { setError("Format nomor tiket tidak valid. Contoh: TKT-20260308-1234"); return; }

    setLoading(true);
    setError("");
    setResult(null);

    // TODO MongoDB: fetch GET /api/tickets/:id
    setTimeout(() => {
      const stored = JSON.parse(localStorage.getItem("tickets") || "[]");
      const found = stored.find((t) => t.id.toUpperCase() === trimmed);
      if (found) {
        // Cek auto-close: jika Resolved lebih dari 3 hari tanpa tanggapan
        const tanggapanList = JSON.parse(localStorage.getItem("tanggapan") || "[]");
        const hasTanggapan = tanggapanList.some(t => t.ticketId === found.id);
        
        if (found.status === "Resolved" && !hasTanggapan) {
          const resolvedHistory = JSON.parse(localStorage.getItem("ticket_history") || "[]")
            .filter(h => h.ticketId === found.id && h.status === "Resolved");
          
          if (resolvedHistory.length > 0) {
            const resolvedAt = new Date(resolvedHistory[0].changedAt);
            const daysSince = (Date.now() - resolvedAt.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSince > 3) {
              // Auto-close
              const stored2 = JSON.parse(localStorage.getItem("tickets") || "[]");
              const updated2 = stored2.map(t => t.id === found.id ? { ...t, status: "Closed" } : t);
              localStorage.setItem("tickets", JSON.stringify(updated2));
              found.status = "Closed";
            }
          }
        }

        const alreadyTanggapan = tanggapanList.some(t => t.ticketId === found.id);
        setTanggapanSent(alreadyTanggapan);
        setResult(found);
      } else {
        setError("Nomor tiket tidak ditemukan. Periksa kembali nomor tiket Anda.");
      }
      setLoading(false);
    }, 800);
  };

  const currentStep = result ? STEPS.indexOf(result.status || "Open") : -1;
  const div = result ? DIVISIONS.find((d) => d.id === result.division) : null;

  const bgStyle = {
    minHeight: "100vh",
    background: "var(--bg)",
    backgroundImage: `radial-gradient(circle at 20% 20%, rgba(30,80,162,0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(26,58,143,0.05) 0%, transparent 50%)`,
  };

  return (
    <div style={bgStyle}>
      <Navbar />
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#E8EEF8", color: "#1A3A8F",
            border: "1px solid #C8D8EE", borderRadius: 999,
            padding: "5px 16px", fontSize: 12, fontWeight: 700,
            marginBottom: 16, letterSpacing: 0.3,
          }}>
            🔍 Lacak Status Tiket
          </div>
          <h1 style={{
            fontSize: 30, fontWeight: 900, color: "#0F1F4B",
            margin: "0 0 10px", lineHeight: 1.2, letterSpacing: -0.4,
          }}>
            Cek Status <span style={{
              background: "linear-gradient(135deg, #1A3A8F, #29ABE2)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Aspirasi</span> Anda
          </h1>
          <p style={{ color: "#5A6E8C", fontSize: 14, margin: 0 }}>
            Masukkan nomor tiket yang Anda terima saat pengajuan
          </p>
        </div>

        {/* Search box */}
        <div className="fade-up-1" style={{
          background: "#fff", borderRadius: 20, padding: 28,
          boxShadow: "0 2px 24px rgba(26,58,143,0.08)",
          border: "1px solid #C8D8EE", marginBottom: 24,
        }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#0F1F4B", display: "block", marginBottom: 10 }}>
            Nomor Tiket
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 10,
                border: error ? "1.5px solid #C0272D" : "1.5px solid #C8D8EE",
                outline: "none", fontSize: 15, color: "#0F1F4B",
                fontFamily: "monospace", fontWeight: 600, letterSpacing: 1,
                transition: "border-color 0.15s",
              }}
              placeholder="TKT-20260308-1234"
              value={input}
              onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              onFocus={(e) => e.target.style.borderColor = "#1E50A2"}
              onBlur={(e) => e.target.style.borderColor = error ? "#C0272D" : "#C8D8EE"}
            />
            <button onClick={handleTrack} disabled={loading} style={{
              padding: "12px 24px", borderRadius: 10, border: "none",
              background: loading ? "#C8D8EE" : "linear-gradient(135deg, #1A3A8F, #1E50A2)",
              color: "#fff", fontWeight: 700, fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
              whiteSpace: "nowrap", minWidth: 100,
            }}>
              {loading ? "⏳ Mencari..." : "🔍 Lacak"}
            </button>
          </div>
          {error && (
            <div style={{
              marginTop: 10, padding: "10px 14px", borderRadius: 8,
              background: "#FEF2F2", border: "1px solid #FECACA",
              color: "#C0272D", fontSize: 13, fontWeight: 600,
            }}>
              ⚠ {error}
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 12, color: "#94A3B8" }}>
            💡 Nomor tiket dapat ditemukan di halaman konfirmasi saat pengajuan
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="fade-up" style={{
            background: "#fff", borderRadius: 20, overflow: "hidden",
            boxShadow: "0 4px 32px rgba(26,58,143,0.10)",
            border: "1px solid #C8D8EE",
          }}>
            {/* Result header */}
            <div style={{
              background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
              padding: "20px 28px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  Nomor Tiket
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "monospace", letterSpacing: 1.5 }}>
                  {result.id}
                </div>
              </div>
              <StatusBadge status={result.status || "Open"} />
            </div>

            {/* Progress tracker */}
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #C8D8EE" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#5A6E8C", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
                Progress Tiket
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {STEPS.map((step, i) => {
                  const done    = i <= currentStep;
                  const active  = i === currentStep;
                  const s       = STATUS_MAP[step];
                  return (
                    <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                      {/* Step circle */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: done ? s.bg : "#F1F5F9",
                          border: active ? `2.5px solid ${s.color}` : done ? `2px solid ${s.border}` : "2px solid #E2E8F0",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16,
                          boxShadow: active ? `0 0 0 4px ${s.bg}` : "none",
                          transition: "all 0.3s",
                        }}>
                          {done ? s.icon : "○"}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: active ? 800 : 500, color: done ? s.color : "#94A3B8", textAlign: "center", whiteSpace: "nowrap" }}>
                          {step}
                        </div>
                      </div>
                      {/* Connector line */}
                      {i < STEPS.length - 1 && (
                        <div style={{
                          flex: 1, height: 2, margin: "0 6px", marginBottom: 22,
                          background: i < currentStep ? "#1A3A8F" : "#E2E8F0",
                          transition: "background 0.3s",
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Status description */}
              <div style={{
                marginTop: 16, padding: "10px 14px", borderRadius: 8,
                background: STATUS_MAP[result.status || "Open"].bg,
                border: `1px solid ${STATUS_MAP[result.status || "Open"].border}`,
                color: STATUS_MAP[result.status || "Open"].color,
                fontSize: 13, fontWeight: 600,
              }}>
                {STATUS_MAP[result.status || "Open"].icon} {STATUS_MAP[result.status || "Open"].desc}
              </div>
            </div>

            {/* Ticket details */}
            <div style={{ padding: "20px 28px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#5A6E8C", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
                Detail Tiket
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: 12, overflow: "hidden", border: "1px solid #C8D8EE" }}>
                {[
                  ["Nama",    result.name],
                  ["Email",   result.email || "-"],
                  ["Divisi",  `${div?.icon || ""} ${div?.label || result.division}`],
                  ["Tanggal", formatDate(result.createdAt)],
                ].map(([label, val], i, arr) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "11px 16px",
                    borderBottom: i < arr.length - 1 ? "1px solid #C8D8EE" : "none",
                    background: i % 2 === 0 ? "#F8FAFF" : "#fff",
                  }}>
                    <span style={{ fontSize: 13, color: "#5A6E8C", fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 13, color: "#0F1F4B", fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Pesan */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#5A6E8C", marginBottom: 8 }}>Pesan</div>
                <div style={{
                  background: "#F8FAFF", borderRadius: 10, padding: "14px 16px",
                  border: "1px solid #C8D8EE", fontSize: 14, color: "#374151",
                  lineHeight: 1.7,
                }}>
                  {result.message}
                </div>
              </div>


            </div>

            {/* Tanggapan User */}
            {result.status === "Resolved" && (() => {
              const history = JSON.parse(localStorage.getItem("ticket_history") || "[]")
                .filter(h => h.ticketId === result.id && h.status === "Resolved");
              const resolvedAt = history.length > 0 ? new Date(history[0].changedAt) : new Date(result.createdAt);
              const daysSince = (Date.now() - resolvedAt.getTime()) / (1000 * 60 * 60 * 24);
              const sisaHari = Math.max(0, Math.ceil(3 - daysSince));
              const expired = daysSince > 3;

              return (
                <div style={{ padding:"20px 28px", borderTop:"1px solid #C8D8EE" }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"#5A6E8C",
                    textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
                    Tanggapan Anda
                  </div>
                  {tanggapanSent ? (
                    <div style={{ padding:"12px 16px", borderRadius:10,
                      background:"#DCFCE7", border:"1px solid #BBF7D0",
                      fontSize:13, color:"#15803D", fontWeight:600 }}>
                      ✅ Tanggapan Anda sudah dikirim. Terima kasih!
                    </div>
                  ) : expired ? (
                    <div style={{ padding:"12px 16px", borderRadius:10,
                      background:"#F1F5F9", border:"1px solid #CBD5E1",
                      fontSize:13, color:"#475569", fontWeight:600 }}>
                      ⏰ Waktu tanggapan sudah habis. Tiket akan otomatis ditutup.
                    </div>
                  ) : (
                    <div>
                      <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:12,
                        background:"#FFFBEB", border:"1px solid #FDE68A",
                        fontSize:12, color:"#92400E", fontWeight:600 }}>
                        ⏳ Anda memiliki <strong>{sisaHari} hari</strong> lagi untuk menanggapi.
                        Jika tidak ada tanggapan, tiket akan otomatis ditutup.
                      </div>
                      <textarea
                        value={tanggapan}
                        onChange={e => setTanggapan(e.target.value)}
                        placeholder="Tuliskan tanggapan Anda terhadap penyelesaian tiket ini..."
                        rows={3}
                        style={{ width:"100%", padding:"11px 14px", borderRadius:10,
                          border:"1.5px solid #C8D8EE", outline:"none",
                          fontSize:13, fontFamily:"inherit", color:"#0F1F4B",
                          resize:"vertical", lineHeight:1.7, boxSizing:"border-box" }}
                        onFocus={e => e.target.style.borderColor = "#1E50A2"}
                        onBlur={e => e.target.style.borderColor = "#C8D8EE"}
                      />
                      <button
                        onClick={() => {
                          if (!tanggapan.trim()) return;
                          const entry = { ticketId: result.id, isi: tanggapan.trim(), createdAt: new Date().toISOString() };
                          const existing = JSON.parse(localStorage.getItem("tanggapan") || "[]");
                          localStorage.setItem("tanggapan", JSON.stringify([entry, ...existing]));
                          setTanggapanSent(true);
                          setTanggapan("");
                          showToast("✅ Tanggapan berhasil dikirim!");
                        }}
                        disabled={!tanggapan.trim()}
                        style={{ marginTop:10, padding:"9px 20px", borderRadius:9, border:"none",
                          background: tanggapan.trim() ? "linear-gradient(135deg, #1A3A8F, #1E50A2)" : "#C8D8EE",
                          color: tanggapan.trim() ? "#fff" : "#94A3B8",
                          fontWeight:700, fontSize:13, cursor: tanggapan.trim() ? "pointer" : "not-allowed",
                          fontFamily:"inherit" }}>
                        📨 Kirim Tanggapan
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Rating CTA */}
            {(result.status === "Resolved" || result.status === "Closed") && (
              <div style={{
                margin: "0 28px 24px", padding: "16px 20px", borderRadius: 12,
                background: "linear-gradient(135deg, #DCFCE7, #F0FDF4)",
                border: "1px solid #BBF7D0",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#15803D", marginBottom: 2 }}>
                    ⭐ Tiket Anda telah selesai!
                  </div>
                  <div style={{ fontSize: 12, color: "#166534" }}>
                    Bagikan penilaian Anda untuk membantu kami berkembang
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/rating/${result.id}`)}
                  style={{
                    padding: "8px 18px", borderRadius: 9, border: "none", flexShrink: 0,
                    background: "linear-gradient(135deg, #15803D, #16a34a)",
                    color: "#fff", fontWeight: 700, fontSize: 12,
                    cursor: "pointer", fontFamily: "inherit",
                    boxShadow: "0 2px 10px rgba(21,128,61,0.3)",
                  }}>
                  Beri Rating →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="fade-up-3" style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: "#94A3B8" }}>
          © 2026 BPT Komdigi · Kementerian Komunikasi dan Digital RI
        </div>
      </div>
    </div>
  );
};

export default TrackPage;