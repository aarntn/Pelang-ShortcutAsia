import { useLang } from "../context/LanguageContext";
import { mondayOf, addDays } from "../utils";

const SHORT_LABELS = {
  grab: "Grab",
  foodpanda: "Panda",
  lalamove: "Lala",
  shopeefood: "Shopee",
  maxim: "Maxim",
  indrive: "inDrive",
  other: "Other",
};

// The dominant earnings figure at the top of the dashboard. Labels stay honest:
// past periods show their actual date range, not "This week/month".
export default function HeroMetric({ summary, loading, filter, anchor, isCurrentPeriod, expensesTotal = 0 }) {
  const { t, lang } = useLang();
  const locale = lang === "bm" ? "ms-MY" : "en-MY";

  if (loading) {
    return (
      <div className="px-5 pt-2 pb-4 space-y-2.5">
        <div className="h-2.5 w-14 bg-neutral-800 rounded animate-pulse" />
        <div className="h-12 w-44 bg-neutral-800 rounded-lg animate-pulse" />
        <div className="h-2.5 w-40 bg-neutral-800 rounded animate-pulse" />
      </div>
    );
  }

  const total = summary?.total_earned ?? 0;
  const socso = summary?.total_socso ?? 0;
  const shiftCount = summary?.shift_count ?? 0;

  let scopeLabel;
  if (filter?.timeScope === "month") {
    scopeLabel = isCurrentPeriod
      ? (t.thisMonth ?? "This month")
      : anchor.toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  } else if (filter?.timeScope === "all") {
    scopeLabel = t.allTime ?? "All time";
  } else if (isCurrentPeriod) {
    scopeLabel = t.thisWeek ?? "This week";
  } else {
    const start = mondayOf(anchor);
    const end = addDays(start, 6);
    const sameMonth = start.getUTCMonth() === end.getUTCMonth();
    const startStr = start.toLocaleDateString(locale, {
      day: "numeric",
      month: sameMonth ? undefined : "short",
      timeZone: "UTC",
    });
    const endStr = end.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    scopeLabel = (t.weekOf ?? ((r) => `Week of ${r}`))(`${startStr}–${endStr}`);
  }

  // Lowercase only word labels ("this week", "all time") — date strings stay as-is.
  const lowered =
    isCurrentPeriod || filter?.timeScope === "all" ? scopeLabel.toLowerCase() : scopeLabel;

  const subtitle =
    filter?.platform && filter.platform !== "all"
      ? `${SHORT_LABELS[filter.platform] ?? filter.platform} · ${lowered}`
      : scopeLabel;

  return (
    <div className="px-5 pt-2 pb-4">
      <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-500 mb-1.5">
        {subtitle}
      </p>
      <p
        className="text-5xl font-extrabold text-white leading-none"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span key={Math.round(total * 100)} className="animate-num-pop">
          RM{total.toFixed(2)}
        </span>
      </p>
      <p className="text-sm text-neutral-500 mt-2 leading-snug">
        {t.socsoCredited(socso.toFixed(2))}
        {shiftCount > 0 && <span> &middot; {t.shiftCount(shiftCount)}</span>}
      </p>
      {expensesTotal > 0 && (
        <p
          className="text-sm text-neutral-400 mt-1 leading-snug"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {t.netLine(expensesTotal.toFixed(2), (total - expensesTotal).toFixed(2))}
        </p>
      )}
    </div>
  );
}
