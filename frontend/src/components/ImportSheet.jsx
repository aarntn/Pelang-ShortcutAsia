import { useRef, useState } from "react";
import { importShifts } from "../api";
import { useLang } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { platformLabel } from "../platforms";
import Sheet from "./Sheet";

const MAX_ROWS = 200; // matches the backend bulk limit

// Header synonyms across Grab/Foodpanda statement exports, EN + BM.
const DATE_HEADERS = ["date", "tarikh", "transaction date", "payout date", "day"];
const AMOUNT_HEADERS = ["amount", "jumlah", "earnings", "total", "net earnings", "pendapatan", "rm"];
const PLATFORM_HEADERS = ["platform", "source", "app"];

const PLATFORM_ALIASES = {
  grab: "grab", grabfood: "grab", grabcar: "grab",
  foodpanda: "foodpanda", panda: "foodpanda",
  lalamove: "lalamove", lala: "lalamove",
  shopeefood: "shopeefood", shopee: "shopeefood",
  maxim: "maxim",
  indrive: "indrive",
};

function parseDate(raw) {
  const s = raw.trim().replace(/['"]/g, "");
  // YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // DD/MM/YYYY or DD-MM-YYYY (statements in MY are day-first)
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function parseAmount(raw) {
  const v = parseFloat(raw.trim().replace(/['"]/g, "").replace(/^rm\s*/i, "").replace(/,/g, ""));
  return Number.isFinite(v) && v > 0 && v <= 10_000 ? Math.round(v * 100) / 100 : null;
}

// Returns { rows: [{platform, amount, logged_date}], skipped: number } or { error }.
function parseCsv(text, fallbackPlatform) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { error: true };
  const delim = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";

  const headerCells = lines[0].split(delim).map((c) => c.trim().replace(/['"]/g, "").toLowerCase());
  const findCol = (names) => headerCells.findIndex((h) => names.some((n) => h === n || h.includes(n)));
  let dateCol = findCol(DATE_HEADERS);
  let amountCol = findCol(AMOUNT_HEADERS);
  const platformCol = findCol(PLATFORM_HEADERS);

  // No recognizable header: assume bare [date, amount] rows and keep line 0 as data.
  let startRow = 1;
  if (dateCol === -1 || amountCol === -1) {
    dateCol = 0;
    amountCol = 1;
    startRow = 0;
  }

  // Today in local time — same bound the date picker uses.
  const todayStr = new Date().toLocaleDateString("en-CA");
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 1);
  const minStr = minDate.toLocaleDateString("en-CA");

  const rows = [];
  let skipped = 0;
  for (let i = startRow; i < lines.length; i++) {
    const cells = lines[i].split(delim);
    const logged_date = parseDate(cells[dateCol] ?? "");
    const amount = parseAmount(cells[amountCol] ?? "");
    if (!logged_date || amount === null || logged_date > todayStr || logged_date < minStr) {
      skipped++;
      continue;
    }
    let platform = fallbackPlatform;
    if (platformCol !== -1 && cells[platformCol]) {
      const key = cells[platformCol].trim().replace(/['"]/g, "").toLowerCase();
      platform = PLATFORM_ALIASES[key] ?? "other";
    }
    rows.push({ platform, amount, logged_date });
  }
  if (rows.length === 0) return { error: true, skipped };
  return { rows: rows.slice(0, MAX_ROWS), skipped: skipped + Math.max(0, rows.length - MAX_ROWS) };
}

export default function ImportSheet({ userId, onClose, onImported }) {
  const { t, lang } = useLang();
  const { defaultPlatform } = useSettings();
  const locale = lang === "bm" ? "ms-MY" : "en-MY";
  const fileRef = useRef(null);
  const [parsed, setParsed] = useState(null); // { rows, skipped } | { error }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const text = await file.text();
    setParsed(parseCsv(text, defaultPlatform));
  }

  async function handleConfirm() {
    if (!parsed?.rows || busy) return;
    setBusy(true);
    setError(null);
    try {
      await importShifts({ userId, shifts: parsed.rows });
      onImported(parsed.rows.length);
      onClose();
    } catch (err) {
      console.error(err);
      setError(t.networkError);
      setBusy(false);
    }
  }

  const rows = parsed?.rows;
  const total = rows?.reduce((s, r) => s + r.amount, 0) ?? 0;
  // CSV row order is arbitrary — derive the range, don't assume sorting.
  const dates = rows?.map((r) => r.logged_date).sort() ?? [];
  const fmtDate = (d) =>
    new Date(d + "T00:00:00Z").toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <Sheet onClose={onClose} label={t.importTitle}>
      <h3 className="text-lg font-bold text-white mb-1">{t.importTitle}</h3>
      <p className="text-xs text-neutral-500 leading-relaxed mb-4">{t.importHint}</p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv,.txt"
        onChange={handleFile}
        className="hidden"
        aria-hidden="true"
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full min-h-[44px] rounded-xl border border-dashed border-neutral-700 text-sm font-semibold text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors py-3 mb-4 focus-visible:outline-2 focus-visible:outline-accent"
      >
        {rows ? t.importPickAnother : t.importPickFile}
      </button>

      {parsed?.error && <p className="text-xs text-red-400 mb-3">{t.importParseError}</p>}

      {rows && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-4">
          <p className="text-sm font-bold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
            {t.importPreview(rows.length, total.toFixed(2))}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {fmtDate(dates[0])} – {fmtDate(dates[dates.length - 1])}
          </p>
          {parsed.skipped > 0 && (
            <p className="text-xs text-amber-400 mt-1.5">{t.importSkipped(parsed.skipped)}</p>
          )}
          <ul className="mt-3 pt-3 border-t border-neutral-800 space-y-1.5 max-h-36 overflow-y-auto">
            {rows.slice(0, 8).map((r, i) => (
              <li key={i} className="flex justify-between text-xs text-neutral-400" style={{ fontVariantNumeric: "tabular-nums" }}>
                <span>{fmtDate(r.logged_date)} · {platformLabel(r.platform)}</span>
                <span className="text-white font-semibold">RM{r.amount.toFixed(2)}</span>
              </li>
            ))}
            {rows.length > 8 && (
              <li className="text-xs text-neutral-600">{t.importMore(rows.length - 8)}</li>
            )}
          </ul>
        </div>
      )}

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={!rows || busy || !userId}
        className="w-full h-12 rounded-xl bg-accent text-neutral-950 font-bold text-[15px] disabled:opacity-40 transition-all hover:brightness-105 focus-visible:outline-2 focus-visible:outline-white"
      >
        {busy ? t.saving : rows ? t.importConfirm(rows.length) : t.importConfirmEmpty}
      </button>
      <button
        onClick={onClose}
        className="block w-full text-center text-sm text-neutral-500 mt-3 py-2 hover:text-neutral-300"
      >
        {t.cancel}
      </button>
    </Sheet>
  );
}
