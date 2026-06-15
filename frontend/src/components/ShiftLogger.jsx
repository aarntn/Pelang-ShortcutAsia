import { useEffect, useMemo, useRef, useState } from "react";
import { logShift, logExpense, ocrShift } from "../api";
import { PLATFORMS } from "../platforms";
import { useLang } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import Sheet from "./Sheet";

// Compress an image File to JPEG, max 1280px wide, before base64-encoding.
// Mobile camera photos can be 8–12 MB; Vercel serverless limit is ~4.5 MB body.
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1280;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Canvas compression failed")); return; }
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(",")[1];
            resolve({ base64, mimeType: "image/jpeg" });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

const SHORT_LABELS = {
  grab:       "Grab",
  foodpanda:  "Panda",
  lalamove:   "Lala",
  shopeefood: "Shopee",
  maxim:      "Maxim",
  indrive:    "inDrive",
  other:      "Other",
};

const EXPENSE_CATEGORIES = ["fuel", "data", "maintenance", "other"];

// Compute repeat-chip data from shift history — stable reference via useMemo.
function useRepeatData(shifts) {
  return useMemo(() => {
    if (!shifts || shifts.length === 0) return { lastShift: null, quickAmounts: [] };
    const lastShift = shifts[0]; // already sorted newest-first from API
    // Top 3 amounts by frequency, excluding the last-shift amount to avoid dup
    const freq = {};
    for (const s of shifts) {
      freq[s.amount] = (freq[s.amount] ?? 0) + 1;
    }
    const quickAmounts = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([amt]) => parseFloat(amt))
      .filter((a) => a !== lastShift.amount)
      .slice(0, 3);
    return { lastShift, quickAmounts };
  }, [shifts]);
}

export default function ShiftLogger({ userId, shifts, onLogged, onExpenseLogged, onImport, open, onClose }) {
  const { t, lang } = useLang();
  const { defaultPlatform, customPlatforms } = useSettings();
  const allPlatforms = [
    ...PLATFORMS,
    ...(customPlatforms ?? []).map((p) => ({ id: p.id, label: p.label, color: "#737373" })),
  ];
  const [mode, setMode] = useState("shift"); // "shift" | "expense"
  const [platform, setPlatform] = useState(defaultPlatform);
  const [category, setCategory] = useState("fuel");
  // ATM-style: rawDigits is a string of digit chars representing sen
  // e.g. "1050" → RM 10.50 | "5" → RM 0.05
  const [rawDigits, setRawDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [logDate, setLogDate] = useState(""); // "" = today (no backdate)
  const [showDate, setShowDate] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrResult, setOcrResult] = useState(null); // null | { confidence }
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const defaultPlatformRef = useRef(defaultPlatform);
  defaultPlatformRef.current = defaultPlatform;

  // Derived amount value in RM
  const amountValue = rawDigits ? parseInt(rawDigits, 10) / 100 : 0;
  const displayAmount = rawDigits ? (parseInt(rawDigits, 10) / 100).toFixed(2) : "";

  function appendDigit(d) {
    setRawDigits((prev) => {
      const next = prev + d;
      if (parseInt(next, 10) > 999999) return prev; // cap at RM 9,999.99
      return next;
    });
    setOcrResult(null);
  }
  function removeDigit() {
    setRawDigits((prev) => prev.slice(0, -1));
    setOcrResult(null);
  }
  function setAmountFromFloat(float) {
    setRawDigits(String(Math.round(float * 100)));
  }

  const { lastShift, quickAmounts } = useRepeatData(shifts);

  // Reset only on open — a settings change while the sheet is open must not wipe input.
  useEffect(() => {
    if (open) {
      setMode("shift");
      setPlatform(defaultPlatformRef.current);
      setCategory("fuel");
      setRawDigits("");
      setError(null);
      setLogDate("");
      setShowDate(false);
      setOcrResult(null);
    }
  }, [open]);

  async function handleOcrFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setOcrBusy(true);
    setOcrResult(null);
    setError(null);
    try {
      const { base64, mimeType } = await compressImage(file);
      const result = await ocrShift({ imageBase64: base64, mimeType });
      setOcrResult({ confidence: result.confidence });
      if (result.amount) setAmountFromFloat(result.amount);
      const validPlatformIds = allPlatforms.map((p) => p.id);
      if (result.platform && validPlatformIds.includes(result.platform)) {
        setPlatform(result.platform);
        setMode("shift");
      }
    } catch {
      setError("Screenshot scan failed — enter amount manually.");
    } finally {
      setOcrBusy(false);
    }
  }

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  function handleClose() {
    setError(null);
    setRawDigits("");
    onClose?.();
  }

  function handleRepeat() {
    if (!lastShift) return;
    setPlatform(lastShift.platform);
    setAmountFromFloat(lastShift.amount);
    setMode("shift");
  }

  async function handleSubmit() {
    if (!userId || busy) return;
    if (amountValue <= 0) {
      setError(t.amountError);
      return;
    }
    setBusy(true);
    setError(null);
    const loggedDate = logDate && logDate !== todayStr ? logDate : undefined;
    try {
      if (mode === "expense") {
        const expense = await logExpense({ userId, category, amount: amountValue, loggedDate });
        onExpenseLogged?.(expense);
      } else {
        const shift = await logShift({ userId, platform, amount: amountValue, loggedDate });
        onLogged?.(shift);
      }
      handleClose();
    } catch (err) {
      setError(t.networkError);
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  const todayStr = new Date().toLocaleDateString("en-CA");
  const minStr = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toLocaleDateString("en-CA");
  })();

  const isValid = amountValue > 0;
  const confirmLabel = isValid
    ? (mode === "expense" ? t.logExpenseAmount : t.logAmount)(amountValue.toFixed(2))
    : mode === "expense"
      ? t.logExpense
      : t.logShift;

  if (!open) return null;

  return (
    <Sheet onClose={handleClose} label={mode === "expense" ? t.logExpense : t.logShift}>
      {/* Repeat-last-shift chip — one tap to pre-fill with the most recent shift */}
      {lastShift && mode === "shift" && (
        <button
          onClick={handleRepeat}
          className="w-full flex items-center justify-between bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl px-3.5 py-2.5 mb-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent group"
        >
          <span className="text-xs text-neutral-500 font-medium group-hover:text-neutral-400">
            {t.logAgainLabel ?? "Log again"}
          </span>
          <span className="text-sm font-bold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
            {SHORT_LABELS[lastShift.platform] ?? lastShift.platform} · RM{lastShift.amount.toFixed(2)}
          </span>
        </button>
      )}

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-1 mb-3" role="radiogroup" aria-label="Entry type">
        {[
          { id: "shift", label: t.modeShift },
          { id: "expense", label: t.modeExpense },
        ].map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`py-2 rounded-xl text-xs font-bold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              mode === m.id
                ? "bg-neutral-700 text-white"
                : "bg-neutral-900 text-neutral-500 hover:bg-neutral-800"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "shift" ? (
        <div
          className="grid grid-cols-4 gap-1 mb-3"
          role="radiogroup"
          aria-label="Platform"
        >
          {allPlatforms.map((p) => (
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
              {SHORT_LABELS[p.id] ?? p.label.slice(0, 6)}
            </button>
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-4 gap-1 mb-3"
          role="radiogroup"
          aria-label="Expense category"
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={category === c}
              onClick={() => setCategory(c)}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                category === c
                  ? "bg-accent text-neutral-950"
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              {t.expenseCategories[c]}
            </button>
          ))}
        </div>
      )}

      {/* Date chip */}
      <div className="flex">
        <button
          onClick={() => setShowDate((v) => !v)}
          className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg px-2.5 min-h-[32px] mb-3 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          aria-expanded={showDate}
        >
          {logDate && logDate !== todayStr
            ? new Date(logDate + "T00:00:00Z").toLocaleDateString(
                lang === "bm" ? "ms-MY" : "en-MY",
                { day: "numeric", month: "short", timeZone: "UTC" }
              )
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

      {/* Amount input — ATM/calculator style: digits push left from the decimal */}
      <div
        className="relative flex items-center rounded-2xl px-4 mb-2 cursor-text"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-neutral-500 font-semibold text-xl mr-2 shrink-0 select-none">RM</span>
        {/* Visual display — shows formatted cents value */}
        <span
          aria-hidden="true"
          className={`flex-1 py-4 text-3xl font-bold leading-none select-none ${
            displayAmount ? "text-white" : "text-neutral-700"
          }`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {displayAmount || "0.00"}
        </span>
        {/* Invisible overlay input — captures keyboard focus & events */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          aria-label="Amount in ringgit"
          defaultValue=""
          className="absolute inset-0 opacity-0 w-full rounded-2xl focus:outline-none cursor-text"
          onInput={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            for (const d of digits) appendDigit(d);
            e.target.value = ""; // reset so each onInput only has the new char
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") { e.preventDefault(); removeDigit(); }
            if (e.key === "Delete")    { e.preventDefault(); setRawDigits(""); }
            if (e.key === "Enter")     { e.preventDefault(); handleSubmit(); }
          }}
        />
        {/* Screenshot OCR — only in shift mode */}
        {mode === "shift" && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              disabled={ocrBusy}
              aria-label="Scan earnings screenshot"
              className="relative z-10 shrink-0 ml-1 p-2 rounded-xl text-neutral-500 hover:text-accent disabled:opacity-40 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
            >
              {ocrBusy ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleOcrFile}
            />
          </>
        )}
      </div>

      {/* OCR result badge */}
      {ocrResult && (
        <p className={`text-xs mb-2 px-1 ${ocrResult.confidence === "high" ? "text-accent" : "text-amber-400"}`}>
          {ocrResult.confidence === "high"
            ? "Extracted from screenshot — tap Log to confirm"
            : "Low confidence — please verify the amount before logging"}
        </p>
      )}

      {/* Quick amount chips — top 3 frequent amounts from history */}
      {quickAmounts.length > 0 && mode === "shift" && (
        <div className="flex gap-1.5 mb-3" aria-label="Quick amounts">
          {quickAmounts.map((a) => (
            <button
              key={a}
              onClick={() => setAmountFromFloat(a)}
              className="flex-1 min-h-[36px] rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-400 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-accent"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              RM{a.toFixed(2)}
            </button>
          ))}
        </div>
      )}

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

      {mode === "shift" && onImport && (
        <button
          onClick={() => { handleClose(); onImport(); }}
          className="block w-full text-center text-xs text-neutral-500 hover:text-neutral-300 mt-3 py-2 min-h-[36px] transition-colors focus-visible:outline-2 focus-visible:outline-accent rounded-lg"
        >
          {t.importLink}
        </button>
      )}
    </Sheet>
  );
}
