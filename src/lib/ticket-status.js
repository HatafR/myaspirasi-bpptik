export const allowedTransitions = {
  SUBMITTED: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS", "RETURNED"],
  IN_PROGRESS: ["RESOLVED", "RETURNED"],
  RETURNED: ["ASSIGNED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export function validateStatusTransition(currentStatus, nextStatus) {
  const allowed = allowedTransitions[currentStatus] || [];

  return allowed.includes(nextStatus);
}
