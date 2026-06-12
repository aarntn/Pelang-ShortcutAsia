import { useEffect, useRef, useState } from "react";
import { logShift } from "../api";
import { PLATFORMS } from "../platforms";
import { useLang } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import Sheet from "./Sheet";

const SHORT_LABELS = {
  grab:       "Grab",
  foodpanda:  "Panda",
  lalamove:   "Lala",
  shopeefood: "Shopee",
  maxim:      "Maxim",
  indrive:    "inDrive",
  other:      "Other",
};

export default function ShiftLogger({ userId, onLogged, open, onClose }) {
  const { t } = useLang();
  const { defaultPlatform } = useSettings();
  const [platform, setPlatform] = useState(defaultPlatform);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [logDate, setLogDate] = useState(""); // "" = today (no backdate)
  const [showDate, setShowDate] = useState(false);
  const inputRef = useRef(null);
  const defaultPlatformRef = useRef(defaultPlatform);
  defaultPlatformRef.current = defaultPlatform;

  // Reset only on open — a settings change while the sheet is open must not wipe input.
  useEffect(() => {
    if (open) {
      setPlatform(defaultPlatformRef.current);
      setAmount("");
      setError(null);
      setLogDate("");
      setShowDate(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  function handleClose() {
    setError(null);
    setAmount("");
    onClose?.();
  }

  async function handleSubmit() {
    const value = parseFloat(amount);
    if (!userId || busy) return;
    if (!Number.isFinite(value) || value <= 0) {
      setError(t.amountError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const shift = await logShift({
        userId,
        platform,
        amount: value,
        loggedDate: logDate && logDate !== todayStr ? logDate : undefined,
      });
      onLogged?.(shift);
      handleClose();
    } catch (err) {
      setError(t.networkError);
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const minStr = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const parsedAmount = parseFloat(amount);
  const isValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const confirmLabel = isValid ? t.logAmount(parsedAmount.toFixed(2)) : t.logShift;

  if (!open) return null;

  return (
    <Sheet onClose={handleClose} label={t.logShift}>
      {/* Platform segmented control — 2-row grid */}
      <div
        className="grid grid-cols-4 gap-1 mb-3"
        role="radiogroup"
        aria-label="Platform"
      >
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={platform === p.id}
            onClick={() => setPlatform(p.id)}
            className={`py-2.5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              platform === p.id
                ? "bg-accent text-neutral-950"
                : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
            }`}
          >
            {SHORT_LABELS[p.id]}
          </button>
        ))}
      </div>

      {/* Date chip — defaults to today, tap to backdate */}
      <div className="flex">
        <button
          onClick={() => setShowDate((v) => !v)}
          className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg px-2.5 min-h-[32px] mb-3 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          aria-expanded={showDate}
        >
          {logDate && logDate !== todayStr
            ? new Date(logDate + "T00:00:00Z").toLocaleDateString("en-MY", {
                day: "numeric",
                month: "short",
                timeZone: "UTC",
              })
            : (t.todayChip ?? "Today")}{" "}
          ▾
        </button>
      </div>
      {showDate && (
        <input
          type="date"
          value={logDate || todayStr}
          max={todayStr}
          min={minStr}
          onChange={(e) => setLogDate(e.target.value)}
          aria-label={t.shiftDateLabel ?? "Shift date"}
          className="w-full mb-3 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white min-h-[44px] outline-none focus-visible:outline-2 focus-visible:outline-accent"
          style={{ colorScheme: "dark" }}
        />
      )}

      {/* Amount input */}
      <div
        className="flex items-center rounded-2xl px-4 mb-3 transition-colors"
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
        }}
      >
        <span className="text-neutral-500 font-semibold text-xl mr-2 shrink-0">RM</span>
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="0.00"
          aria-label="Amount earned in ringgit"
          className="w-full bg-transparent py-4 text-3xl font-bold text-white placeholder-neutral-700 outline-none"
          style={{ fontVariantNumeric: "tabular-nums" }}
        />
      </div>

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleClose}
          className="h-12 px-4 rounded-xl bg-neutral-800 text-neutral-400 text-sm font-medium hover:bg-neutral-700 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
        >
          {t.cancel}
        </button>
        <button
          onClick={handleSubmit}
          disabled={busy || !userId || !isValid}
          className="flex-1 h-12 rounded-xl bg-accent text-neutral-950 font-bold text-[15px] disabled:opacity-40 transition-all hover:brightness-105 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white"
        >
          {busy ? t.saving : confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
