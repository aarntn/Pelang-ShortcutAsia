import { useState } from "react";
import { useLang } from "../context/LanguageContext";
import Sheet from "./Sheet";

const MATCH_CAP = 600; // i-Saraan Plus government match, RM/year

function SavingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M19 10c1 0 2 .9 2 2v2c0 .8-.5 1.5-1.2 1.8L19 18l-1 2h-2l-.5-1.5h-5L10 20H8l-1-2.2C5.2 16.7 4 14.9 4 13c0-3.3 3.1-6 7-6 1.3 0 2.5.3 3.6.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="11" r="0.5" fill="currentColor" />
      <path d="M11 4.5c1.5-1 3.5-1 5 0-.5 1.5-1 2.5-2.5 2.5S11.5 6 11 4.5z" strokeLinejoin="round" />
    </svg>
  );
}

function SaraanSheet({ onClose }) {
  const { t } = useLang();
  const [monthly, setMonthly] = useState(50);
  const saved = monthly * 12;
  const match = Math.min(saved, MATCH_CAP);

  return (
    <Sheet onClose={onClose} label="i-Saraan Plus details">
      <h3 className="text-lg font-bold text-white mb-3">{t.epfSheetTitle}</h3>

      {/* Mini-calculator — the interactive version of the insight card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-4">
        <label className="block text-sm font-semibold text-white mb-3">
          {t.epfCalcLabel(monthly)}
        </label>
        <input
          type="range"
          min="10"
          max="200"
          step="10"
          value={monthly}
          onChange={(e) => setMonthly(Number(e.target.value))}
          aria-label={t.epfCalcSlider}
          className="w-full accent-accent min-h-[44px]"
        />
        <p
          className="text-sm text-neutral-300 leading-relaxed mt-2"
          style={{ fontVariantNumeric: "tabular-nums" }}
          aria-live="polite"
        >
          {t.epfCalcResult(saved, match, saved + match)}
        </p>
        {saved > MATCH_CAP && (
          <p className="text-xs text-neutral-500 mt-1.5">{t.epfCalcCapNote}</p>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {t.epfSheetBody.split("\n\n").map((para, i) => (
          <p key={i} className="text-sm text-neutral-400 leading-relaxed">{para}</p>
        ))}
      </div>
      <a
        href="https://www.kwsp.gov.my"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-accent text-neutral-950 font-bold rounded-2xl py-3.5 hover:brightness-110 transition"
      >
        {t.registerKWSP}
      </a>
      <button
        onClick={onClose}
        className="block w-full text-center text-sm text-neutral-500 mt-3 py-2 hover:text-neutral-300"
      >
        {t.dismiss}
      </button>
    </Sheet>
  );
}

export default function SaraanCard() {
  const { t } = useLang();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <section className="mx-4">
      <button
        onClick={() => setSheetOpen(true)}
        className="w-full flex items-start gap-3 bg-card border border-card-edge border-l-4 border-l-amber-400 rounded-2xl p-4 text-left hover:bg-neutral-800/40 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="text-amber-400 mt-0.5 shrink-0">
          <SavingsIcon />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-white">{t.epfLabel}</span>
          <span className="block text-xs text-neutral-500 mt-0.5">{t.epfSub}</span>
        </span>
      </button>

      {sheetOpen && <SaraanSheet onClose={() => setSheetOpen(false)} />}
    </section>
  );
}
