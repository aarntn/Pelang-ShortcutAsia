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

export function logShift({ userId, platform, amount, loggedDate }) {
  const body = { user_id: userId, platform, amount };
  if (loggedDate) body.logged_date = loggedDate;
  return request("/shifts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchShifts(userId) {
  return request(`/shifts/${encodeURIComponent(userId)}`);
}

export function updateShift({ shiftId, userId, platform, amount, loggedDate }) {
  const body = { user_id: userId };
  if (platform !== undefined) body.platform = platform;
  if (amount !== undefined) body.amount = amount;
  if (loggedDate) body.logged_date = loggedDate;
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

export function importShifts({ userId, shifts }) {
  // shifts: [{ platform, amount, logged_date }]
  return request("/shifts/bulk", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, shifts }),
  });
}

export function logExpense({ userId, category, amount, loggedDate }) {
  const body = { user_id: userId, category, amount };
  if (loggedDate) body.logged_date = loggedDate;
  return request("/expenses", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchExpenses(userId) {
  return request(`/expenses/${encodeURIComponent(userId)}`);
}

export function deleteExpense({ expenseId, userId }) {
  return request(
    `/expenses/${encodeURIComponent(expenseId)}?user_id=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
}

export function ocrShift({ imageBase64, mimeType }) {
  return request("/ocr-shift", {
    method: "POST",
    body: JSON.stringify({ image_base64: imageBase64, mime_type: mimeType }),
  });
}
