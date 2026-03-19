const generateTicketId = () => {
  const date = new Date();
  const dateStr =
    `${date.getFullYear()}` +
    `${String(date.getMonth() + 1).padStart(2, "0")}` +
    `${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `TKT-${dateStr}-${random}`;
};

export default generateTicketId;