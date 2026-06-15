import { useMemo } from "react";
import { useLang } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { mondayOf, addDays } from "../utils";
import { platformLabel } from "../platforms";

const rm = (v) => `RM${v.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const rm0 = (v) => `RM${Math.round(v).toLocaleString("en-MY")}`;

const TIME_BUCKETS = ["morning", "afternoon", "evening"]; // 05–11, 12–17, 18–04
function timeBucket(date) {
  const h = date.getUTCHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}

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

  // 0a. Logging gap — the app noticing, not just recording. Fires when the
  // most recent shift is ≥4 days old; points at the importer as the fix.
  if (shifts.length > 0) {
    const lastLogged = new Date(shifts[0].logged_at);
    const gapDays = Math.floor((now - lastLogged) / 86400000);
    if (gapDays >= 4) {
      insights.push({
        id: "gap",
        tone: "accent",
        text: (t.insightGap ?? ((days) =>
          `Nothing logged in ${days} days — forget some shifts? Import a statement from the + menu.`))(gapDays),
      });
    }
  }

  // 0b. Platform dip — this week's per-shift average well below the user's
  // own historical norm. Needs ≥5 historical + ≥2 this-week shifts on the
  // platform; fires below 70% of the norm. Information, not blame.
  {
    const history = shifts.filter((s) => new Date(s.logged_at) < weekStart);
    const histByPlatform = {};
    for (const s of history) (histByPlatform[s.platform] ??= []).push(s.amount);
    const weekByPlatform = {};
    for (const s of thisWeek) (weekByPlatform[s.platform] ??= []).push(s.amount);
    const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    for (const [platform, weekAmounts] of Object.entries(weekByPlatform)) {
      const histAmounts = histByPlatform[platform];
      if (!histAmounts || histAmounts.length < 5 || weekAmounts.length < 2) continue;
      const histAvg = avg(histAmounts);
      const weekAvg = avg(weekAmounts);
      if (weekAvg < histAvg * 0.7) {
        insights.push({
          id: `dip-${platform}`,
          tone: "neutral",
          text: (t.insightDip ?? ((p, cur, usual) =>
            `This week's ${p} average (${cur}) is below your usual ${usual}.`))(
            platformLabel(platform), rm0(weekAvg), rm0(histAvg)
          ),
        });
        break; // one dip nudge max — don't pile on
      }
    }
  }

  // 1. Goal pacing — needs weeklyGoal > 0
  if (weeklyGoal > 0) {
    const earned = sum(thisWeek);
    const remaining = weeklyGoal - earned;
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

  // 2. Week-over-week — needs ≥1 shift in BOTH weeks.
  // A percentage off a tiny base reads as noise ("↑ 2572%"), so beyond ±150%
  // (or when last week was under RM50) switch to the absolute RM difference.
  if (thisWeek.length >= 1 && lastWeek.length >= 1) {
    const cur = sum(thisWeek);
    const prev = sum(lastWeek);
    if (prev > 0) {
      const pct = Math.round(((cur - prev) / prev) * 100);
      const up = pct >= 0;
      const usePct = prev >= 50 && Math.abs(pct) <= 150;
      insights.push({
        id: "wow",
        tone: up ? "accent" : "neutral",
        text: usePct
          ? (t.insightWow ?? ((arrow, p, prevRm) => `${arrow} ${p}% vs last week (${prevRm}).`))(
              up ? "↑" : "↓", Math.abs(pct), rm(prev)
            )
          : (t.insightWowAbs ?? ((arrow, diff, prevRm) => `${arrow} ${diff} vs last week (${prevRm}).`))(
              up ? "↑" : "↓", rm0(Math.abs(cur - prev)), rm(prev)
            ),
      });
    }
  }

  // 3. Best-time pattern — tomorrow's day × time-of-day bucket.
  // Needs ≥3 real-timed shifts on tomorrow's weekday across ≥2 distinct weeks.
  // Backdated shifts (always logged at noon UTC) are excluded from time analysis
  // because we can't know their actual time-of-day.
  const tomorrowDate = addDays(now, 1);
  const tomorrowDow = tomorrowDate.getUTCDay(); // 0=Sun…6=Sat
  const tomorrowDayName = (
    t.weekdaysLong ?? ["Sundays","Mondays","Tuesdays","Wednesdays","Thursdays","Fridays","Saturdays"]
  )[tomorrowDow];
  const tomorrowDayShort = (
    t.weekdaysShort ?? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  )[tomorrowDow];

  // Only include shifts NOT logged at exactly noon UTC (those are backdated/no time info)
  const realTimeShifts = shifts.filter((s) => {
    const d = new Date(s.logged_at);
    return !(d.getUTCHours() === 12 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0);
  });
  const sameDayShifts = realTimeShifts.filter((s) => new Date(s.logged_at).getUTCDay() === tomorrowDow);
  const sameDayWeeks = new Set(sameDayShifts.map((s) => s.week_label));
  if (sameDayShifts.length >= 3 && sameDayWeeks.size >= 2) {
    const bucketTotals = { morning: 0, afternoon: 0, evening: 0 };
    const bucketCounts = { morning: 0, afternoon: 0, evening: 0 };
    for (const s of sameDayShifts) {
      const b = timeBucket(new Date(s.logged_at));
      bucketTotals[b] += s.amount;
      bucketCounts[b]++;
    }
    const bestBucket = TIME_BUCKETS
      .filter((b) => bucketCounts[b] >= 2)
      .map((b) => ({ b, avg: bucketTotals[b] / bucketCounts[b] }))
      .sort((a, b) => b.avg - a.avg)[0];
    if (bestBucket) {
      const bucketLabel = (t.timeBuckets ?? { morning: "morning", afternoon: "afternoon", evening: "evening" })[bestBucket.b];
      insights.push({
        id: "besttime",
        tone: "neutral",
        text: (t.insightBestTime ?? ((day, bucket, avg) =>
          `Tomorrow is ${day} — your ${day} ${bucket} shifts average ${avg}. Just the data.`))(
          tomorrowDayShort, bucketLabel, rm0(bestBucket.avg)
        ),
      });
    }
  }

  // 4. Platform-shift suggestion — per-shift averages by platform this month.
  // Framed as information, not instruction. Needs ≥3 shifts on ≥2 platforms.
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
    .map(([id, amounts]) => ({
      id,
      avg: amounts.reduce((a, b) => a + b, 0) / amounts.length,
      count: amounts.length,
    }))
    .sort((a, b) => b.avg - a.avg);
  if (qualified.length >= 2) {
    const [best, second] = qualified;
    const pct = Math.round(((best.avg - second.avg) / second.avg) * 100);
    if (pct >= 15) {
      insights.push({
        id: "platform",
        tone: "neutral",
        text: (t.insightPlatformSuggestion ?? ((a, aRm, p, b, bRm) =>
          `${a} (${aRm}/shift avg) is ${p}% above ${b} (${bRm}/shift) this month. That's just the data.`))(
          platformLabel(best.id), rm0(best.avg), pct, platformLabel(second.id), rm0(second.avg)
        ),
      });
    }
  }

  // 5. Strongest day — needs ≥2 distinct weeks of data
  const distinctWeeks = new Set(shifts.map((s) => s.week_label));
  if (distinctWeeks.size >= 2) {
    const dayTotals = Array(7).fill(0); // Sun=0 … Sat=6 (UTC)
    const dayWeeks = Array.from({ length: 7 }, () => new Set());
    for (const s of shifts) {
      const d = new Date(s.logged_at);
      const idx = d.getUTCDay();
      dayTotals[idx] += s.amount;
      dayWeeks[idx].add(s.week_label);
    }
    const avgs = dayTotals.map((tot, i) => ({
      idx: i,
      avg: dayWeeks[i].size > 0 ? tot / dayWeeks[i].size : 0,
    }));
    const best = avgs.reduce((a, b) => (b.avg > a.avg ? b : a));
    if (best.avg > 0) {
      const dayNames = t.weekdaysLong ?? ["Sundays","Mondays","Tuesdays","Wednesdays","Thursdays","Fridays","Saturdays"];
      insights.push({
        id: "day",
        tone: "neutral",
        text: (t.insightBestDay ?? ((day, avg) => `${day} are your best day — ${avg} average.`))(
          dayNames[best.idx], rm0(best.avg)
        ),
      });
    }
  }

  // 6. Protection action — always eligible fallback
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
      <div className="space-y-2">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className={`bg-card border border-card-edge rounded-2xl px-4 py-3 ${
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
