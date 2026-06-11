import { useState } from "react";
import { useLang } from "../context/LanguageContext";

const TAX_SET_ASIDE = 0.08;
const SOCSO_RATE = 0.0125;
const ZAKAT_RATE = 0.025;
const WEEKS_PER_MONTH = 4.3;

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
          checked ? "bg-accent" : "bg-neutral-700"
        }`}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform"
          style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
        />
      </button>
      <span className="text-xs text-neutral-500">{label}</span>
    </label>
  );
}

export default function ProjectionCard({ summary }) {
  const { t } = useLang();
  const [showZakat, setShowZakat] = useState(false);

  const weekTotal = summary?.total_earned_this_week ?? 0;
  const shiftCount = summary?.shift_count_this_week ?? 0;

  // Hide entirely when there's nothing to project from.
  if (shiftCount === 0 || weekTotal <= 0) return null;

  // Mon=1 … Sun=7 (JS getDay: Sun=0).
  const jsDay = new Date().getDay();
  const daysElapsed = jsDay === 0 ? 7 : jsDay;

  const dailyAvg = weekTotal / daysElapsed;
  const projectedWeekly = dailyAvg * 7;
  const projectedMonthly = projectedWeekly * WEEKS_PER_MONTH;
  const projectedSocso = projectedMonthly * SOCSO_RATE;
  const projectedTax = projectedMonthly * TAX_SET_ASIDE;
  const projectedZakat = projectedMonthly * ZAKAT_RATE;

  const rm = (v) =>
    `RM${v.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section className="mx-4 bg-card border border-card-edge rounded-2xl p-4">
      <h2 className="text-[11px] font-medium tracking-widest uppercase text-neutral-600 mb-3">
        {t.atCurrentPace}
      </h2>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-neutral-400">{t.projectedMonthly}</span>
          <span
            className="text-xl font-extrabold text-white"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {rm(projectedMonthly)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-neutral-400">{t.estSocso}</span>
          <span
            className="text-sm font-bold text-accent"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {rm(projectedSocso)}/month
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-neutral-400">{t.estTax}</span>
          <span
            className="text-sm font-bold text-amber-400"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {rm(projectedTax)}/month
          </span>
        </div>

        {showZakat && (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-neutral-400">{t.estZakat}</span>
            <span
              className="text-sm font-bold text-amber-400"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {rm(projectedZakat)}/month
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-800">
        <Toggle checked={showZakat} onChange={setShowZakat} label={t.zakatToggle} />
      </div>

      <p className="mt-3 text-[11px] text-neutral-700 leading-relaxed">
        {t.projectionNote(daysElapsed)}
      </p>
    </section>
  );
}
