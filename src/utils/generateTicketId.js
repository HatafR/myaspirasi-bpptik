const generateTicketId = () => {
  return globalThis.crypto.randomUUID();
};

export default generateTicketId;