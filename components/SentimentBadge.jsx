const SentimentBadge = ({ sentiment }) => {
  const map = {
    Positif: { bg: "#DCFCE7", color: "#15803D", icon: "😊", border: "#BBF7D0" },
    Netral:  { bg: "#F1F5F9", color: "#475569", icon: "😐", border: "#CBD5E1" },
    Negatif: { bg: "#FEE2E2", color: "#B91C1C", icon: "😠", border: "#FECACA" },
  };
  const s = map[sentiment] || map["Netral"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 999,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: 12, fontWeight: 700, letterSpacing: 0.2,
    }}>
      {s.icon} {sentiment}
    </span>
  );
};
export default SentimentBadge;
