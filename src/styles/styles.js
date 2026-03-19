const s = {
  // Layout
  root: { minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Segoe UI', system-ui, sans-serif" },

  // Navbar
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 32px", height: 64, background: "#fff",
    borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0,
    zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
  },
  navLink: {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 18px",
    borderRadius: 8, border: "none", background: "transparent", color: "#64748B",
    fontWeight: 600, fontSize: 14, cursor: "pointer",
  },
  navLinkActive: { background: "#EFF6FF", color: "#3B82F6" },
  navBadge: {
    background: "#3B82F6", color: "#fff", borderRadius: 999,
    padding: "1px 7px", fontSize: 11, fontWeight: 700,
  },

  // Landing
  page: { maxWidth: 600, margin: "0 auto", padding: "40px 24px 80px" },
  hero: { textAlign: "center", marginBottom: 32 },
  heroBadge: {
    display: "inline-block", background: "#EFF6FF", color: "#3B82F6",
    borderRadius: 999, padding: "4px 16px", fontSize: 13, fontWeight: 600, marginBottom: 16,
  },
  heroTitle: { fontSize: 36, fontWeight: 900, color: "#0F172A", margin: "0 0 12px", lineHeight: 1.15 },
  ticketPreview: {
    background: "linear-gradient(135deg,#1E293B,#334155)",
    borderRadius: 16, padding: "20px 24px", marginBottom: 24,
    display: "flex", flexDirection: "column", gap: 2,
  },

  // Form
  formCard: {
    background: "#fff", borderRadius: 20, padding: 32,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: 24,
  },
  formGroup: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 14, fontWeight: 600, color: "#374151" },
  input: {
    padding: "12px 16px", borderRadius: 10, border: "2px solid #E5E7EB",
    outline: "none", fontSize: 15, color: "#1E293B",
  },
  divisionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  divisionBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    padding: "16px 12px", borderRadius: 12, cursor: "pointer", transition: "all 0.15s",
  },
  textarea: {
    padding: "12px 16px", borderRadius: 10, border: "2px solid #E5E7EB",
    outline: "none", fontSize: 15, color: "#1E293B",
    resize: "vertical", fontFamily: "inherit", lineHeight: 1.6,
  },
  infoBox: {
    display: "flex", alignItems: "flex-start", gap: 12, background: "#F8FAFC",
    borderRadius: 10, padding: "14px 16px", border: "1px solid #E2E8F0",
  },
  btnPrimary: {
    background: "linear-gradient(135deg,#3B82F6,#6366F1)", color: "#fff",
    border: "none", borderRadius: 12, padding: "16px 32px", fontSize: 16,
    fontWeight: 700, cursor: "pointer", width: "100%",
  },

  // Success
  successCard: {
    background: "#fff", borderRadius: 20, padding: 40,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
  },
  successTitle: { fontSize: 26, fontWeight: 800, color: "#0F172A", margin: 0 },
  ticketBox: {
    width: "100%", background: "#F8FAFC", borderRadius: 12, padding: 20,
    display: "flex", flexDirection: "column", gap: 12,
  },
  ticketRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  ticketLabel: { fontSize: 13, color: "#64748B", fontWeight: 500 },
  ticketValue: { fontSize: 14, color: "#1E293B", fontWeight: 600 },

  // Dashboard
  dashPage: { maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" },
  dashHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  dashTitle: { fontSize: 30, fontWeight: 900, color: "#0F172A", margin: "0 0 4px" },
  sectionLabel: { fontSize: 18, fontWeight: 800, color: "#1E293B", marginBottom: 12 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 },
  statCard: {
    background: "#fff", borderRadius: 16, padding: "20px 16px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },

  // Filter & search
  filterTab: {
    padding: "7px 14px", borderRadius: 8, border: "2px solid #E5E7EB",
    background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748B",
  },
  filterTabActive: { background: "#EFF6FF", color: "#3B82F6", borderColor: "#3B82F6" },
  searchInput: {
    padding: "10px 14px", borderRadius: 8, border: "2px solid #E5E7EB",
    fontSize: 14, outline: "none",
  },
};

export default s;