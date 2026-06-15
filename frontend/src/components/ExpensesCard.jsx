import { useLang } from "../context/LanguageContext";

// Period expenses — what stands between gross and net. Delete is immediate;
// expenses are cheap to re-log, so no undo machinery like shifts have.
// `gross` (period earnings) turns the list into a diagnosis: the expense
// ratio, and an amber flag when fuel alone passes 25% of earnings.
const FUEL_WARN_RATIO = 0.25;

export default function ExpensesCard({ expenses, onDelete, gross = 0 }) {
  const { t, lang } = useLang();
  const locale = lang === "bm" ? "ms-MY" : "en-MY";

  if (!expenses || expenses.length === 0) return null;

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const fuel = expenses.filter((e) => e.category === "fuel").reduce((s, e) => s + e.amount, 0);
  const ratioPct = gross > 0 ? Math.round((total / gross) * 100) : null;
  const fuelWarn = gross > 0 && fuel / gross > FUEL_WARN_RATIO;

  return (
    <section className="mx-4 bg-card border border-card-edge rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-600">
          {t.expensesTitle}
        </p>
        <p
          className="text-sm font-bold text-neutral-300"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          −RM{total.toFixed(2)}
        </p>
      </div>
      {ratioPct !== null && (
        <p className="text-[12px] text-neutral-500 mb-2" style={{ fontVariantNumeric: "tabular-nums" }}>
          {(t.expenseRatioLine ?? ((pct) => `${pct}% of this period's earnings`))(ratioPct)}
        </p>
      )}
      {fuelWarn && (
        <p className="text-[12px] text-amber-400/90 mb-2 leading-snug" style={{ fontVariantNumeric: "tabular-nums" }}>
          {(t.fuelFlag ?? ((pct, fuelRm, grossRm) =>
            `Fuel ate ${pct}% of your earnings (RM${fuelRm} of RM${grossRm}) — above the 25% line worth watching.`))(
            Math.round((fuel / gross) * 100), fuel.toFixed(2), gross.toFixed(2)
          )}
        </p>
      )}
      <ul className="space-y-1">
        {expenses.map((e) => (
          <li key={e.id} className="flex items-center gap-3 min-h-[40px]">
            <span className="flex-1 text-sm text-neutral-400 truncate">
              {t.expenseCategories[e.category] ?? e.category}
              <span className="text-neutral-600">
                {" · "}
                {new Date(e.logged_at).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                })}
              </span>
            </span>
            <span
              className="text-sm font-semibold text-white"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              −RM{e.amount.toFixed(2)}
            </span>
            <button
              onClick={() => onDelete(e)}
              aria-label={t.deleteExpenseLabel}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-neutral-600 hover:text-red-400 hover:bg-neutral-800 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3.5 h-3.5" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
