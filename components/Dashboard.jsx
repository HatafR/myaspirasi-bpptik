"use client";

import { useState, useEffect } from "react";
import DIVISIONS from "@/constants/divisions";
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

const DUMMY_TICKETS = [
  { id:"TKT-20250301-5821", division:"it",
    message:"Sistem login sering error dan lambat. Tolong segera diperbaiki.",
    name:"Budi Santoso", email:"budi@bptkomdigi.go.id", status:"On Progress", sentiment:"Negatif", category:"Kritik",
    createdAt: new Date(Date.now()-86400000*2).toISOString() },
  { id:"TKT-20250302-1234", division:"finance",
    message:"Pelayanan keuangan sudah sangat baik dan transparan.",
    name:"Siti Rahayu", email:"siti@bptkomdigi.go.id", status:"Resolved", sentiment:"Positif", category:"Komentar",
    createdAt: new Date(Date.now()-86400000).toISOString() },
  { id:"TKT-20250303-7890", division:"humas",
    message:"Sebaiknya informasi kegiatan kantor disosialisasikan lebih awal.",
    name:"Ahmad Wijaya", email:"ahmad@bptkomdigi.go.id", status:"Open", sentiment:"Netral", category:"Saran",
    createdAt: new Date(Date.now()-3600000*5).toISOString() },
  { id:"TKT-20250304-4567", division:"audit",
    message:"Proses audit tahun ini sangat terorganisir. Apresiasi untuk tim audit!",
    name:"Dewi Lestari", email:"dewi@bptkomdigi.go.id", status:"Closed", sentiment:"Positif", category:"Komentar",
    createdAt: new Date(Date.now()-3600000*2).toISOString() },
  { id:"TKT-20250305-3391", division:"finance",
    message:"Tolong proses reimbursement dipercepat, sudah 2 bulan belum cair.",
    name:"Reza Pratama", email:"reza@bptkomdigi.go.id", status:"Open", sentiment:"Negatif", category:"Kritik",
    createdAt: new Date(Date.now()-3600000).toISOString() },
];

const StatCard = ({ icon, value, label, color, bg }) => (
  <div style={{
    background: "#fff", borderRadius: 16, padding: "20px",
    boxShadow: "0 2px 16px rgba(26,58,143,0.07)",
    border: "1px solid #C8D8EE",
    display: "flex", alignItems: "center", gap: 16,
  }}>
    <div style={{
      width: 52, height: 52, borderRadius: 14, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#5A6E8C", fontWeight: 600, marginTop: 3 }}>{label}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const [tickets, setTickets]     = useState(DUMMY_TICKETS);
  const [activeDiv, setActiveDiv] = useState("all");
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch]       = useState("");
  const [mounted, setMounted]       = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = JSON.parse(localStorage.getItem("tickets") || "[]");
    if (stored.length > 0) setTickets([...stored, ...DUMMY_TICKETS]);
  }, []);

  const count = (fn) => tickets.filter(fn).length;
  const stats = {
    total:    tickets.length,
    positif:  count((t) => t.sentiment === "Positif"),
    netral:   count((t) => t.sentiment === "Netral"),
    negatif:  count((t) => t.sentiment === "Negatif"),
    kritik:   count((t) => t.category === "Kritik"),
    saran:    count((t) => t.category === "Saran"),
    komentar:    count((t) => t.category === "Komentar"),
    open:        count((t) => t.status === "Open"),
    onProgress:  count((t) => t.status === "On Progress"),
    resolved:    count((t) => t.status === "Resolved"),
    closed:      count((t) => t.status === "Closed"),
  };

  const filtered = tickets.filter((t) =>
    (activeDiv === "all" || t.division === activeDiv) &&
    (activeCat === "all" || t.category === activeCat) &&
    (t.message + t.id + t.name).toLowerCase().includes(search.toLowerCase())
  );

  const bgStyle = {
    minHeight: "100vh",
    background: "var(--bg)",
    backgroundImage: `radial-gradient(circle at 20% 10%, rgba(30,80,162,0.05) 0%, transparent 40%)`,
  };

  const sectionTitle = (text) => (
    <div style={{
      fontSize: 14, fontWeight: 800, color: "#1A3A8F",
      textTransform: "uppercase", letterSpacing: 1,
      marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
    }}>
      <div style={{ height: 3, width: 20, background: "#1E50A2", borderRadius: 999 }} />
      {text}
    </div>
  );

  return (
    <div style={bgStyle}>
      <Navbar ticketCount={tickets.length} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1A3A8F", margin: "0 0 4px", letterSpacing: -0.5 }}>
                Dashboard Aspirasi
              </h1>
              <p style={{ color: "#5A6E8C", margin: 0, fontSize: 14 }}>
                Monitoring aspirasi & sentimen BPT BPT Komdigi BPT Komdigi
              </p>
            </div>
            <div style={{
              background: "#fff", borderRadius: 10, padding: "8px 16px",
              border: "1px solid #C8D8EE", fontSize: 13, color: "#5A6E8C", fontWeight: 600,
            }}>
              📅 {mounted ? new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </div>
          </div>
        </div>

        {/* Sentimen stats */}
        {sectionTitle("Analisis Sentimen")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          <StatCard icon="🎫" value={stats.total}   label="Total Tiket"  color="#1E50A2" bg="#E8EEF8" />
          <StatCard icon="😊" value={stats.positif} label="Positif"      color="#15803D" bg="#DCFCE7" />
          <StatCard icon="😐" value={stats.netral}  label="Netral"       color="#475569" bg="#F1F5F9" />
          <StatCard icon="😠" value={stats.negatif} label="Negatif"      color="#B91C1C" bg="#FEE2E2" />
        </div>

        {/* Kategori stats */}
        {sectionTitle("Analisis Kategori")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { icon:"🔴", value:stats.kritik,   label:"Kritik",   desc:"Keluhan & protes",      color:"#991B1B", bg:"#FEF2F2", border:"#FECACA" },
            { icon:"💡", value:stats.saran,    label:"Saran",    desc:"Usulan perbaikan",       color:"#92400E", bg:"#FFFBEB", border:"#FDE68A" },
            { icon:"💬", value:stats.komentar, label:"Komentar", desc:"Pendapat & apresiasi",   color:"#1A3A8F", bg:"#E8EEF8", border:"#C8D8EE" },
          ].map((item) => (
            <div key={item.label} style={{
              background: "#fff", borderRadius: 16, padding: "20px 24px",
              border: `1px solid ${item.border}`,
              boxShadow: "0 2px 16px rgba(26,58,143,0.06)",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: item.bg,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
              }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2744" }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#5A6E8C" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Status stats */}
        {sectionTitle("Status Tiket")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { icon:"🔵", value:stats.open,       label:"Open",        color:"#1A3A8F", bg:"#EFF6FF" },
            { icon:"🟡", value:stats.onProgress, label:"On Progress", color:"#92400E", bg:"#FFFBEB" },
            { icon:"🟢", value:stats.resolved,   label:"Resolved",    color:"#15803D", bg:"#DCFCE7" },
            { icon:"⚫", value:stats.closed,     label:"Closed",      color:"#475569", bg:"#F1F5F9" },
          ].map((item) => (
            <StatCard key={item.label} icon={item.icon} value={item.value} label={item.label} color={item.color} bg={item.bg} />
          ))}
        </div>

        {/* Per divisi */}
        {sectionTitle("Ringkasan Per Divisi")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 32 }}>
          {DIVISIONS.map((d) => {
            const tot = count((t) => t.division === d.id);
            const pct = stats.total > 0 ? Math.round((tot / stats.total) * 100) : 0;
            return (
              <div key={d.id} style={{
                background: "#fff", borderRadius: 16, padding: "20px 24px",
                border: "1px solid #C8D8EE",
                boxShadow: "0 2px 16px rgba(26,58,143,0.06)",
                borderLeft: `4px solid ${d.color}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{d.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "#1A3A8F" }}>{d.label}</span>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 999,
                    background: d.bg, color: d.color, border: `1px solid ${d.color}33`,
                  }}>{tot} tiket · {pct}%</span>
                </div>
                <div style={{ height: 6, background: "#F1F5F9", borderRadius: 999, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${d.color}, ${d.color}99)`, borderRadius: 999, transition: "width 0.6s" }} />
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { label:"Kritik",   bg:"#FEF2F2", color:"#991B1B" },
                    { label:"Saran",    bg:"#FFFBEB", color:"#92400E" },
                    { label:"Komentar", bg:"#E8EEF8", color:"#1A3A8F" },
                  ].map((c) => (
                    <span key={c.label} style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 999,
                      background: c.bg, color: c.color, fontWeight: 700,
                    }}>
                      {c.label}: {count((t) => t.division === d.id && t.category === c.label)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Daftar tiket */}
        {sectionTitle("Daftar Tiket")}

        {/* Filter & search */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: "16px 20px",
          border: "1px solid #C8D8EE", marginBottom: 16,
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#5A6E8C", minWidth: 60 }}>Divisi:</span>
            {[{ id:"all", label:"Semua", icon:"🗂️" }, ...DIVISIONS].map((d) => (
              <button key={d.id} onClick={() => setActiveDiv(d.id)} style={{
                padding: "6px 14px", borderRadius: 8,
                border: activeDiv === d.id ? `2px solid ${d.color || "#1E50A2"}` : "2px solid #C8D8EE",
                background: activeDiv === d.id ? (d.bg || "#E8EEF8") : "#fff",
                color: activeDiv === d.id ? (d.color || "#1E50A2") : "#374151",
                fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}>
                {d.icon} {d.id === "all" ? `Semua (${tickets.length})` : `${d.label} (${count((t) => t.division === d.id)})`}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#5A6E8C", minWidth: 60 }}>Kategori:</span>
            {[
              { id:"all",      label:`Semua (${tickets.length})`,       color:"#1E50A2", bg:"#E8EEF8" },
              { id:"Kritik",   label:`🔴 Kritik (${stats.kritik})`,     color:"#991B1B", bg:"#FEF2F2" },
              { id:"Saran",    label:`💡 Saran (${stats.saran})`,       color:"#92400E", bg:"#FFFBEB" },
              { id:"Komentar", label:`💬 Komentar (${stats.komentar})`, color:"#1A3A8F", bg:"#E8EEF8" },
            ].map((item) => (
              <button key={item.id} onClick={() => setActiveCat(item.id)} style={{
                padding: "6px 14px", borderRadius: 8,
                border: activeCat === item.id ? `2px solid ${item.color}` : "2px solid #C8D8EE",
                background: activeCat === item.id ? item.bg : "#fff",
                color: activeCat === item.id ? item.color : "#374151",
                fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}>{item.label}</button>
            ))}
          </div>
          <input
            style={{
              padding: "10px 14px", borderRadius: 10,
              border: "1.5px solid #C8D8EE", fontSize: 13, outline: "none",
              fontFamily: "inherit", color: "#0F2744",
            }}
            placeholder="🔍 Cari berdasarkan nama, pesan, atau nomor tiket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => e.target.style.borderColor = "#1E50A2"}
            onBlur={(e) => e.target.style.borderColor = "#C8D8EE"}
          />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "#fff", borderRadius: 16, border: "1px solid #C8D8EE",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ color: "#5A6E8C", fontWeight: 600 }}>Tidak ada tiket ditemukan</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((t) => {
              const div = DIVISIONS.find((d) => d.id === t.division);
              return (
                <div key={t.id} style={{
                  background: "#fff", borderRadius: 14, padding: "18px 22px",
                  boxShadow: "0 1px 10px rgba(26,58,143,0.06)",
                  border: "1px solid #C8D8EE",
                  borderLeft: `4px solid ${div?.color || "#1E50A2"}`,
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 999,
                        background: div?.bg, color: div?.color, border: `1px solid ${div?.color}33`,
                      }}>{div?.icon} {div?.label}</span>
                      <SentimentBadge sentiment={t.sentiment} />
                      <CategoryBadge category={t.category} />
                      <StatusBadge status={t.status || "Open"} />
                    </div>
                    <span style={{ fontSize: 11, color: "#5A6E8C", fontFamily: "monospace", fontWeight: 700, letterSpacing: 0.5 }}>
                      {t.id}
                    </span>
                  </div>
                  <p style={{ color: "#374151", lineHeight: 1.65, margin: 0, fontSize: 14 }}>{t.message}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#5A6E8C", paddingTop: 4, borderTop: "1px solid #F1F5F9" }}>
                    <span>👤 {t.name}</span>
                    <span>🕐 {formatDate(t.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: "#5A6E8C" }}>
          © 2026 BPT Komdigi · Kementerian Komunikasi dan Digital Republik Indonesia
        </div>
      </div>
    </div>
  );
};

export default Dashboard;