export const allowedTransitions = {
  submitted: ["assigned", "cancelled"],
  assigned: ["in_progress", "returned", "cancelled"],
  in_progress: ["resolved", "returned"],
  returned: [],
  resolved: [],
  cancelled: [],
};

export function validateStatusTransition(currentStatus, nextStatus) {
  const allowed = allowedTransitions[currentStatus] || [];

  return allowed.includes(nextStatus);
}
