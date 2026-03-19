"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DIVISIONS from "@/constants/divisions";
import Navbar from "@/components/Navbar";

const DUMMY_TICKETS = [
  { id:"TKT-001", division:"it",      sentiment:"Negatif", category:"Kritik",   createdAt: new Date(Date.now()-86400000*6).toISOString() },
  { id:"TKT-002", division:"finance", sentiment:"Positif", category:"Komentar", createdAt: new Date(Date.now()-86400000*5).toISOString() },
  { id:"TKT-003", division:"humas",   sentiment:"Netral",  category:"Saran",    createdAt: new Date(Date.now()-86400000*5).toISOString() },
  { id:"TKT-004", division:"audit",   sentiment:"Positif", category:"Komentar", createdAt: new Date(Date.now()-86400000*4).toISOString() },
  { id:"TKT-005", division:"finance", sentiment:"Negatif", category:"Kritik",   createdAt: new Date(Date.now()-86400000*4).toISOString() },
  { id:"TKT-006", division:"it",      sentiment:"Netral",  category:"Saran",    createdAt: new Date(Date.now()-86400000*3).toISOString() },
  { id:"TKT-007", division:"humas",   sentiment:"Positif", category:"Komentar", createdAt: new Date(Date.now()-86400000*3).toISOString() },
  { id:"TKT-008", division:"it",      sentiment:"Negatif", category:"Kritik",   createdAt: new Date(Date.now()-86400000*2).toISOString() },
  { id:"TKT-009", division:"audit",   sentiment:"Positif", category:"Saran",    createdAt: new Date(Date.now()-86400000*2).toISOString() },
  { id:"TKT-010", division:"finance", sentiment:"Netral",  category:"Komentar", createdAt: new Date(Date.now()-86400000).toISOString() },
  { id:"TKT-011", division:"it",      sentiment:"Positif", category:"Saran",    createdAt: new Date(Date.now()-3600000*5).toISOString() },
  { id:"TKT-012", division:"humas",   sentiment:"Negatif", category:"Kritik",   createdAt: new Date(Date.now()-3600000*2).toISOString() },
];

const SENTIMENT_CFG = {
  Positif: { color: "#15803D", bg: "#DCFCE7", border: "#BBF7D0", icon: "😊" },
  Netral:  { color: "#92400E", bg: "#FFFBEB", border: "#FDE68A", icon: "😐" },
  Negatif: { color: "#C0272D", bg: "#FEF2F2", border: "#FECACA", icon: "😠" },
};

const CATEGORY_CFG = {
  Kritik:   { color: "#C0272D", bg: "#FEF2F2", icon: "🔴" },
  Saran:    { color: "#92400E", bg: "#FFFBEB", icon: "💡" },
  Komentar: { color: "#1A3A8F", bg: "#E8EEF8", icon: "💬" },
};

// ── Simple Bar Chart
const BarChart = ({ data, maxVal, colorFn }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {data.map((item) => {
      const pct = maxVal ? Math.round((item.value / maxVal) * 100) : 0;
      const cfg = colorFn(item.label);
      return (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 80, fontSize: 12, fontWeight: 700, color: "#0F1F4B", flexShrink: 0 }}>
            {item.icon} {item.label}
          </div>
          <div style={{ flex: 1, height: 28, borderRadius: 8, background: "#F0F5FB", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 8, background: cfg.color,
              width: `${pct}%`, minWidth: pct > 0 ? 32 : 0,
              display: "flex", alignItems: "center", paddingLeft: 10,
              transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
            }}>
              {pct > 8 && <span style={{ fontSize: 11, color: "#fff", fontWeight: 800 }}>{item.value}</span>}
            </div>
          </div>
          <div style={{ width: 28, fontSize: 13, fontWeight: 800, color: cfg.color, textAlign: "right" }}>
            {item.value}
          </div>
        </div>
      );
    })}
  </div>
);

// ── Donut Chart (SVG)
const DonutChart = ({ data, total }) => {
  const size = 160;
  const r = 58;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const segments = data.map((d) => {
    const pct = total ? d.value / total : 0;
    const dash = pct * circumference;
    const gap  = circumference - dash;
    const seg  = { ...d, dash, gap, offset };
    offset += dash;
    return seg;
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0F5FB" strokeWidth={24} />
        {segments.map((seg) => (
          <circle key={seg.label} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={24}
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={-seg.offset}
            style={{ transition: "stroke-dasharray 0.6s ease", transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={26} fontWeight={900} fill="#0F1F4B">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill="#5A6E8C">Total</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.map((d) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1F4B" }}>
                  {d.icon} {d.label}
                </div>
                <div style={{ fontSize: 11, color: "#5A6E8C" }}>{d.value} tiket · {pct}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Trend line (last 7 days)
const TrendChart = ({ tickets }) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  });

  const counts = days.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end   = new Date(d); end.setHours(23, 59, 59, 999);
    return {
      positif: tickets.filter(t => t.sentiment === "Positif" && new Date(t.createdAt) >= start && new Date(t.createdAt) <= end).length,
      negatif: tickets.filter(t => t.sentiment === "Negatif" && new Date(t.createdAt) >= start && new Date(t.createdAt) <= end).length,
      netral:  tickets.filter(t => t.sentiment === "Netral"  && new Date(t.createdAt) >= start && new Date(t.createdAt) <= end).length,
    };
  });

  const maxCount = Math.max(...counts.flatMap(c => [c.positif, c.negatif, c.netral]), 1);
  const h = 120;
  const w = 480;
  const padX = 30;
  const padY = 10;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const toY = (v) => padY + chartH - (v / maxCount) * chartH;
  const toX = (i) => padX + (i / (days.length - 1)) * chartW;

  const makePath = (key, color) => {
    const pts = counts.map((c, i) => `${toX(i)},${toY(c[key])}`).join(" L ");
    return (
      <g key={key}>
        <path d={`M ${pts}`} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {counts.map((c, i) => (
          <circle key={i} cx={toX(i)} cy={toY(c[key])} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
        ))}
      </g>
    );
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={w} height={h + 30} style={{ minWidth: 320 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <line key={v} x1={padX} y1={toY(v * maxCount)} x2={w - padX} y2={toY(v * maxCount)}
            stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4 4" />
        ))}
        {/* Lines */}
        {makePath("positif", "#15803D")}
        {makePath("netral",  "#F7C200")}
        {makePath("negatif", "#C0272D")}
        {/* X labels */}
        {days.map((d, i) => (
          <text key={i} x={toX(i)} y={h + 20} textAnchor="middle" fontSize={10} fill="#94A3B8">{d}</text>
        ))}
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
        {[["Positif","#15803D"], ["Netral","#F7C200"], ["Negatif","#C0272D"]].map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 3, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 11, color: "#5A6E8C", fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main
const SentimentDashboard = () => {
  const router  = useRouter();
  const [tickets, setTickets]   = useState([]);
  const [mounted, setMounted]   = useState(false);
  const [divFilter, setDivFilter] = useState("all");

  useEffect(() => {
    setMounted(true);
    const stored = JSON.parse(localStorage.getItem("tickets") || "[]");
    const all = [...stored, ...DUMMY_TICKETS];
    const seen = new Set();
    setTickets(all.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; }));
  }, []);

  const filtered = divFilter === "all" ? tickets : tickets.filter(t => t.division === divFilter);
  const total = filtered.length;
  const count = (fn) => filtered.filter(fn).length;

  const sentimentData = [
    { label: "Positif", value: count(t => t.sentiment === "Positif"), color: "#15803D", icon: "😊" },
    { label: "Netral",  value: count(t => t.sentiment === "Netral"),  color: "#F7C200", icon: "😐" },
    { label: "Negatif", value: count(t => t.sentiment === "Negatif"), color: "#C0272D", icon: "😠" },
  ];

  const categoryData = [
    { label: "Kritik",   value: count(t => t.category === "Kritik"),   color: "#C0272D", icon: "🔴" },
    { label: "Saran",    value: count(t => t.category === "Saran"),    color: "#F7C200", icon: "💡" },
    { label: "Komentar", value: count(t => t.category === "Komentar"), color: "#1A3A8F", icon: "💬" },
  ];

  const divisionData = DIVISIONS.map(d => ({
    label: d.label, icon: d.icon, color: d.color || "#1A3A8F",
    value: count(t => t.division === d.id),
    positif: count(t => t.division === d.id && t.sentiment === "Positif"),
    negatif: count(t => t.division === d.id && t.sentiment === "Negatif"),
  }));

  const satisfactionScore = total > 0
    ? Math.round(((count(t => t.sentiment === "Positif") * 100 + count(t => t.sentiment === "Netral") * 50) / total))
    : 0;

  const bgStyle = {
    minHeight: "100vh",
    background: "var(--bg)",
    backgroundImage: `radial-gradient(circle at 20% 20%, rgba(30,80,162,0.06) 0%, transparent 50%)`,
  };

  return (
    <div style={bgStyle}>
      <Navbar />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "36px 24px 80px" }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
                background: "#E8EEF8", color: "#1A3A8F", border: "1px solid #C8D8EE",
                borderRadius: 999, padding: "4px 14px", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                📊 Analisis Sentimen
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0F1F4B", margin: "0 0 4px", letterSpacing: -0.3 }}>
                Dashboard Sentimen
              </h1>
              <p style={{ color: "#5A6E8C", fontSize: 13, margin: 0 }}>
                Analisis sentimen & kategori aspirasi masuk — BPT Komdigi
              </p>
            </div>
            {/* Filter divisi */}
            <select value={divFilter} onChange={e => setDivFilter(e.target.value)}
              style={{ padding: "9px 14px", borderRadius: 10, border: "1.5px solid #C8D8EE",
                outline: "none", fontSize: 13, fontFamily: "inherit", color: "#0F1F4B",
                background: "#fff", cursor: "pointer" }}>
              <option value="all">Semua Divisi</option>
              {DIVISIONS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
            </select>
          </div>
        </div>

        {/* Score cards */}
        <div className="fade-up-1" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { icon: "🎫", value: total,             label: "Total Tiket",      color: "#1A3A8F", bg: "#E8EEF8" },
            { icon: "😊", value: count(t => t.sentiment === "Positif"), label: "Positif", color: "#15803D", bg: "#DCFCE7" },
            { icon: "😐", value: count(t => t.sentiment === "Netral"),  label: "Netral",  color: "#92400E", bg: "#FFFBEB" },
            { icon: "😠", value: count(t => t.sentiment === "Negatif"), label: "Negatif", color: "#C0272D", bg: "#FEF2F2" },
          ].map(item => (
            <div key={item.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px",
              border: "1px solid #C8D8EE", boxShadow: "0 2px 12px rgba(26,58,143,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{item.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: item.color }}>{item.value}</div>
              </div>
              <div style={{ fontSize: 12, color: "#5A6E8C", fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Satisfaction score */}
        <div className="fade-up-1" style={{ background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
          borderRadius: 16, padding: "20px 28px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700,
              letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Indeks Kepuasan</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{satisfactionScore}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>dari 100 poin</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 6,
                background: satisfactionScore >= 70 ? "#15803D" : satisfactionScore >= 40 ? "#F7C200" : "#C0272D",
                width: `${satisfactionScore}%`, transition: "width 0.8s ease" }} />
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
              {satisfactionScore >= 70 ? "🟢 Kepuasan Tinggi" : satisfactionScore >= 40 ? "🟡 Kepuasan Sedang" : "🔴 Perlu Perhatian"}
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

          {/* Donut sentimen */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px",
            border: "1px solid #C8D8EE", boxShadow: "0 2px 12px rgba(26,58,143,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#0F1F4B", marginBottom: 18 }}>
              🎯 Distribusi Sentimen
            </div>
            {mounted && <DonutChart data={sentimentData} total={total} />}
          </div>

          {/* Bar kategori */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px",
            border: "1px solid #C8D8EE", boxShadow: "0 2px 12px rgba(26,58,143,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#0F1F4B", marginBottom: 18 }}>
              🏷️ Distribusi Kategori
            </div>
            <BarChart data={categoryData} maxVal={Math.max(...categoryData.map(d => d.value), 1)}
              colorFn={(label) => CATEGORY_CFG[label] || { color: "#1A3A8F" }} />
          </div>
        </div>

        {/* Trend 7 hari */}
        <div className="fade-up-2" style={{ background: "#fff", borderRadius: 16, padding: "20px 24px",
          border: "1px solid #C8D8EE", boxShadow: "0 2px 12px rgba(26,58,143,0.06)", marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#0F1F4B", marginBottom: 18 }}>
            📈 Tren Sentimen 7 Hari Terakhir
          </div>
          {mounted && <TrendChart tickets={filtered} />}
        </div>

        {/* Per divisi */}
        <div className="fade-up-3" style={{ background: "#fff", borderRadius: 16, padding: "20px 24px",
          border: "1px solid #C8D8EE", boxShadow: "0 2px 12px rgba(26,58,143,0.06)" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#0F1F4B", marginBottom: 18 }}>
            🏢 Sentimen per Divisi
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {divisionData.map(d => {
              const pctPos = d.value ? Math.round((d.positif / d.value) * 100) : 0;
              const pctNeg = d.value ? Math.round((d.negatif / d.value) * 100) : 0;
              return (
                <div key={d.label} style={{ borderRadius: 12, padding: "14px 16px",
                  border: "1px solid #C8D8EE", background: "#F8FAFF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{d.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#0F1F4B" }}>{d.label}</div>
                      <div style={{ fontSize: 11, color: "#5A6E8C" }}>{d.value} tiket</div>
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: 20, fontWeight: 900, color: d.color }}>{d.value}</div>
                  </div>
                  {/* Stacked bar */}
                  <div style={{ height: 8, borderRadius: 4, background: "#E2E8F0", overflow: "hidden", display: "flex" }}>
                    <div style={{ height: "100%", background: "#15803D", width: `${pctPos}%`, transition: "width 0.5s" }} />
                    <div style={{ height: "100%", background: "#F7C200", width: `${100 - pctPos - pctNeg}%` }} />
                    <div style={{ height: "100%", background: "#C0272D", width: `${pctNeg}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "#94A3B8" }}>
                    <span style={{ color: "#15803D", fontWeight: 600 }}>😊 {d.positif}</span>
                    <span style={{ color: "#C0272D", fontWeight: 600 }}>😠 {d.negatif}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SentimentDashboard;