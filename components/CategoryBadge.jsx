const CategoryBadge = ({ category }) => {
  const map = {
    Kritik:   { bg: "#FEF2F2", color: "#991B1B", icon: "🔴", border: "#FECACA" },
    Saran:    { bg: "#FFFBEB", color: "#92400E", icon: "💡", border: "#FDE68A" },
    Komentar: { bg: "#EFF6FF", color: "#1D4ED8", icon: "💬", border: "#BFDBFE" },
  };
  const s = map[category] || map["Komentar"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 999,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: 12, fontWeight: 700, letterSpacing: 0.2,
    }}>
      {s.icon} {category}
    </span>
  );
};
export default CategoryBadge;