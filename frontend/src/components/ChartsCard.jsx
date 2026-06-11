import {
  BarChart, Bar, Cell, XAxis, Tooltip,
  LabelList, ResponsiveContainer
} from "recharts";
import { isoWeekLabel } from "../utils";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const EMERALD = "#10b981";
const MUTED = "#404040";

function buildDailyData(shifts) {
  // Mon=0 … Sun=6 in our display order
  const totals = Array(7).fill(0);
  for (const s of shifts) {
    const d = new Date(s.logged_at);
    const day = d.getUTCDay(); // 0=Sun, 1=Mon, …, 6=Sat
    const idx = day === 0 ? 6 : day - 1; // remap: Mon→0, Sun→6
    totals[idx] += s.amount;
  }
  const todayIdx = (() => {
    const d = new Date().getUTCDay();
    return d === 0 ? 6 : d - 1;
  })();
  return DAY_LABELS.map((label, i) => ({
    label,
    value: Math.round(totals[i] * 100) / 100,
    isToday: i === todayIdx,
  }));
}

function buildWeeklyData(shifts, timeScope) {
  const totals = {};
  for (const s of shifts) {
    totals[s.week_label] = (totals[s.week_label] ?? 0) + s.amount;
  }
  let keys = Object.keys(totals).sort();
  if (timeScope === "all") keys = keys.slice(-8);
  const currentWeek = isoWeekLabel(new Date());
  return keys.map(wk => ({
    label: wk.replace(/^\d{4}-/, ""), // "W24"
    value: Math.round(totals[wk] * 100) / 100,
    isCurrentWeek: wk === currentWeek,
  }));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 13,
        color: "#fff",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <div style={{ color: "#737373", marginBottom: 2 }}>{label}</div>
      <div>RM{payload[0].value.toFixed(2)}</div>
    </div>
  );
}

export default function ChartsCard({ filteredShifts, filter }) {
  const timeScope = filter?.timeScope ?? "week";
  const isWeek = timeScope === "week";

  const data = isWeek
    ? buildDailyData(filteredShifts ?? [])
    : buildWeeklyData(filteredShifts ?? [], timeScope);

  // Dynamic aria-label
  let ariaLabel = "Weekly earnings all time";
  if (isWeek) {
    const max = Math.max(...data.map(d => d.value));
    const maxItem = data.find(d => d.value === max);
    ariaLabel = max > 0 && maxItem
      ? `Daily earnings this week, highest ${maxItem.label} RM${max.toFixed(2)}`
      : "Daily earnings this week";
  } else if (timeScope === "month") {
    ariaLabel = "Weekly earnings this month";
  }

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="px-4 pb-2"
    >
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 20, right: 4, bottom: 0, left: 4 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#737373", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isToday || entry.isCurrentWeek ? EMERALD : MUTED}
              />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={v => (v > 0 ? `RM${v.toFixed(0)}` : "")}
              style={{ fill: EMERALD, fontSize: 10, fontVariantNumeric: "tabular-nums" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
