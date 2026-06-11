// Thin API client for the FastAPI backend.
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export function logShift({ userId, platform, amount }) {
  return request("/shifts", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, platform, amount }),
  });
}

export function fetchShifts(userId) {
  return request(`/shifts/${encodeURIComponent(userId)}`);
}

export function updateShift({ shiftId, userId, platform, amount }) {
  const body = { user_id: userId };
  if (platform !== undefined) body.platform = platform;
  if (amount !== undefined) body.amount = amount;
  return request(`/shifts/${encodeURIComponent(shiftId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteShift({ shiftId, userId }) {
  return request(
    `/shifts/${encodeURIComponent(shiftId)}?user_id=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
}
