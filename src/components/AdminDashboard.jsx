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
  onClick,
  isActive = false,
}) => (
  <div
    onClick={onClick}
    style={{
      background: "#fff",
      borderRadius: 14,
      padding: "16px 18px",
      border: isActive ? `2px solid ${color}` : "1px solid #C8D8EE",
      boxShadow: isActive ? `0 4px 14px ${color}33` : "0 2px 12px rgba(26,58,143,0.06)",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s",
      transform: isActive ? "translateY(-2px)" : "none",
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
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [sidebarOpen, setSidebar] = useState(false);
  const [toast, setToast] = useState(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const dropdownRef = useRef(null);
  const [loadingStatus, setLoadingStatus] = useState(null);

  // ── Service Master State
  const [services, setServices] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    icon: "🛠️",
    color: "#1A3A8F",
    bgColor: "#E8EEF8",
    requiresManualAssignment: false,
    assignedAdminId: "",
  });

  // ── Admin Management State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminForm, setAdminForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "SERVICE_ADMIN",
    serviceIds: [],
  });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: "", id: null, name: "" });


  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      setMounted(true);

      try {
        // Ambil data user dari cookie session
        const meRes = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!meRes.ok) {
          router.push("/login");
          return;
        }

        const meResult = await meRes.json();
        if (!meResult.success) {
          router.push("/login");
          return;
        }

        const u = meResult.data;
        setUser(u);

        const res = await fetch("/api/tickets", {
          credentials: "include",
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
          const adminRes = await fetch(
            `/api/admins?type=all${u.role === "SUPER_ADMIN" ? "&all=true" : ""}`,
            { credentials: "include" },
          );

          const adminResult = await adminRes.json();

          if (!adminResult.success) {
            throw new Error(adminResult.message);
          }

          setAdmins(adminResult.data);
        }

        if (u.role === "SUPER_ADMIN") {
          const serviceRes = await fetch("/api/admin/services?all=true", {
            credentials: "include",
          });
          const serviceResult = await serviceRes.json();
          if (serviceResult.success) {
            setServices(serviceResult.data);
          }
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
    setSelectedAdminId(null);
    setShowAdminDropdown(false);
    setAdminSearch("");
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
    const normalizedStatus = String(ticket.status || "").toLowerCase();
    console.log("Normalized Status:", normalizedStatus);

    if (normalizedStatus === "returned") {
      return admins;
    }

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
  const isSuper = user.role === "SUPER_ADMIN";
  const myTickets = tickets;
  const filtered = myTickets.filter((t) => {
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchSentiment =
      filterSentiment === "all" ||
      t.sentiment?.toUpperCase() === filterSentiment.toUpperCase() ||
      (filterSentiment === "Netral" && !t.sentiment);
    const matchCategory =
      filterCategory === "all" ||
      t.category?.toUpperCase() === filterCategory.toUpperCase() ||
      (filterCategory === "Komentar" && !t.category);
    const matchSearch =
      !search ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.message.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSentiment && matchCategory && matchSearch;
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

  const sentimentStats = {
    Positif: count((t) => t.sentiment?.toUpperCase() === "POSITIF"),
    Netral: count((t) => !t.sentiment || t.sentiment?.toUpperCase() === "NETRAL"),
    Negatif: count((t) => t.sentiment?.toUpperCase() === "NEGATIF"),
  };

  const categoryStats = {
    Kritik: count((t) => t.category?.toUpperCase() === "KRITIK"),
    Saran: count((t) => t.category?.toUpperCase() === "SARAN"),
    Komentar: count((t) => !t.category || t.category?.toUpperCase() === "KOMENTAR"),
  };

  // ── Actions
  const updateStatus = async (ticketId, newStatus) => {
    setLoadingStatus(`${ticketId}-${newStatus}`);

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
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
    } finally {
      setLoadingStatus(null);
    }
  };

  const assignTicket = async (ticketId, adminId) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    const isEdit = !!editingService;
    const url = isEdit ? `/api/admin/services/${editingService.id}` : "/api/admin/services";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceForm),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      if (isEdit) {
        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? result.data : s)),
        );
        showToast("✅ Layanan berhasil diperbarui");
      } else {
        setServices((prev) => [result.data, ...prev]);
        showToast("✅ Layanan baru berhasil ditambahkan");
      }

      setShowServiceModal(false);
      setEditingService(null);
      setServiceForm({
        name: "",
        description: "",
        icon: "🛠️",
        color: "#1A3A8F",
        bgColor: "#E8EEF8",
        requiresManualAssignment: false,
        assignedAdminId: "",
      });
    } catch (err) {
      showToast(`❌ Gagal: ${err.message}`, "error");
    }
  };

  const handleDeleteService = (id, name) => {
    setConfirmDelete({ show: true, type: "services", id, name });
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    const isEdit = !!editingAdmin;
    const url = isEdit ? `/api/admins/${editingAdmin.id}` : "/api/admins";
    const method = isEdit ? "PATCH" : "POST";

    if (
      !adminForm.name ||
      !adminForm.username ||
      (!isEdit && !adminForm.password) ||
      !adminForm.role
    ) {
      showToast("❌ Mohon lengkapi data wajib", "error");
      return;
    }

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminForm),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      if (isEdit) {
        setAdmins((prev) =>
          prev.map((a) => (a.id === editingAdmin.id ? result.data : a)),
        );
        showToast("✅ Akun admin berhasil diperbarui");
      } else {
        setAdmins((prev) => [result.data, ...prev]);
        showToast("✅ Akun admin baru berhasil ditambahkan");
      }

      setShowAdminModal(false);
      setEditingAdmin(null);
    } catch (err) {
      showToast(`❌ Gagal: ${err.message}`, "error");
    }
  };

  const handleDeleteAdmin = (id, name) => {
    setConfirmDelete({ show: true, type: "admins", id, name });
  };

  const executeSoftDelete = async () => {
    const { type, id } = confirmDelete;
    setConfirmDelete({ show: false, type: "", id: null, name: "" });

    try {
      const targetUrl = type === "services" ? `/api/admin/services/${id}` : `/api/${type}/${id}`;
      const res = await fetch(targetUrl, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: false })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Error ${res.status}`);
      }

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      if (type === "admins") {
        setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: false } : a)));
        showToast("✅ Akun admin telah dinonaktifkan");
      } else {
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: false } : s)));
        showToast("✅ Layanan telah dinonaktifkan");
      }
    } catch (err) {
      console.error(`Delete ${type} failed:`, err);
      showToast(`❌ Gagal: ${err.message}`, "error");
    }
  };


  const getServiceName = (ticket) =>
    ticket.service?.name || "Layanan Tidak Diketahui";

  // ── Sidebar nav items
  const navItems = [
    { id: "tickets", icon: "🎫", label: "Tiket Masuk", badge: stats.open },
    ...(isSuper
      ? [
        { id: "users", icon: "👥", label: "Kelola Admin" },
        { id: "services", icon: "🛠️", label: "Kelola Layanan" },
      ]
      : []),
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

                {/* Sentimen Filter Settings */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <StatCard
                    icon="😊"
                    value={sentimentStats.Positif}
                    label="Positif"
                    color="#15803D"
                    bg="#DCFCE7"
                    onClick={() => setFilterSentiment(prev => prev === "Positif" ? "all" : "Positif")}
                    isActive={filterSentiment === "Positif"}
                  />
                  <StatCard
                    icon="😐"
                    value={sentimentStats.Netral}
                    label="Netral"
                    color="#475569"
                    bg="#F1F5F9"
                    onClick={() => setFilterSentiment(prev => prev === "Netral" ? "all" : "Netral")}
                    isActive={filterSentiment === "Netral"}
                  />
                  <StatCard
                    icon="😡"
                    value={sentimentStats.Negatif}
                    label="Negatif"
                    color="#C0272D"
                    bg="#FEF2F2"
                    onClick={() => setFilterSentiment(prev => prev === "Negatif" ? "all" : "Negatif")}
                    isActive={filterSentiment === "Negatif"}
                  />
                </div>

                {/* Kategori Filter Settings */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <StatCard
                    icon="🔴"
                    value={categoryStats.Kritik}
                    label="Kritik"
                    color="#B91C1C"
                    bg="#FEE2E2"
                    onClick={() => setFilterCategory(prev => prev === "Kritik" ? "all" : "Kritik")}
                    isActive={filterCategory === "Kritik"}
                  />
                  <StatCard
                    icon="💡"
                    value={categoryStats.Saran}
                    label="Saran"
                    color="#B45309"
                    bg="#FEF3C7"
                    onClick={() => setFilterCategory(prev => prev === "Saran" ? "all" : "Saran")}
                    isActive={filterCategory === "Saran"}
                  />
                  <StatCard
                    icon="💬"
                    value={categoryStats.Komentar}
                    label="Komentar"
                    color="#1D4ED8"
                    bg="#DBEAFE"
                    onClick={() => setFilterCategory(prev => prev === "Komentar" ? "all" : "Komentar")}
                    isActive={filterCategory === "Komentar"}
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
                        overflow: "visible",
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

                        {/* Attachment */}
                        {t.attachments && t.attachments.length > 0 && (
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
                              Lampiran
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {t.attachments.map((att) => (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    background: "#F8FAFF",
                                    border: "1px solid #C8D8EE",
                                    textDecoration: "none",
                                    fontSize: 12,
                                    color: "#1A3A8F",
                                    fontWeight: 600,
                                  }}
                                >
                                  📎 {att.filename}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

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
                          t.status === "Returned" ? (
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
                                Status Tindakan
                              </div>
                              <div style={{ fontSize: 13, color: "#C0272D", fontWeight: 600, background: "#FEF2F2", padding: "10px 14px", borderRadius: 8, border: "1px solid #FECACA" }}>
                                ⚠️ Tiket dikembalikan. Tindakan lebih lanjut menunggu respon Admin General.
                              </div>
                            </div>
                          ) : (
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
                                      disabled={loadingStatus !== null}
                                      style={{
                                        padding: "6px 14px",
                                        borderRadius: 8,
                                        cursor: loadingStatus !== null ? "not-allowed" : "pointer",
                                        opacity: loadingStatus !== null && loadingStatus !== `${t.id}-${s}` ? 0.6 : 1,
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
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                      }}
                                    >
                                      {loadingStatus === `${t.id}-${s}` ? (
                                        <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                                      ) : (
                                        sm.icon
                                      )}
                                      <span>{s}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )
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
                            t.ticketAuditLogs?.filter(
                              (h) => h.ticketId === t.id && h.type === "STATUS_CHANGED",
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
                                  const mappedStatus = mapToUIStatus(h.toValue);
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
                                            color: sm?.color || "#475569",
                                          }}
                                        >
                                          {mappedStatus}
                                        </span>

                                        <span style={{ color: "#5A6E8C" }}>
                                          {" "}
                                          · {h.actor?.name || "System"}
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

                            {!t.assignedToId || t.status === "Returned" ? (
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
                                      {filteredAdmins.map((a) => {
                                        const isSelected =
                                          selectedAdminId === a.id;
                                        return (
                                          <div
                                            key={a.id}
                                            onClick={() => {
                                              setSelectedAdminId(a.id);
                                            }}
                                            style={{
                                              padding: "6px 8px",
                                              borderRadius: 6,
                                              cursor: "pointer",
                                              fontSize: 12,
                                              background: isSelected
                                                ? "#E0F2FE"
                                                : "transparent",
                                              border: isSelected
                                                ? "1px solid #BAE6FD"
                                                : "none",
                                            }}
                                            onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                              "#F0F5FB")
                                            }
                                            onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                              isSelected
                                                ? "#E0F2FE"
                                                : "transparent")
                                            }
                                          >
                                            👤 {a.name}
                                          </div>
                                        );
                                      })}

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

                                    <button
                                      onClick={async () => {
                                        if (!selectedAdminId) return;
                                        await assignTicket(
                                          t.id,
                                          selectedAdminId,
                                        );
                                        setShowAdminDropdown(false);
                                        setAdminSearch("");
                                        setSelectedAdminId(null);
                                      }}
                                      disabled={!selectedAdminId}
                                      style={{
                                        width: "100%",
                                        marginTop: 8,
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                        border: "1.5px solid #1A3A8F",
                                        background: selectedAdminId
                                          ? "#1A3A8F"
                                          : "#F0F5FB",
                                        color: selectedAdminId
                                          ? "#fff"
                                          : "#94A3B8",
                                        fontWeight: 700,
                                        cursor: selectedAdminId
                                          ? "pointer"
                                          : "not-allowed",
                                        fontSize: 12,
                                      }}
                                    >
                                      {t.status === "Returned"
                                        ? "Assign Ulang Admin"
                                        : "Serahkan ke Admin"}
                                    </button>
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

          {/* ── TAB: KELOLA ADMIN (Admin General only) ─────────────── */}
          {activeTab === "users" && isSuper && (
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
                  onClick={() => {
                    setEditingAdmin(null);
                    setAdminForm({
                      name: "",
                      username: "",
                      email: "",
                      password: "",
                      role: "SERVICE_ADMIN",
                      serviceIds: [],
                    });
                    setShowAdminModal(true);
                  }}
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
                .filter(
                  (a) => a.role === "SERVICE_ADMIN" || a.role === "GENERAL_ADMIN",
                )
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
                        opacity: a.isActive ? 1 : 0.6,
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
                        {a.role === "GENERAL_ADMIN" ? "⚖️" : "🛠️"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#0F1F4B",
                          }}
                        >
                          {a.name}{" "}
                          {!a.isActive && (
                            <span style={{ color: "#C0272D", fontSize: 10 }}>
                              (Nonaktif)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#5A6E8C" }}>
                          {a.role === "GENERAL_ADMIN"
                            ? "Admin General"
                            : "Admin Layanan"}
                          {" · "}
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
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => {
                            setEditingAdmin(a);
                            setAdminForm({
                              name: a.name,
                              username: a.username,
                              email: a.email || "",
                              password: "", // password empty on edit
                              role: a.role,
                              serviceIds: a.assignedServices?.map((s) => s.id) || [],
                            });
                            setShowAdminModal(true);
                          }}
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
                        {a.isActive && (
                          <button
                            onClick={() => handleDeleteAdmin(a.id, a.name)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 8,
                              border: "1.5px solid #FECACA",
                              background: "#FEF2F2",
                              color: "#C0272D",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            Nonaktifkan
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* ── TAB: KELOLA LAYANAN (Super Admin only) ─────────────── */}
          {activeTab === "services" && isSuper && (
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
                  Daftar layanan yang tersedia di sistem
                </div>
                <button
                  onClick={() => {
                    setEditingService(null);
                    setServiceForm({
                      name: "",
                      description: "",
                      icon: "🛠️",
                      color: "#1A3A8F",
                      bgColor: "#E8EEF8",
                      requiresManualAssignment: false,
                      assignedAdminId: "",
                    });
                    setShowServiceModal(true);
                  }}
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
                  + Tambah Layanan
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 16,
                }}
              >
                {services.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      padding: "20px",
                      border: `1.5px solid ${s.isActive ? "#C8D8EE" : "#FEE2E2"}`,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      opacity: s.isActive ? 1 : 0.7,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: s.bgColor || "#E8EEF8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 22,
                        }}
                      >
                        {s.icon || "🛠️"}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => {
                            setEditingService(s);
                            setServiceForm({
                              name: s.name,
                              description: s.description || "",
                              icon: s.icon || "🛠️",
                              color: s.color || "#1A3A8F",
                              bgColor: s.bgColor || "#E8EEF8",
                              requiresManualAssignment:
                                s.requiresManualAssignment,
                              assignedAdminId: s.assignedAdminId || "",
                            });
                            setShowServiceModal(true);
                          }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid #C8D8EE",
                            background: "#fff",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            color: "#1A3A8F",
                          }}
                        >
                          Edit
                        </button>
                        {s.isActive && (
                          <button
                            onClick={() => handleDeleteService(s.id, s.name)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              border: "1px solid #FECACA",
                              background: "#FEF2F2",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              color: "#C0272D",
                            }}
                          >
                            Nonaktifkan
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 16,
                          color: "#1A3A8F",
                        }}
                      >
                        {s.name}{" "}
                        {!s.isActive && (
                          <span style={{ color: "#C0272D", fontSize: 10 }}>
                            (Nonaktif)
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#5A6E8C",
                          marginTop: 4,
                        }}
                      >
                        {s.description || "Tidak ada deskripsi"}
                      </div>
                    </div>

                    <div
                      style={{
                        paddingTop: 12,
                        borderTop: "1px solid #F0F5FB",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontSize: 11, color: "#5A6E8C" }}>
                        Admin:{" "}
                        <span style={{ fontWeight: 700, color: "#0F1F4B" }}>
                          {s.assignedAdmin?.name || "-"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#5A6E8C" }}>
                        {s._count?.tickets || 0} Tiket
                      </div>
                    </div>

                    {s.requiresManualAssignment && (
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#92400E",
                          background: "#FFFBEB",
                          padding: "2px 8px",
                          borderRadius: 4,
                          alignSelf: "flex-start",
                        }}
                      >
                        ⚠️ Manual Assignment
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service Modal */}
      {showServiceModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,31,75,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 500,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {editingService ? "Edit Layanan" : "Tambah Layanan Baru"}
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "#fff",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} style={{ padding: 24 }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#5A6E8C",
                      marginBottom: 6,
                    }}
                  >
                    Nama Layanan *
                  </label>
                  <input
                    required
                    value={serviceForm.name}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, name: e.target.value })
                    }
                    placeholder="Contoh: Layanan IT"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #C8D8EE",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#5A6E8C",
                      marginBottom: 6,
                    }}
                  >
                    Deskripsi
                  </label>
                  <textarea
                    value={serviceForm.description}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Jelaskan cakupan layanan ini..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #C8D8EE",
                      outline: "none",
                      fontFamily: "inherit",
                      minHeight: 80,
                      resize: "vertical",
                    }}
                  />
                </div>

                <div
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#5A6E8C",
                        marginBottom: 6,
                      }}
                    >
                      Icon (Emoji)
                    </label>
                    <input
                      value={serviceForm.icon}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, icon: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1.5px solid #C8D8EE",
                        outline: "none",
                        fontFamily: "inherit",
                        textAlign: "center",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#5A6E8C",
                        marginBottom: 6,
                      }}
                    >
                      Admin Penanggung Jawab
                    </label>
                    <select
                      value={serviceForm.assignedAdminId}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          assignedAdminId: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1.5px solid #C8D8EE",
                        outline: "none",
                        fontFamily: "inherit",
                        background: "#fff",
                      }}
                    >
                      <option value="">Pilih Admin (Opsional)</option>
                      {admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name} ({admin.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#5A6E8C",
                        marginBottom: 6,
                      }}
                    >
                      Warna Icon (Hex)
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={serviceForm.color}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, color: e.target.value })
                        }
                        placeholder="#1A3A8F"
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "1.5px solid #C8D8EE",
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: serviceForm.color,
                          border: "1.5px solid #C8D8EE",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#5A6E8C",
                        marginBottom: 6,
                      }}
                    >
                      Warna Background (Hex)
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={serviceForm.bgColor}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            bgColor: e.target.value,
                          })
                        }
                        placeholder="#E8EEF8"
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "1.5px solid #C8D8EE",
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: serviceForm.bgColor,
                          border: "1.5px solid #C8D8EE",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    id="manualAssign"
                    checked={serviceForm.requiresManualAssignment}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        requiresManualAssignment: e.target.checked,
                      })
                    }
                  />
                  <label
                    htmlFor="manualAssign"
                    style={{ fontSize: 13, fontWeight: 600, color: "#0F1F4B" }}
                  >
                    Butuh penugasan manual oleh admin general
                  </label>
                </div>
              </div>

              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "1.5px solid #C8D8EE",
                    background: "#fff",
                    color: "#5A6E8C",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {editingService ? "Simpan Perubahan" : "Tambah Layanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Management Modal */}
      {showAdminModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,31,75,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 500,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {editingAdmin ? "Edit Akun Admin" : "Tambah Admin Baru"}
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "#fff",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} style={{ padding: 24 }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#5A6E8C",
                      marginBottom: 6,
                    }}
                  >
                    Nama Lengkap *
                  </label>
                  <input
                    required
                    value={adminForm.name}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, name: e.target.value })
                    }
                    placeholder="Nama Admin"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #C8D8EE",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#5A6E8C",
                        marginBottom: 6,
                      }}
                    >
                      Username *
                    </label>
                    <input
                      required
                      value={adminForm.username}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, username: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1.5px solid #C8D8EE",
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#5A6E8C",
                        marginBottom: 6,
                      }}
                    >
                      {editingAdmin ? "Password (Kosongkan jika tetap)" : "Password *"}
                    </label>
                    <input
                      type="password"
                      required={!editingAdmin}
                      value={adminForm.password}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, password: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1.5px solid #C8D8EE",
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#5A6E8C",
                      marginBottom: 6,
                    }}
                  >
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, email: e.target.value })
                    }
                    placeholder="email@komdigi.go.id"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #C8D8EE",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#5A6E8C",
                      marginBottom: 6,
                    }}
                  >
                    Role Admin *
                  </label>
                  <select
                    required
                    value={adminForm.role}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, role: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #C8D8EE",
                      outline: "none",
                      fontFamily: "inherit",
                      background: "#fff",
                    }}
                  >
                    <option value="SERVICE_ADMIN">Admin Layanan</option>
                    <option value="GENERAL_ADMIN">Admin General</option>
                  </select>
                </div>

                {adminForm.role === "SERVICE_ADMIN" && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#5A6E8C",
                        marginBottom: 6,
                      }}
                    >
                      Pilih Layanan yang Ditangani
                    </label>
                    <div
                      style={{
                        maxHeight: 120,
                        overflowY: "auto",
                        border: "1.5px solid #C8D8EE",
                        borderRadius: 10,
                        padding: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {services.map((srv) => (
                        <label
                          key={srv.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={adminForm.serviceIds.includes(srv.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setAdminForm((prev) => ({
                                ...prev,
                                serviceIds: checked
                                  ? [...prev.serviceIds, srv.id]
                                  : prev.serviceIds.filter((id) => id !== srv.id),
                              }));
                            }}
                          />
                          {srv.icon} {srv.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "1.5px solid #C8D8EE",
                    background: "#fff",
                    color: "#5A6E8C",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #1A3A8F, #1E50A2)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {editingAdmin ? "Simpan Perubahan" : "Tambah Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Confirmation Modal */}
      {confirmDelete.show && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,31,75,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 400,
              borderRadius: 20,
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              animation: "fadeIn 0.2s ease-out",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#FEF2F2",
                color: "#C0272D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                margin: "0 auto 16px",
              }}
            >
              ⚠️
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F1F4B", margin: "0 0 8px" }}>
              Konfirmasi Penonaktifan
            </h3>
            <p style={{ fontSize: 14, color: "#5A6E8C", margin: "0 0 24px", lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menonaktifkan <strong>{confirmDelete.name}</strong>? Data tidak akan dihapus, namun akses dan fungsinya akan dihentikan.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDelete({ show: false, type: "", id: null, name: "" })}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1.5px solid #C8D8EE",
                  background: "#fff",
                  color: "#5A6E8C",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flex: 1,
                }}
              >
                Batal
              </button>
              <button
                onClick={executeSoftDelete}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "#C0272D",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flex: 1,
                }}
              >
                Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
