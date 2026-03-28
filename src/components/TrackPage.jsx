"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import DIVISIONS from "@/constants/divisions";
import formatDate from "@/utils/formatDate";

const STATUS_MAP = {
  Open: {
    bg: "#EFF6FF",
    color: "#1A3A8F",
    border: "#C8D8EE",
    icon: "🔵",
    desc: "Tiket telah diterima dan menunggu ditindaklanjuti",
  },
  "On Progress": {
    bg: "#FFFBEB",
    color: "#92400E",
    border: "#FDE68A",
    icon: "🟡",
    desc: "Tiket sedang dalam proses penanganan",
  },
  Resolved: {
    bg: "#DCFCE7",
    color: "#15803D",
    border: "#BBF7D0",
    icon: "🟢",
    desc: "Tiket telah diselesaikan",
  },
  Closed: {
    bg: "#F1F5F9",
    color: "#475569",
    border: "#CBD5E1",
    icon: "⚫",
    desc: "Tiket telah ditutup",
  },
};

const STATUS_CONFIG = {
  SUBMITTED: {
    label: "Open",
    step: 0,
  },
  ASSIGNED: {
    label: "On Progress",
    step: 1,
  },
  IN_PROGRESS: {
    label: "On Progress",
    step: 1,
  },
  RESOLVED: {
    label: "Resolved",
    step: 2,
  },
  CLOSED: {
    label: "Closed",
    step: 3,
  },
};

const STEP_CONFIG = [
  {
    key: "SUBMITTED",
    label: "Submitted",
    bg: "#EFF6FF",
    color: "#1A3A8F",
    border: "#C8D8EE",
    icon: "🔵",
  },
  {
    key: "ASSIGNED",
    label: "Assigned",
    bg: "#E0F2FE",
    color: "#0369A1",
    border: "#BAE6FD",
    icon: "📌",
  },
  {
    key: "IN_PROGRESS",
    label: "In Progress",
    bg: "#FFFBEB",
    color: "#92400E",
    border: "#FDE68A",
    icon: "🟡",
  },
  {
    key: "RESOLVED",
    label: "Resolved",
    bg: "#DCFCE7",
    color: "#15803D",
    border: "#BBF7D0",
    icon: "🟢",
  },
  {
    key: "CLOSED",
    label: "Closed",
    bg: "#F1F5F9",
    color: "#475569",
    border: "#CBD5E1",
    icon: "⚫",
  },
];

const STEPS = ["Open", "On Progress", "Resolved", "Closed"];

const StatusBadge = ({ status }) => {
  const s = STEP_CONFIG.find((x) => x.key === status);

  if (!s) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 14px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {s.icon} {s.label}
    </span>
  );
};

const TrackPage = () => {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [tanggapan, setTanggapan] = useState("");
  const [tanggapanSent, setTanggapanSent] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleTrack = async () => {
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: trimmed }),
      });

      if (res.status === 429) {
        setError("⚠️ Maksimal 5 pencarian per menit");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setResult(data.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk mendapatkan data status yang aman
  const statusConfig = result ? STATUS_CONFIG[result.status] : null;

  if (result && !statusConfig) {
    console.error("UNKNOWN STATUS FROM API:", result.status);
  }

  const currentStatusData = statusConfig;
  const currentStep = result
    ? STEP_CONFIG.findIndex((s) => s.key === result.status)
    : -1;
  const div = result?.service;

  const bgStyle = {
    minHeight: "100vh",
    background: "var(--bg)",
    backgroundImage: `radial-gradient(circle at 20% 20%, rgba(30,80,162,0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(26,58,143,0.05) 0%, transparent 50%)`,
  };

  const submitRating = async () => {
    if (!rating) {
      showToast("Rating wajib diisi", "error");
      return;
    }

    try {
      console.log("SUBMIT RATING:", {
        ticketNumber: result.ticketNumber,
        rating,
        tanggapan,
      });

      const res = await fetch(`/api/tickets/${result.ticketNumber}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: tanggapan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("API ERROR:", data);
        throw new Error(data.message);
      }

      setTanggapanSent(true);
      showToast("✅ Feedback berhasil dikirim!");
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      showToast(err.message, "error");
    }
  };

  return (
    <div style={bgStyle}>
      <Navbar />
      <div
        style={{ maxWidth: 620, margin: "0 auto", padding: "48px 24px 80px" }}
      >
        {/* Header */}
        <div
          className="fade-up"
          style={{ textAlign: "center", marginBottom: 32 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#E8EEF8",
              color: "#1A3A8F",
              border: "1px solid #C8D8EE",
              borderRadius: 999,
              padding: "5px 16px",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
              letterSpacing: 0.3,
            }}
          >
            🔍 Lacak Status Tiket
          </div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: "#0F1F4B",
              margin: "0 0 10px",
              lineHeight: 1.2,
              letterSpacing: -0.4,
            }}
          >
            Cek Status{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #1A3A8F, #29ABE2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Aspirasi
            </span>{" "}
            Anda
          </h1>
          <p style={{ color: "#5A6E8C", fontSize: 14, margin: 0 }}>
            Masukkan nomor tiket yang Anda terima saat pengajuan
          </p>
        </div>

        {/* Search box */}
        <div
          className="fade-up-1"
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 2px 24px rgba(26,58,143,0.08)",
            border: "1px solid #C8D8EE",
            marginBottom: 24,
          }}
        >
          <label
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0F1F4B",
              display: "block",
              marginBottom: 10,
            }}
          >
            Nomor Tiket
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 10,
                border: error ? "1.5px solid #C0272D" : "1.5px solid #C8D8EE",
                outline: "none",
                fontSize: 15,
                color: "#0F1F4B",
                fontFamily: "monospace",
                fontWeight: 600,
                letterSpacing: 1,
                transition: "border-color 0.15s",
              }}
              placeholder="TKT-20260308-1234"
              value={input}
              onChange={(e) => {
                setInput(e.target.value.toUpperCase());
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            />
            <button
              onClick={handleTrack}
              disabled={loading}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                background: loading
                  ? "#C8D8EE"
                  : "linear-gradient(135deg, #1A3A8F, #1E50A2)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                minWidth: 100,
              }}
            >
              {loading ? "⏳ Mencari..." : "🔍 Lacak"}
            </button>
          </div>
          {error && (
            <div
              style={{
                marginTop: 10,
                padding: "10px 14px",
                borderRadius: 8,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#C0272D",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div
            className="fade-up"
            style={{
              background: "#fff",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 4px 32px rgba(26,58,143,0.10)",
              border: "1px solid #C8D8EE",
            }}
          >
            {/* Result header */}
            <div
              style={{
                background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
                padding: "20px 28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.6)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Nomor Tiket
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#fff",
                    fontFamily: "monospace",
                  }}
                >
                  {result.ticketNumber}
                </div>
              </div>
              <StatusBadge status={result.status} />
            </div>

            {/* Progress tracker */}
            <div
              style={{
                padding: "24px 28px",
                borderBottom: "1px solid #C8D8EE",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#5A6E8C",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Progress Tiket
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {STEP_CONFIG.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;

                  return (
                    <div
                      key={step.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flex: i < STEP_CONFIG.length - 1 ? 1 : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: done ? step.bg : "#F1F5F9",
                            border: active
                              ? `2.5px solid ${step.color}`
                              : done
                                ? `2px solid ${step.border}`
                                : "2px solid #E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {done ? step.icon : "○"}
                        </div>

                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: active ? 800 : 500,
                            color: done ? step.color : "#94A3B8",
                          }}
                        >
                          {step.label}
                        </div>
                      </div>

                      {i < STEP_CONFIG.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            height: 2,
                            margin: "0 6px",
                            marginBottom: 22,
                            background: i < currentStep ? "#1A3A8F" : "#E2E8F0",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Status description */}
              <div
                style={{
                  marginTop: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: currentStatusData.bg,
                  border: `1px solid ${currentStatusData.border}`,
                  color: currentStatusData.color,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {currentStatusData.icon} {currentStatusData.desc}
              </div>
            </div>

            {/* Ticket details */}
            <div style={{ padding: "20px 28px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid #C8D8EE",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {[
                  ["Nama", result.name],
                  ["Email", result.email || "-"],
                  ["Divisi", div?.name || "-"],
                  ["Tanggal", formatDate(result.createdAt)],
                ].map(([label, val], i, arr) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "11px 16px",
                      borderBottom:
                        i < arr.length - 1 ? "1px solid #C8D8EE" : "none",
                      background: i % 2 === 0 ? "#F8FAFF" : "#fff",
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#5A6E8C" }}>
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#0F1F4B",
                        fontWeight: 700,
                      }}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#5A6E8C",
                    marginBottom: 8,
                  }}
                >
                  Pesan
                </div>
                <div
                  style={{
                    background: "#F8FAFF",
                    borderRadius: 10,
                    padding: "14px 16px",
                    border: "1px solid #C8D8EE",
                    fontSize: 14,
                  }}
                >
                  {result.message}
                </div>
              </div>
            </div>

            {/* Tanggapan User Section */}
            {result.status === "RESOLVED" && !result.rating && (
              <div
                style={{
                  padding: "20px 28px",
                  borderTop: "1px solid #C8D8EE",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#5A6E8C",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Beri Penilaian
                </div>

                {tanggapanSent ? (
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "#DCFCE7",
                      color: "#15803D",
                      borderRadius: 10,
                      fontSize: 13,
                    }}
                  >
                    ✅ Terima kasih! Penilaian Anda telah dikirim.
                  </div>
                ) : (
                  <div>
                    {/* ⭐ STAR RATING */}
                    <div style={{ marginBottom: 12 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          onClick={() => setRating(star)}
                          style={{
                            fontSize: 26,
                            cursor: "pointer",
                            color: star <= rating ? "#F7C200" : "#CBD5E1",
                            transition: "0.2s",
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>

                    {/* TEXTAREA */}
                    <textarea
                      value={tanggapan}
                      onChange={(e) => setTanggapan(e.target.value)}
                      placeholder="Tulis tanggapan (opsional)..."
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 10,
                        border: "1.5px solid #C8D8EE",
                        minHeight: 80,
                      }}
                    />

                    {/* BUTTON */}
                    <button
                      onClick={submitRating}
                      style={{
                        marginTop: 12,
                        padding: "8px 18px",
                        background: "#1A3A8F",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      Kirim Penilaian
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            fontSize: 12,
            color: "#94A3B8",
          }}
        >
          © 2026 BPT Komdigi · Kementerian Komunikasi dan Digital RI
        </div>
      </div>
    </div>
  );
};

export default TrackPage;
