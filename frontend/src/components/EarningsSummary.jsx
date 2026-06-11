import { PLATFORMS, platformColor, platformLabel, timeAgo } from "../platforms";
import { useLang } from "../context/LanguageContext";

const SHORT_LABELS = {
  grab: "Grab", foodpanda: "Panda", lalamove: "Lala",
  shopeefood: "Shopee", maxim: "Maxim", indrive: "inDrive", other: "Other",
};

function StackedBar({ breakdown }) {
  const total = PLATFORMS.reduce((sum, p) => sum + (breakdown[p.id] ?? 0), 0);
  if (total === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="h-2 w-full rounded-full overflow-hidden flex">
        {PLATFORMS.map((p) => {
          const val = breakdown[p.id] ?? 0;
          if (val === 0) return null;
          return (
            <div
              key={p.id}
              style={{
                width: `${(val / total) * 100}%`,
                backgroundColor: p.color,
              }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {PLATFORMS.filter((p) => (breakdown[p.id] ?? 0) > 0).map((p) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-xs text-neutral-400">{p.label}</span>
            <span
              className="text-xs text-white font-semibold"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              RM{(breakdown[p.id] ?? 0).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByDate(shifts, t) {
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const groups = new Map();
  for (const shift of shifts) {
    const d = new Date(shift.logged_at);
    const dStr = d.toDateString();
    let label;
    if (dStr === todayStr) {
      label = t.today;
    } else if (dStr === yesterdayStr) {
      label = t.yesterday;
    } else {
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      label =
        diffDays < 7
          ? t.weekdays[d.getDay()]
          : d.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
    }
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(shift);
  }
  return groups;
}

function LoadingSkeleton() {
  return (
    <section className="mx-4 bg-card border border-card-edge rounded-2xl p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-2.5 w-16 bg-neutral-800 rounded" />
        <div className="h-2 bg-neutral-800 rounded-full" />
        <div className="h-3 w-full bg-neutral-800 rounded" />
        <div className="space-y-2.5 pt-1">
          <div className="h-8 bg-neutral-800 rounded" />
          <div className="h-8 bg-neutral-800 rounded" />
          <div className="h-8 bg-neutral-800 rounded" />
        </div>
      </div>
    </section>
  );
}

export default function EarningsSummary({ filteredShifts, filteredSummary, loading, onEdit, onClearFilters, filter }) {
  const { t } = useLang();

  if (loading) return <LoadingSkeleton />;

  const breakdown = filteredSummary?.breakdown_by_platform ?? {};
  const recent = (filteredShifts ?? []).slice(0, 20);
  const grouped = groupByDate(recent, t);
  const hasBreakdown = PLATFORMS.some((p) => (breakdown[p.id] ?? 0) > 0);
  const isDefaultFilter = !filter || (filter.timeScope === "week" && filter.platform === "all");
  const isEmpty = !loading && (filteredShifts ?? []).length === 0;

  return (
    <section className="mx-4 bg-card border border-card-edge rounded-2xl p-4">
      <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-600 mb-3">
        {t.activity}
      </p>

      {hasBreakdown ? (
        <StackedBar breakdown={breakdown} />
      ) : (
        !isEmpty && <p className="text-sm text-neutral-600 py-1">{t.noShiftsYet}</p>
      )}

      {isEmpty ? (
        <div className="py-8 text-center">
          <p className="text-sm text-neutral-500 mb-3">
            {isDefaultFilter
              ? (t.noShiftsYet ?? "No shifts logged yet.")
              : (() => {
                  const platLabel = filter.platform !== "all"
                    ? (SHORT_LABELS[filter.platform] ?? filter.platform)
                    : null;
                  const msg = platLabel
                    ? (t.noShiftsFiltered && typeof t.noShiftsFiltered === "function"
                        ? t.noShiftsFiltered(platLabel)
                        : `No ${platLabel} shifts in this period.`)
                    : "No shifts in this period.";
                  return msg;
                })()
            }
          </p>
          {!isDefaultFilter && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-accent underline underline-offset-2 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-accent min-h-[44px] px-3"
            >
              {t.clearFilters ?? "Clear filters"}
            </button>
          )}
        </div>
      ) : recent.length > 0 && (
        <div className="mt-4">
          {Array.from(grouped.entries()).map(([dateLabel, dayShifts], groupIndex) => (
            <div key={dateLabel}>
              <p
                className={`text-[11px] font-medium tracking-widest uppercase text-neutral-600 mb-1.5 ${
                  groupIndex > 0 ? "mt-3" : ""
                }`}
              >
                {dateLabel}
              </p>
              <ul className="space-y-0.5">
                {dayShifts.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => onEdit(s)}
                      className="w-full flex items-center gap-2.5 py-2.5 min-h-[44px] text-left rounded-lg px-1 hover:bg-neutral-800/30 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: platformColor(s.platform) }}
                      />
                      <span className="flex-1 text-sm text-neutral-400">
                        {platformLabel(s.platform)}
                      </span>
                      <span
                        className="text-sm font-bold text-white"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        RM{s.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-neutral-600 w-14 text-right shrink-0">
                        {timeAgo(s.logged_at)}
                      </span>
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="w-3.5 h-3.5 text-neutral-700 shrink-0"
                      >
                        <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
