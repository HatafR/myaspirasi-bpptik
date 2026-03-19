export function getStatusLabel(status) {
  const labels = {
    submitted: "Menunggu penanganan",
    assigned: "Sudah diteruskan",
    in_progress: "Sedang diproses",
    resolved: "Selesai",
    returned: "Dikembalikan",
    cancelled: "Dibatalkan",
  };

  return labels[status] || status;
}
