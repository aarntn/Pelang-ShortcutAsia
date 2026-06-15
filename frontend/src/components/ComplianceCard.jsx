import { useLang } from "../context/LanguageContext";

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M3 8.5l3.5 3.5L13 5" />
    </svg>
  );
}

// Coverage status + what it actually covers. This owns a tab now, so the
// content is the screen — no accordion hiding the only thing on it.
export default function ComplianceCard({ summary }) {
  const { t } = useLang();
  const activeThisWeek = (summary?.shift_count_this_week ?? 0) > 0;

  return (
    <section className="mx-4 bg-card border border-card-edge rounded-2xl p-4">
      {/* Status header */}
      <div className="flex items-center gap-3">
        <span className={activeThisWeek ? "text-accent" : "text-amber-400"}>
          <ShieldIcon />
        </span>
        <span className="flex-1 text-sm font-semibold text-white leading-snug">
          {activeThisWeek ? t.protectedStatus : t.noCoverage}
        </span>
      </div>
      <p className="text-xs text-neutral-500 mt-1.5 ml-8">{t.workAccidentSub}</p>

      {/* Benefits — what "Active" actually buys */}
      <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-600 mt-4 mb-2.5 pt-3 border-t border-neutral-800">
        {t.benefitsTitle}
      </p>
      <ul className="space-y-2.5">
        {t.benefits.map((b, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 text-accent mt-0.5">
              <CheckIcon />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-snug">{b.title}</p>
              <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{b.sub}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-600 leading-relaxed">
        {t.benefitsFootnote}
      </p>
    </section>
  );
}
