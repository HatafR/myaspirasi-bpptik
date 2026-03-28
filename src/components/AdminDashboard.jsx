"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import formatDate from "@/utils/formatDate";
import SentimentBadge from "@/components/SentimentBadge";
import CategoryBadge from "@/components/CategoryBadge";

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_LIST = [
  "Submitted",
  "Assigned",
  "In Progress",
  "Returned",
  "Resolved",
  "Closed",
];
const STATUS_MAP = {
  Submitted: {
    bg: "#EFF6FF",
    color: "#1A3A8F",
    border: "#C8D8EE",
    icon: "📩",
  },
  Assigned: {
    bg: "#E0F2FE",
    color: "#0369A1",
    border: "#BAE6FD",
    icon: "👤",
  },
  "In Progress": {
    bg: "#FFFBEB",
    color: "#92400E",
    border: "#FDE68A",
    icon: "🟡",
  },
  Returned: {
    bg: "#FEF2F2",
    color: "#C0272D",
    border: "#FECACA",
    icon: "↩️",
  },
  Resolved: {
    bg: "#DCFCE7",
    color: "#15803D",
    border: "#BBF7D0",
    icon: "🟢",
  },
  Closed: {
    bg: "#F1F5F9",
    color: "#475569",
    border: "#CBD5E1",
    icon: "⚫",
  },
};

const STATUS_TO_API = {
  Submitted: "SUBMITTED",
  Assigned: "ASSIGNED",
  "In Progress": "IN_PROGRESS",
  Returned: "RETURNED",
  Resolved: "RESOLVED",
  Closed: "CLOSED",
};

// ── Sub-components ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || {
    bg: "#F1F5F9",
    color: "#475569",
    border: "#CBD5E1",
    icon: "❓",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {s.icon} {status}
    </span>
  );
};

const StatCard = ({
  icon,
  value,
  label,
  color = "#1A3A8F",
  bg = "#E8EEF8",
}) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 14,
      padding: "16px 18px",
      border: "1px solid #C8D8EE",
      boxShadow: "0 2px 12px rgba(26,58,143,0.06)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
    </div>
    <div style={{ fontSize: 12, color: "#5A6E8C", fontWeight: 600 }}>
      {label}
    </div>
  </div>
);

const mapToUIStatus = (status) => {
  switch (status) {
    case "SUBMITTED":
      return "Submitted";
    case "ASSIGNED":
      return "Assigned";
    case "IN_PROGRESS":
      return "In Progress";
    case "RETURNED":
      return "Returned";
    case "RESOLVED":
      return "Resolved";
    case "CLOSED":
      return "Closed";
    default:
      return "Submitted";
  }
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("tickets");
  const [selectedTicket, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [sidebarOpen, setSidebar] = useState(false);
  const [toast, setToast] = useState(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      setMounted(true);

      const session = localStorage.getItem("user_session");
      const token = localStorage.getItem("token");

      if (!session || !token) {
        router.push("/login");
        return;
      }

      const u = JSON.parse(session);
      setUser(u);

      try {
        const res = await fetch("/api/tickets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await res.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        const normalized = result.data.map((t) => ({
          ...t,
          id: t.id,
          ticketNumber: t.ticketNumber,
          assignedToId: t.assignedToId || t.assignedTo?.id || null,
          assignedToName: t.assignedTo?.name || null,
          status: mapToUIStatus(t.status),
          category: t.category
            ? t.category.charAt(0).toUpperCase() + t.category.slice(1)
            : "Komentar",
          sentiment: t.sentiment || "Netral",
        }));

        setTickets(normalized);

        if (u.role === "GENERAL_ADMIN" || u.role === "SUPER_ADMIN") {
          const adminRes = await fetch("/api/admins", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const adminResult = await adminRes.json();

          if (!adminResult.success) {
            throw new Error(adminResult.message);
          }

          setAdmins(adminResult.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (selectedTicket?.response?.content) {
      setReply(selectedTicket.response.content);
    } else {
      setReply("");
    }
  }, [selectedTicket]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAdminDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAssignableAdmins = (ticket) => {
    if (ticket.service?.name === "Lainnya") {
      return admins;
    }

    return admins.filter((admin) =>
      admin.assignedServices?.some(
        (service) => service.id === ticket.serviceId,
      ),
    );
  };

  if (!mounted || !user)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F0F5FB",
        }}
      >
        <div style={{ fontSize: 14, color: "#5A6E8C" }}>⏳ Memuat...</div>
      </div>
    );

  const isGeneral =
    user.role === "GENERAL_ADMIN" || user.role === "SUPER_ADMIN";
  const myTickets = tickets;
  const filtered = myTickets.filter((t) => {
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchSearch =
      !search ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.message.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const count = (fn) => myTickets.filter(fn).length;
  const stats = {
    total: myTickets.length,
    submitted: count((t) => t.status === "Submitted"),
    assigned: count((t) => t.status === "Assigned"),
    inProgress: count((t) => t.status === "In Progress"),
    returned: count((t) => t.status === "Returned"),
    resolved: count((t) => t.status === "Resolved"),
    closed: count((t) => t.status === "Closed"),
  };

  const summaryStats = {
    open: count((t) => t.status === "Submitted" || t.status === "Assigned"),
    onProgress: count(
      (t) => t.status === "In Progress" || t.status === "Returned",
    ),
    resolved: count((t) => t.status === "Resolved"),
    closed: count((t) => t.status === "Closed"),
  };

  // ── Actions
  const updateStatus = async (ticketId, newStatus) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: STATUS_TO_API[newStatus],
        }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: newStatus,
              }
            : t,
        ),
      );

      if (selectedTicket?.id === ticketId) {
        setSelected((prev) => ({
          ...prev,
          status: newStatus,
        }));
      }

      showToast("✅ Status berhasil diperbarui");
    } catch (err) {
      console.error(err);
      showToast("❌ Gagal update status", "error");
    }
  };

  const assignTicket = async (ticketId, adminId) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedToId: adminId,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                assignedToId: adminId,
                status: "Assigned",
              }
            : t,
        ),
      );

      if (selectedTicket?.id === ticketId) {
        setSelected((prev) => ({
          ...prev,
          assignedToId: adminId,
          status: "Assigned",
        }));
      }

      showToast("✅ Tiket berhasil diserahkan");
    } catch (err) {
      console.error(err);
      showToast("❌ Gagal assign tiket", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    router.push("/login");
  };

  const getServiceName = (ticket) =>
    ticket.service?.name || "Layanan Tidak Diketahui";

  // ── Sidebar nav items
  const navItems = [
    { id: "tickets", icon: "🎫", label: "Tiket Masuk", badge: stats.open },
    { id: "stats", icon: "📊", label: "Statistik" },
    ...(isGeneral ? [{ id: "users", icon: "👥", label: "Kelola Admin" }] : []),
  ];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F0F5FB",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
      <div
        style={{
          width: sidebarOpen ? 240 : 64,
          flexShrink: 0,
          background: "linear-gradient(180deg, #1A3A8F 0%, #1E50A2 100%)",
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 24px rgba(26,58,143,0.15)",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {/* Logo & toggle */}
        <div
          style={{
            padding: "16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={() => setSidebar((v) => !v)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              flexShrink: 0,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 18,
            }}
          >
            ☰
          </button>
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>
                MyAspirasi
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 500,
                }}
              >
                Admin Portal
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div
          style={{
            flex: 1,
            padding: "12px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 10px",
                  borderRadius: 10,
                  border: "none",
                  background: active ? "rgba(255,255,255,0.18)" : "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: "#fff",
                  borderLeft: active
                    ? "3px solid #F7C200"
                    : "3px solid transparent",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && (
                  <>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        flex: 1,
                        textAlign: "left",
                      }}
                    >
                      {item.label}
                    </span>
                    {item.badge > 0 && (
                      <span
                        style={{
                          background: "#F7C200",
                          color: "#1A3A8F",
                          borderRadius: 999,
                          padding: "1px 7px",
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* User info + logout */}
        <div
          style={{
            padding: "12px 8px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {sidebarOpen && (
            <div
              style={{
                padding: "10px 10px",
                marginBottom: 8,
                borderRadius: 10,
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 2,
                }}
              >
                {user.name}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
                {user.roleLabel}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "10px 10px",
              borderRadius: 10,
              border: "none",
              background: "rgba(192,39,45,0.2)",
              cursor: "pointer",
              fontFamily: "inherit",
              color: "#FCA5A5",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>🚪</span>
            {sidebarOpen && (
              <span style={{ fontSize: 13, fontWeight: 600 }}>Keluar</span>
            )}
          </button>
        </div>
      </div>

      {/* ── MAIN ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Topbar */}
        <div
          style={{
            background: "#fff",
            padding: "16px 28px",
            borderBottom: "1px solid #C8D8EE",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
            boxShadow: "0 2px 12px rgba(26,58,143,0.06)",
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#0F1F4B" }}>
              {activeTab === "tickets" && "🎫 Tiket Masuk"}
              {activeTab === "stats" && "📊 Statistik"}
              {activeTab === "users" && "👥 Kelola Admin"}
            </div>
            <div style={{ fontSize: 12, color: "#5A6E8C", marginTop: 2 }}>
              {isGeneral ? "Admin General — semua layanan" : "Admin Layanan"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "#5A6E8C" }}>
              {mounted
                ? new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : ""}
            </div>
            <button
              onClick={() => router.push("/")}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: "1.5px solid #C8D8EE",
                background: "#fff",
                color: "#1A3A8F",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ← Beranda
            </button>
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {/* ── TAB: TIKET ─────────────────────────────────────────── */}
          {activeTab === "tickets" && (
            <div style={{ display: "flex", gap: 20 }}>
              {/* Ticket list panel */}
              <div style={{ flex: selectedTicket ? "0 0 420px" : 1 }}>
                {/* Stat cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <StatCard
                    icon="🎫"
                    value={stats.total}
                    label="Total Tiket"
                    color="#1A3A8F"
                    bg="#E8EEF8"
                  />
                  <StatCard
                    icon="🔵"
                    value={summaryStats.open}
                    label="Open"
                    color="#1A3A8F"
                    bg="#EFF6FF"
                  />
                  <StatCard
                    icon="🟡"
                    value={summaryStats.onProgress}
                    label="On Progress"
                    color="#92400E"
                    bg="#FFFBEB"
                  />
                  <StatCard
                    icon="🟢"
                    value={summaryStats.resolved}
                    label="Resolved"
                    color="#15803D"
                    bg="#DCFCE7"
                  />
                </div>

                {/* Search & filter */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari tiket, nama, pesan..."
                    style={{
                      flex: 1,
                      padding: "9px 14px",
                      borderRadius: 9,
                      border: "1.5px solid #C8D8EE",
                      outline: "none",
                      fontSize: 13,
                      fontFamily: "inherit",
                      color: "#0F1F4B",
                    }}
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 9,
                      border: "1.5px solid #C8D8EE",
                      outline: "none",
                      fontSize: 13,
                      fontFamily: "inherit",
                      color: "#0F1F4B",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">Semua Status</option>
                    {STATUS_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ticket cards */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {filtered.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#94A3B8",
                        fontSize: 14,
                      }}
                    >
                      Tidak ada tiket ditemukan
                    </div>
                  )}
                  {filtered.map((t) => {
                    const active = selectedTicket?.id === t.id;
                    return (
                      <div
                        key={t.ticketNumber}
                        onClick={() => setSelected(active ? null : t)}
                        style={{
                          background: "#fff",
                          borderRadius: 14,
                          padding: "14px 18px",
                          border: active
                            ? "2px solid #1A3A8F"
                            : "1.5px solid #C8D8EE",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          boxShadow: active
                            ? "0 4px 20px rgba(26,58,143,0.12)"
                            : "0 1px 6px rgba(26,58,143,0.05)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "monospace",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#5A6E8C",
                            }}
                          >
                            {t.ticketNumber}
                          </div>
                          <StatusBadge status={t.status} />
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#0F1F4B",
                            marginBottom: 4,
                          }}
                        >
                          {t.name}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#5A6E8C",
                            marginBottom: 10,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {t.message}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              background: "#F0F5FB",
                              color: "#1A3A8F",
                              border: "1px solid #C8D8EE",
                              borderRadius: 6,
                              padding: "2px 8px",
                              fontWeight: 600,
                            }}
                          >
                            🛠️ {getServiceName(t)}
                          </span>
                          <SentimentBadge sentiment={t.sentiment} />
                          <CategoryBadge category={t.category} />
                          <span
                            style={{
                              marginLeft: "auto",
                              fontSize: 11,
                              color: "#94A3B8",
                            }}
                          >
                            🕐 {formatDate(t.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Detail panel */}
              {selectedTicket &&
                (() => {
                  const t =
                    tickets.find((x) => x.id === selectedTicket.id) ||
                    selectedTicket;
                  const assignableAdmins = getAssignableAdmins(t);

                  const filteredAdmins = assignableAdmins.filter((a) =>
                    a.name.toLowerCase().includes(adminSearch.toLowerCase()),
                  );

                  const assignedAdmin = admins.find(
                    (a) => a.id === t.assignedToId,
                  );
                  return (
                    <div
                      style={{
                        flex: 1,
                        background: "#fff",
                        borderRadius: 16,
                        border: "1.5px solid #C8D8EE",
                        height: "fit-content",
                        boxShadow: "0 4px 24px rgba(26,58,143,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Detail header */}
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, #1A3A8F, #1E50A2)",
                          padding: "18px 22px",
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
                              letterSpacing: 1,
                              textTransform: "uppercase",
                              marginBottom: 4,
                            }}
                          >
                            Detail Tiket
                          </div>
                          <div
                            style={{
                              fontFamily: "monospace",
                              fontSize: 15,
                              fontWeight: 800,
                              color: "#fff",
                            }}
                          >
                            {t.ticketNumber}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelected(null)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.15)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      <div
                        style={{
                          padding: "18px 22px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 16,
                        }}
                      >
                        {/* Info rows */}
                        <div
                          style={{
                            borderRadius: 10,
                            overflow: "hidden",
                            border: "1px solid #C8D8EE",
                          }}
                        >
                          {[
                            ["Nama", t.name],
                            ["Email", t.email],
                            ["Layanan", getServiceName(t)],
                            ["Tanggal", formatDate(t.createdAt)],
                          ].map(([label, val], i, arr) => (
                            <div
                              key={label}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "9px 14px",
                                background: i % 2 === 0 ? "#F8FAFF" : "#fff",
                                borderBottom:
                                  i < arr.length - 1
                                    ? "1px solid #C8D8EE"
                                    : "none",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#5A6E8C",
                                  fontWeight: 500,
                                }}
                              >
                                {label}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#0F1F4B",
                                  fontWeight: 700,
                                }}
                              >
                                {val}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Pesan */}
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#5A6E8C",
                              marginBottom: 6,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Pesan
                          </div>
                          <div
                            style={{
                              background: "#F8FAFF",
                              borderRadius: 10,
                              padding: "12px 14px",
                              border: "1px solid #C8D8EE",
                              fontSize: 13,
                              color: "#374151",
                              lineHeight: 1.7,
                            }}
                          >
                            {t.message}
                          </div>
                        </div>

                        {/* Badges */}
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          <StatusBadge status={t.status} />
                          <SentimentBadge sentiment={t.sentiment} />
                          <CategoryBadge category={t.category} />
                        </div>

                        {/* ── Ganti Status (Admin Layanan only) */}
                        {!isGeneral ? (
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: "#5A6E8C",
                                marginBottom: 8,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              Ubah Status
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              {STATUS_LIST.map((s) => {
                                const sm = STATUS_MAP[s];
                                const active = t.status === s;
                                return (
                                  <button
                                    key={s}
                                    onClick={() => updateStatus(t.id, s)}
                                    style={{
                                      padding: "6px 14px",
                                      borderRadius: 8,
                                      cursor: "pointer",
                                      fontFamily: "inherit",
                                      fontSize: 12,
                                      fontWeight: 700,
                                      border: active
                                        ? `2px solid ${sm.color}`
                                        : "1.5px solid #C8D8EE",
                                      background: active ? sm.bg : "#fff",
                                      color: active ? sm.color : "#5A6E8C",
                                      boxShadow: active
                                        ? `0 0 0 3px ${sm.bg}`
                                        : "none",
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    {sm.icon} {s}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: "10px 14px",
                              borderRadius: 8,
                              background: "#F8FAFF",
                              border: "1px solid #C8D8EE",
                              fontSize: 12,
                              color: "#5A6E8C",
                              fontWeight: 500,
                            }}
                          >
                            ℹ️ Perubahan status hanya bisa dilakukan oleh Admin
                            Layanan yang ditugaskan
                          </div>
                        )}

                        {/* ── History Status */}
                        {(() => {
                          const history =
                            t.statusHistories?.filter(
                              (h) => h.ticketId === t.id,
                            ) || [];
                          if (history.length === 0) return null;
                          return (
                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: "#5A6E8C",
                                  marginBottom: 8,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}
                              >
                                Riwayat Status
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                {history.map((h, i) => {
                                  const mappedStatus = mapToUIStatus(h.status);
                                  const sm = STATUS_MAP[mappedStatus];

                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                        background: "#F8FAFF",
                                        border: "1px solid #C8D8EE",
                                        fontSize: 12,
                                      }}
                                    >
                                      <span style={{ fontSize: 14 }}>
                                        {sm?.icon || "❓"}
                                      </span>

                                      <div style={{ flex: 1 }}>
                                        <span
                                          style={{
                                            fontWeight: 700,
                                            color: sm.color,
                                          }}
                                        >
                                          {h.status}
                                        </span>

                                        <span style={{ color: "#5A6E8C" }}>
                                          {" "}
                                          · {h.changedBy?.name || "System"}
                                        </span>
                                      </div>

                                      <span
                                        style={{
                                          color: "#94A3B8",
                                          fontSize: 11,
                                        }}
                                      >
                                        {h.createdAt
                                          ? formatDate(h.createdAt)
                                          : "-"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── Serahkan ke Admin (Admin General only) */}
                        {isGeneral && (
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: "#5A6E8C",
                                marginBottom: 8,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              Serahkan ke Admin Layanan
                            </div>

                            {!t.assignedToId ? (
                              <div
                                ref={dropdownRef}
                                style={{ position: "relative", width: 260 }}
                              >
                                {/* Trigger */}
                                <button
                                  onClick={() =>
                                    setShowAdminDropdown((v) => !v)
                                  }
                                  style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    border: "1.5px solid #C8D8EE",
                                    background: "#fff",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    textAlign: "left",
                                  }}
                                >
                                  👤 Pilih Admin
                                </button>

                                {/* Dropdown */}
                                {showAdminDropdown && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "110%",
                                      left: 0,
                                      width: "100%",
                                      background: "#fff",
                                      border: "1px solid #C8D8EE",
                                      borderRadius: 10,
                                      boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                                      zIndex: 20,
                                      padding: 10,
                                    }}
                                  >
                                    {/* Search */}
                                    <input
                                      placeholder="Cari admin..."
                                      value={adminSearch}
                                      onChange={(e) =>
                                        setAdminSearch(e.target.value)
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px 8px",
                                        marginBottom: 8,
                                        borderRadius: 6,
                                        border: "1px solid #C8D8EE",
                                        fontSize: 12,
                                      }}
                                    />

                                    {/* List */}
                                    <div
                                      style={{
                                        maxHeight: 160,
                                        overflowY: "auto",
                                      }}
                                    >
                                      {filteredAdmins.map((a) => (
                                        <div
                                          key={a.id}
                                          onClick={() => {
                                            assignTicket(t.id, a.id);
                                            setShowAdminDropdown(false);
                                            setAdminSearch("");
                                          }}
                                          style={{
                                            padding: "6px 8px",
                                            borderRadius: 6,
                                            cursor: "pointer",
                                            fontSize: 12,
                                          }}
                                          onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                              "#F0F5FB")
                                          }
                                          onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                              "transparent")
                                          }
                                        >
                                          👤 {a.name}
                                        </div>
                                      ))}

                                      {filteredAdmins.length === 0 && (
                                        <div
                                          style={{
                                            fontSize: 12,
                                            color: "#94A3B8",
                                          }}
                                        >
                                          Tidak ditemukan
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : null}

                            {/* Assigned info */}
                            {assignedAdmin && (
                              <div
                                style={{
                                  marginTop: 8,
                                  fontSize: 12,
                                  color: "#15803D",
                                  fontWeight: 600,
                                }}
                              >
                                ✅ Diserahkan ke: {assignedAdmin.name}
                              </div>
                            )}

                            {/* Empty state */}
                            {assignableAdmins.length === 0 && (
                              <span style={{ fontSize: 12, color: "#94A3B8" }}>
                                Tidak ada admin untuk divisi ini
                              </span>
                            )}
                          </div>
                        )}

                        {/* ── Balas/Tanggapi */}
                        {/* ── Tanggapan User (READ ONLY) */}
                        {(t.status === "Resolved" || t.status === "Closed") && (
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: "#5A6E8C",
                                marginBottom: 8,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              Tanggapan User
                            </div>

                            {!t.rating ? (
                              <div
                                style={{
                                  padding: "10px 14px",
                                  borderRadius: 8,
                                  background: "#F8FAFF",
                                  border: "1px solid #C8D8EE",
                                  fontSize: 12,
                                  color: "#94A3B8",
                                  fontWeight: 500,
                                }}
                              >
                                ⏳ User belum memberikan rating & tanggapan
                              </div>
                            ) : (
                              <div
                                style={{
                                  background: "#F8FAFF",
                                  borderRadius: 10,
                                  padding: "12px 14px",
                                  border: "1px solid #C8D8EE",
                                }}
                              >
                                {/* Rating */}
                                <div style={{ marginBottom: 6 }}>
                                  {"⭐".repeat(t.rating.score)}
                                  {"☆".repeat(5 - t.rating.score)}
                                </div>

                                {/* Comment */}
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#374151",
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {t.rating.comment || "Tidak ada komentar"}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
            </div>
          )}

          {/* ── TAB: STATISTIK ─────────────────────────────────────── */}
          {activeTab === "stats" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Summary cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 14,
                }}
              >
                <StatCard
                  icon="🎫"
                  value={stats.total}
                  label="Total Tiket"
                  color="#1A3A8F"
                  bg="#E8EEF8"
                />
                <StatCard
                  icon="😊"
                  value={stats.positif}
                  label="Sentimen Positif"
                  color="#15803D"
                  bg="#DCFCE7"
                />
                <StatCard
                  icon="😠"
                  value={stats.negatif}
                  label="Sentimen Negatif"
                  color="#C0272D"
                  bg="#FEF2F2"
                />
              </div>

              {/* Status breakdown */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "20px 22px",
                  border: "1.5px solid #C8D8EE",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: "#0F1F4B",
                    marginBottom: 16,
                  }}
                >
                  Distribusi Status
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gap: 12,
                  }}
                >
                  {STATUS_LIST.map((s) => {
                    const sm = STATUS_MAP[s];
                    const cnt = count((t) => t.status === s);
                    const pct = stats.total
                      ? Math.round((cnt / stats.total) * 100)
                      : 0;
                    return (
                      <div
                        key={s}
                        style={{
                          background: sm.bg,
                          borderRadius: 12,
                          padding: "14px 16px",
                          border: `1px solid ${sm.border}`,
                        }}
                      >
                        <div style={{ fontSize: 22, marginBottom: 6 }}>
                          {sm.icon}
                        </div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 900,
                            color: sm.color,
                          }}
                        >
                          {cnt}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: sm.color,
                            marginBottom: 4,
                          }}
                        >
                          {s}
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>
                          {pct}% dari total
                        </div>
                        {/* Progress bar */}
                        <div
                          style={{
                            marginTop: 8,
                            height: 4,
                            borderRadius: 2,
                            background: "rgba(0,0,0,0.08)",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              borderRadius: 2,
                              background: sm.color,
                              width: `${pct}%`,
                              transition: "width 0.5s",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sentiment breakdown */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "20px 22px",
                  border: "1.5px solid #C8D8EE",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: "#0F1F4B",
                    marginBottom: 16,
                  }}
                >
                  Analisis Sentimen
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {[
                    {
                      label: "Positif",
                      count: stats.positif,
                      color: "#15803D",
                      bg: "#DCFCE7",
                    },
                    {
                      label: "Netral",
                      count: stats.netral,
                      color: "#92400E",
                      bg: "#FFFBEB",
                    },
                    {
                      label: "Negatif",
                      count: stats.negatif,
                      color: "#C0272D",
                      bg: "#FEF2F2",
                    },
                  ].map((item) => {
                    const pct = stats.total
                      ? Math.round((item.count / stats.total) * 100)
                      : 0;
                    return (
                      <div
                        key={item.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 70,
                            fontSize: 12,
                            fontWeight: 700,
                            color: item.color,
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            height: 24,
                            borderRadius: 6,
                            background: "#F0F5FB",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              borderRadius: 6,
                              background: item.color,
                              width: `${pct}%`,
                              transition: "width 0.5s",
                              display: "flex",
                              alignItems: "center",
                              paddingLeft: 8,
                            }}
                          >
                            {pct > 10 && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "#fff",
                                  fontWeight: 700,
                                }}
                              >
                                {pct}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            width: 30,
                            fontSize: 13,
                            fontWeight: 800,
                            color: item.color,
                            textAlign: "right",
                          }}
                        >
                          {item.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per divisi (Admin General only) */}
              {isGeneral && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: "20px 22px",
                    border: "1.5px solid #C8D8EE",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: "#0F1F4B",
                      marginBottom: 16,
                    }}
                  >
                    Tiket per Layanan
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2,1fr)",
                      gap: 12,
                    }}
                  >
                    {Array.from(
                      new Set(myTickets.map((t) => t.service?.name)),
                    ).map((name) => {
                      const cnt = myTickets.filter(
                        (t) => t.service?.name === name,
                      ).length;
                      const pct = stats.total
                        ? Math.round((cnt / stats.total) * 100)
                        : 0;

                      return (
                        <div
                          key={name}
                          style={{
                            background: "#F0F5FB",
                            borderRadius: 12,
                            padding: "14px 16px",
                            border: "1px solid #C8D8EE",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div style={{ fontSize: 28 }}>🛠️</div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: "#0F1F4B",
                              }}
                            >
                              {name}
                            </div>
                            <div style={{ fontSize: 11, color: "#5A6E8C" }}>
                              {cnt} tiket · {pct}%
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: 24,
                              fontWeight: 900,
                              color: "#1A3A8F",
                            }}
                          >
                            {cnt}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: KELOLA ADMIN (Admin General only) ─────────────── */}
          {activeTab === "users" && isGeneral && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 14, color: "#5A6E8C" }}>
                  Daftar akun admin yang terdaftar di sistem
                </div>
                <button
                  style={{
                    padding: "8px 18px",
                    borderRadius: 9,
                    border: "none",
                    background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  + Tambah Admin
                </button>
              </div>
              {admins
                .filter((a) => a.role === "SERVICE_ADMIN")
                .map((a) => {
                  const ticketCount = tickets.filter(
                    (t) => t.assignedToId === a.id,
                  ).length;
                  return (
                    <div
                      key={a.id}
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        padding: "16px 20px",
                        border: "1.5px solid #C8D8EE",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        boxShadow: "0 1px 8px rgba(26,58,143,0.05)",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "#E8EEF8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 22,
                          flexShrink: 0,
                        }}
                      >
                        🛠️ {/*  sementara */}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#0F1F4B",
                          }}
                        >
                          {a.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#5A6E8C" }}>
                          Admin Layanan ·{" "}
                          {a.assignedServices?.map((s) => s.name).join(", ") ||
                            "-"}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#1A3A8F",
                          fontWeight: 700,
                          background: "#E8EEF8",
                          padding: "4px 12px",
                          borderRadius: 8,
                        }}
                      >
                        {ticketCount} tiket ditangani
                      </div>
                      <button
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: "1.5px solid #C8D8EE",
                          background: "#fff",
                          color: "#5A6E8C",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            zIndex: 9999,
            background: toast.type === "success" ? "#15803D" : "#C0272D",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "inherit",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "fadeUp 0.3s ease",
          }}
        >
          {toast.msg}
          <button
            onClick={() => setToast(null)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "#fff",
              borderRadius: 6,
              cursor: "pointer",
              padding: "2px 8px",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
