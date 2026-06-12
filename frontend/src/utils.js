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

/** UTC Monday 00:00 of the week containing `date`. */
export function mondayOf(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

export function addMonths(date, n) {
  // Anchor to the 1st to avoid end-of-month rollover (Jan 31 + 1mo → Mar 3).
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1));
  return d;
}

export function isSameWeek(a, b) {
  return mondayOf(a).getTime() === mondayOf(b).getTime();
}

export function isSameMonth(a, b) {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}
