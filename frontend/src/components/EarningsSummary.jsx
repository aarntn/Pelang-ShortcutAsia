import { PLATFORMS, platformColor, platformLabel, timeAgo } from "../platforms";
import { useLang } from "../context/LanguageContext";

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

export default function EarningsSummary({ data, loading }) {
  const { t } = useLang();

  if (loading) return <LoadingSkeleton />;

  const summary = data?.summary;
  const shifts = data?.shifts ?? [];
  const breakdown = summary?.breakdown_by_platform ?? {};
  const recent = shifts.slice(0, 12);
  const grouped = groupByDate(recent, t);
  const hasBreakdown = PLATFORMS.some((p) => (breakdown[p.id] ?? 0) > 0);

  return (
    <section className="mx-4 bg-card border border-card-edge rounded-2xl p-4">
      <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-600 mb-3">
        {t.activity}
      </p>

      {hasBreakdown ? (
        <StackedBar breakdown={breakdown} />
      ) : (
        <p className="text-sm text-neutral-600 py-1">{t.noShiftsYet}</p>
      )}

      {recent.length > 0 && (
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
              <ul className="divide-y divide-neutral-800/50">
                {dayShifts.map((s) => (
                  <li key={s.id} className="flex items-center gap-2.5 py-2.5">
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
