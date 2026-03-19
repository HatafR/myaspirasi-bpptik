const CategoryBadge = ({ category }) => {
  const map = {
    Kritik:   { bg: "#FEF2F2", color: "#991B1B", icon: "🔴", border: "#FECACA" },
    Saran:    { bg: "#FFFBEB", color: "#92400E", icon: "💡", border: "#FDE68A" },
    Komentar: { bg: "#E8EEF8", color: "#1A3A8F", icon: "💬", border: "#C8D8EE" },
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
