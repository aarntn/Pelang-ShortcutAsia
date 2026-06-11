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
