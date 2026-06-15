import { useMemo, useState } from "react";
import { useLang } from "../context/LanguageContext";
import { mondayOf, addDays } from "../utils";

const rm = (v) => `RM${v.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const rm0 = (v) => `RM${Math.round(v).toLocaleString("en-MY")}`;

// Last completed week's recap — the cross-platform total no single platform
// app will ever show. Rendered only when last week has at least one shift.
export default function WeeklyDigest({ shifts, expenses }) {
  const { t, lang } = useLang();
  const locale = lang === "bm" ? "ms-MY" : "en-MY";
  const [shared, setShared] = useState(false);

  const digest = useMemo(() => {
    const now = new Date();
    const thisMonday = mondayOf(now);
    const lastMonday = addDays(thisMonday, -7);
    const prevMonday = addDays(thisMonday, -14);

    const between = (iso, a, b) => {
      const d = new Date(iso);
      return d >= a && d < b;
    };

    const lastWeek = shifts.filter((s) => between(s.logged_at, lastMonday, thisMonday));
    if (lastWeek.length === 0) return null;

    const weekBefore = shifts.filter((s) => between(s.logged_at, prevMonday, lastMonday));
    const lastWeekExpenses = (expenses ?? []).filter((e) => between(e.logged_at, lastMonday, thisMonday));

    const total = lastWeek.reduce((s, r) => s + r.amount, 0);
    const prevTotal = weekBefore.reduce((s, r) => s + r.amount, 0);
    const socso = lastWeek.reduce((s, r) => s + r.socso_deducted, 0);
    const expenseTotal = lastWeekExpenses.reduce((s, e) => s + e.amount, 0);

    // Best day by daily total
    const byDay = {};
    for (const s of lastWeek) {
      const d = new Date(s.logged_at);
      const key = d.getUTCDay();
      byDay[key] = (byDay[key] ?? 0) + s.amount;
    }
    const bestDow = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
    const bestDayName = addDays(lastMonday, (Number(bestDow[0]) + 6) % 7).toLocaleDateString(locale, {
      weekday: "long",
      timeZone: "UTC",
    });

    return {
      total,
      prevTotal,
      diff: total - prevTotal,
      hasPrev: weekBefore.length > 0,
      shiftCount: lastWeek.length,
      socso,
      expenseTotal,
      expensePct: total > 0 && expenseTotal > 0 ? Math.round((expenseTotal / total) * 100) : null,
      bestDayName,
      bestDayAmount: bestDow[1],
      rangeLabel: `${lastMonday.toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" })} – ${addDays(lastMonday, 6).toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" })}`,
    };
  }, [shifts, expenses, locale]);

  if (!digest) return null;

  async function handleShare() {
    const text = (t.digestShareText ?? ((total, count, day, dayRm, socso) =>
      `My week on Pelang: ${total} across ${count} shifts. Best day: ${day} (${dayRm}). PERKESO contributed: ${socso}.`))(
      rm(digest.total), digest.shiftCount, digest.bestDayName, rm0(digest.bestDayAmount), rm(digest.socso)
    );
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // user cancelled the share sheet — not an error
    }
  }

  return (
    <section className="mx-4 bg-card border border-card-edge rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-2.5">
        <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-600">
          {t.digestTitle ?? "Last week"}
        </p>
        <p className="text-[11px] text-neutral-600">{digest.rangeLabel}</p>
      </div>

      <div className="flex items-baseline gap-2.5 mb-3">
        <p className="text-2xl font-extrabold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
          {rm(digest.total)}
        </p>
        {digest.hasPrev && digest.prevTotal > 0 && (
          <p
            className={`text-xs font-semibold ${digest.diff >= 0 ? "text-accent" : "text-neutral-500"}`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {digest.diff >= 0 ? "↑" : "↓"} {rm0(Math.abs(digest.diff))}{" "}
            {t.digestVsPrev ?? "vs week before"}
          </p>
        )}
      </div>

      <div className="space-y-1.5 text-[13px] text-neutral-400" style={{ fontVariantNumeric: "tabular-nums" }}>
        <p>
          {(t.digestBestDay ?? ((day, amt) => `Best day: ${day} (${amt})`))(digest.bestDayName, rm0(digest.bestDayAmount))}
        </p>
        {digest.expensePct !== null && (
          <p>
            {(t.digestExpenses ?? ((amt, pct) => `Expenses: ${amt} (${pct}% of earnings)`))(rm(digest.expenseTotal), digest.expensePct)}
          </p>
        )}
        <p>
          {(t.digestSocso ?? ((amt, count) => `PERKESO contributed: ${amt} · ${count} shifts`))(rm(digest.socso), digest.shiftCount)}
        </p>
      </div>

      <button
        onClick={handleShare}
        className="mt-3 w-full min-h-[40px] rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-neutral-300 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
      >
        {shared ? (t.digestCopied ?? "Copied!") : (t.digestShare ?? "Share my week")}
      </button>
    </section>
  );
}
