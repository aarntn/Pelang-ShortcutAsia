/**
 * Returns an ISO 8601 week label (e.g. "2026-W24") matching Python's
 * datetime.isocalendar() output used by the backend's week_label field.
 */
export function isoWeekLabel(date = new Date()) {
  const raw = date instanceof Date ? date : new Date(date);
  // Work in UTC to match server-side computation.
  const d = new Date(Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate()));
  const dayOfWeek = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek); // advance to Thursday
  const year = d.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((d - startOfYear) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
