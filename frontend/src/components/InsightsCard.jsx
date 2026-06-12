import { useMemo } from "react";
import { useLang } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { mondayOf, addDays } from "../utils";
import { platformLabel } from "../platforms";

const rm = (v) => `RM${v.toFixed(2)}`;
const rm0 = (v) => `RM${Math.round(v)}`;

// Insights are computed from real calendar weeks anchored to "now", NOT the
// filtered view — they answer "what should I do next?". Each rule has a
// data-sufficiency threshold; below it the rule yields nothing. Top 2 by
// fixed priority are shown.
function computeInsights({ shifts, weeklyGoal, t }) {
  const now = new Date();
  const weekStart = mondayOf(now);
  const weekEnd = addDays(weekStart, 7);
  const prevStart = addDays(weekStart, -7);

  const inRange = (s, a, b) => {
    const d = new Date(s.logged_at);
    return d >= a && d < b;
  };
  const thisWeek = shifts.filter((s) => inRange(s, weekStart, weekEnd));
  const lastWeek = shifts.filter((s) => inRange(s, prevStart, weekStart));
  const sum = (arr) => arr.reduce((acc, s) => acc + s.amount, 0);

  const insights = [];

  // 1. Goal pacing — needs weeklyGoal > 0
  if (weeklyGoal > 0) {
    const earned = sum(thisWeek);
    const remaining = weeklyGoal - earned;
    // Days left including today: Mon=1 … Sun=7 → 7 - isoDay + 1
    const isoDay = now.getUTCDay() === 0 ? 7 : now.getUTCDay();
    const daysLeft = 7 - isoDay + 1;
    if (remaining > 0) {
      const perDay = remaining / daysLeft;
      insights.push({
        id: "goal",
        tone: "accent",
        text: (t.insightGoalPace ?? ((togo, perday, days, goal) =>
          `${togo} to go — ${perday}/day across your ${days} remaining day${days === 1 ? "" : "s"} hits ${goal}.`))(
          rm0(remaining), rm0(perDay), daysLeft, rm0(weeklyGoal)
        ),
      });
    } else {
      insights.push({
        id: "goal",
        tone: "accent",
        text: (t.insightGoalHit ?? ((goal) => `Weekly goal hit — ${goal} and counting. Nice.`))(rm0(weeklyGoal)),
      });
    }
  }

  // 2. Week-over-week — needs ≥1 shift in BOTH weeks
  if (thisWeek.length >= 1 && lastWeek.length >= 1) {
    const cur = sum(thisWeek);
    const prev = sum(lastWeek);
    if (prev > 0) {
      const pct = Math.round(((cur - prev) / prev) * 100);
      const up = pct >= 0;
      insights.push({
        id: "wow",
        tone: up ? "accent" : "neutral", // never red — resting isn't a failure
        text: (t.insightWow ?? ((arrow, p, prevRm) => `${arrow} ${p}% vs last week (${prevRm}).`))(
          up ? "↑" : "↓", Math.abs(pct), rm(prev)
        ),
      });
    }
  }

  // 3. Best platform — needs ≥3 shifts on each of ≥2 platforms this calendar month
  const monthShifts = shifts.filter((s) => {
    const d = new Date(s.logged_at);
    return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
  });
  const byPlatform = {};
  for (const s of monthShifts) {
    (byPlatform[s.platform] ??= []).push(s.amount);
  }
  const qualified = Object.entries(byPlatform)
    .filter(([, amounts]) => amounts.length >= 3)
    .map(([id, amounts]) => ({ id, avg: amounts.reduce((a, b) => a + b, 0) / amounts.length }))
    .sort((a, b) => b.avg - a.avg);
  if (qualified.length >= 2) {
    const [best, second] = qualified;
    const ratio = best.avg / second.avg;
    if (ratio >= 1.15) { // don't claim a "best" platform on noise
      insights.push({
        id: "platform",
        tone: "neutral",
        text: (t.insightBestPlatform ?? ((a, x, b) => `${a} is paying you ${x}× more per shift than ${b} this month.`))(
          platformLabel(best.id), ratio.toFixed(1), platformLabel(second.id)
        ),
      });
    }
  }

  // 4. Strongest day — needs ≥2 distinct weeks of data
  const distinctWeeks = new Set(shifts.map((s) => s.week_label));
  if (distinctWeeks.size >= 2) {
    const dayTotals = Array(7).fill(0); // Mon=0 … Sun=6
    const dayWeeks = Array.from({ length: 7 }, () => new Set());
    for (const s of shifts) {
      const d = new Date(s.logged_at);
      const idx = d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1;
      dayTotals[idx] += s.amount;
      dayWeeks[idx].add(s.week_label);
    }
    const avgs = dayTotals.map((tot, i) => ({
      idx: i,
      avg: dayWeeks[i].size > 0 ? tot / dayWeeks[i].size : 0,
    }));
    const best = avgs.reduce((a, b) => (b.avg > a.avg ? b : a));
    if (best.avg > 0) {
      const dayNames = t.weekdaysLong ?? ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
      insights.push({
        id: "day",
        tone: "neutral",
        text: (t.insightBestDay ?? ((day, avg) => `${day} are your best day — ${avg} average.`))(
          dayNames[best.idx], rm0(best.avg)
        ),
      });
    }
  }

  // 5. Protection action — always eligible
  insights.push({
    id: "protection",
    tone: "neutral",
    text: t.insightISaraan ?? "RM50/month into i-Saraan captures the full RM600 government match.",
  });

  return insights.slice(0, 2);
}

export default function InsightsCard({ shifts }) {
  const { t } = useLang();
  const { weeklyGoal } = useSettings();

  const insights = useMemo(
    () => computeInsights({ shifts: shifts ?? [], weeklyGoal, t }),
    [shifts, weeklyGoal, t]
  );

  if (insights.length === 0) return null;

  return (
    <section className="px-4" aria-label={t.insightsLabel ?? "Insights"}>
      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {insights.map((ins) => (
          <div
            key={ins.id}
            className={`shrink-0 w-[260px] bg-card border border-card-edge rounded-2xl p-3.5 ${
              ins.tone === "accent" ? "border-l-4 border-l-accent" : ""
            }`}
          >
            <p className="text-[13px] leading-snug text-neutral-300" style={{ fontVariantNumeric: "tabular-nums" }}>
              {ins.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
