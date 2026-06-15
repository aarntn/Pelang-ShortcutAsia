import { useMemo, useState } from "react";
import { useLang } from "../context/LanguageContext";
import { PLATFORMS, platformLabel } from "../platforms";

// Escape any dynamic value interpolated into the generated-statement HTML.
const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const rm0 = (v) => `RM${Math.round(v).toLocaleString("en-MY")}`;
const rm2 = (v) => `RM${v.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function csvEscape(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function printIncomeStatement(shifts, expenses, period, lang) {
  const { year, month } = period; // month is 0-indexed
  const periodShifts = shifts.filter((s) => {
    const d = new Date(s.logged_at);
    return d.getUTCFullYear() === year && d.getUTCMonth() === month;
  });

  if (periodShifts.length === 0) return;

  const locale = lang === "bm" ? "ms-MY" : "en-MY";
  const periodName = new Date(Date.UTC(year, month, 1)).toLocaleDateString(locale, {
    month: "long", year: "numeric", timeZone: "UTC",
  });
  const generatedOn = new Date().toLocaleDateString(locale, {
    day: "numeric", month: "long", year: "numeric",
  });

  // Per-platform breakdown
  const byPlatform = {};
  for (const s of periodShifts) {
    if (!byPlatform[s.platform]) byPlatform[s.platform] = { count: 0, gross: 0, perkeso: 0 };
    byPlatform[s.platform].count++;
    byPlatform[s.platform].gross += s.amount;
    byPlatform[s.platform].perkeso += s.socso_deducted ?? 0;
  }

  const totalGross = periodShifts.reduce((s, x) => s + x.amount, 0);
  const totalPerkeso = periodShifts.reduce((s, x) => s + (x.socso_deducted ?? 0), 0);
  const totalNet = totalGross - totalPerkeso;
  const totalShifts = periodShifts.length;

  const platformRows = Object.entries(byPlatform)
    .sort((a, b) => b[1].gross - a[1].gross)
    .map(([id, d]) => `
      <tr>
        <td>${esc(platformLabel(id))}</td>
        <td class="num">${d.count}</td>
        <td class="num">${rm2(d.gross)}</td>
        <td class="num dim">${rm2(d.perkeso)}</td>
        <td class="num">${rm2(d.gross - d.perkeso)}</td>
      </tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="${lang === "bm" ? "ms" : "en"}">
<head>
<meta charset="UTF-8">
<title>Penyata Pendapatan – ${periodName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#111;background:#fff;padding:48px 52px;max-width:780px;margin:0 auto;font-size:13px;line-height:1.5}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:24px}
  .brand{font-size:22px;font-weight:800;letter-spacing:-0.5px}
  .brand span{color:#10b981}
  .titles{text-align:right}
  .titles h1{font-size:17px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase}
  .titles p{font-size:11px;color:#555;margin-top:2px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 32px;margin-bottom:28px}
  .meta-row{display:flex;flex-direction:column;gap:1px}
  .meta-label{font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#777;font-weight:600}
  .meta-value{font-size:13px;font-weight:600}
  table{width:100%;border-collapse:collapse;margin-bottom:8px}
  thead tr{border-bottom:1.5px solid #111}
  th{font-size:10px;text-transform:uppercase;letter-spacing:0.7px;color:#555;font-weight:700;padding:6px 10px 8px;text-align:left}
  th.num,td.num{text-align:right}
  td{padding:9px 10px;border-bottom:1px solid #e5e5e5;font-size:13px}
  tr.total{border-top:1.5px solid #111;border-bottom:none}
  tr.total td{font-weight:700;padding-top:10px;font-size:13.5px}
  .dim{color:#777}
  .perkeso-note{font-size:10.5px;color:#555;margin-top:12px;line-height:1.6;padding:10px 12px;border-left:3px solid #10b981;background:#f8fffe}
  .disclaimer{font-size:10px;color:#888;margin-top:32px;padding-top:14px;border-top:1px solid #ddd;line-height:1.7}
  .footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:8px}
  .print-btn{display:block;width:100%;margin-top:32px;padding:14px;background:#10b981;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:0.3px}
  @media print{
    body{padding:0}
    .print-btn{display:none}
    @page{margin:15mm}
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">Pe<span>lang</span></div>
    <div class="titles">
      <h1>Penyata Pendapatan</h1>
      <p>Income Statement</p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-row">
      <span class="meta-label">Untuk Tempoh / For the Period</span>
      <span class="meta-value">${periodName}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Dijana Pada / Generated On</span>
      <span class="meta-value">${generatedOn}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Jumlah Syif / Total Shifts</span>
      <span class="meta-value">${totalShifts} syif</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Platform</span>
      <span class="meta-value">${Object.keys(byPlatform).map((id) => esc(platformLabel(id))).join(", ")}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Platform</th>
        <th class="num">Syif</th>
        <th class="num">Pendapatan Kasar<br><span style="font-weight:400;text-transform:none">Gross Earnings</span></th>
        <th class="num">PERKESO<br><span style="font-weight:400;text-transform:none">Contribution</span></th>
        <th class="num">Bersih<br><span style="font-weight:400;text-transform:none">Net</span></th>
      </tr>
    </thead>
    <tbody>
      ${platformRows}
    </tbody>
    <tfoot>
      <tr class="total">
        <td>Jumlah / Total</td>
        <td class="num">${totalShifts}</td>
        <td class="num">${rm2(totalGross)}</td>
        <td class="num dim">${rm2(totalPerkeso)}</td>
        <td class="num">${rm2(totalNet)}</td>
      </tr>
    </tfoot>
  </table>

  <p class="perkeso-note">
    Caruman PERKESO dikira berdasarkan <strong>Akta Perlindungan Pekerja Swasta dan Pekerjaan Sendiri 2017 (Akta 872)</strong>.<br>
    PERKESO contributions calculated under the <strong>Self-Employment Social Security Act 2017 (Act 872)</strong>.
  </p>

  <div class="disclaimer">
    <div class="footer">
      <span>Dijana oleh <strong>Pelang</strong> &mdash; Aplikasi Penjejak Syif Pekerja Gig Malaysia</span>
      <span>${generatedOn}</span>
    </div>
    Penyata ini adalah rekod peribadi yang dijana secara automatik berdasarkan data yang dimasukkan oleh pengguna. Ia bukan dokumen rasmi kerajaan.<br>
    This statement is a personal record automatically generated from user-entered data. It is not an official government document.
  </div>

  <button class="print-btn" onclick="window.print()">
    Simpan sebagai PDF &nbsp;/&nbsp; Save as PDF
  </button>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const win = window.open(blobUrl, "_blank", "width=820,height=700");
  if (!win) return; // pop-up blocked
  win.focus();
  // Revoke after the page has had time to load
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}

export default function RecordsCard({ shifts, expenses }) {
  const { t, lang } = useLang();
  const locale = lang === "bm" ? "ms-MY" : "en-MY";

  const now = new Date();

  // Last 4 months as period chips (index 0 = 3 months ago, index 3 = current)
  const periodChips = useMemo(() => {
    const out = [];
    for (let i = 3; i >= 0; i--) {
      const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const count = shifts.filter((s) => {
        const d = new Date(s.logged_at);
        return d.getUTCFullYear() === anchor.getUTCFullYear() && d.getUTCMonth() === anchor.getUTCMonth();
      }).length;
      out.push({
        year: anchor.getUTCFullYear(),
        month: anchor.getUTCMonth(),
        label: anchor.toLocaleDateString(locale, { month: "short", timeZone: "UTC" }),
        count,
      });
    }
    return out;
  }, [shifts, locale]);

  const [selectedPeriod, setSelectedPeriod] = useState(() => ({
    year: periodChips[3].year,
    month: periodChips[3].month,
  }));

  const selectedChip = periodChips.find(
    (c) => c.year === selectedPeriod.year && c.month === selectedPeriod.month
  );
  const canGenerate = (selectedChip?.count ?? 0) > 0;

  // 3-month bar chart data
  const months = periodChips.slice(1); // last 3 for the chart
  const maxMonth = Math.max(
    ...months.map((c) =>
      shifts
        .filter((s) => {
          const d = new Date(s.logged_at);
          return d.getUTCFullYear() === c.year && d.getUTCMonth() === c.month;
        })
        .reduce((sum, s) => sum + s.amount, 0)
    ),
    1
  );

  const monthsWithTotals = useMemo(() =>
    months.map((c) => ({
      ...c,
      total: shifts
        .filter((s) => {
          const d = new Date(s.logged_at);
          return d.getUTCFullYear() === c.year && d.getUTCMonth() === c.month;
        })
        .reduce((sum, s) => sum + s.amount, 0),
    })),
    [shifts]
  );

  const variance = useMemo(() => {
    const withData = monthsWithTotals.filter((m) => m.total > 0);
    if (withData.length < 2) return null;
    const totals = withData.map((m) => m.total);
    const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
    const sd = Math.sqrt(totals.reduce((a, b) => a + (b - mean) ** 2, 0) / totals.length);
    return Math.round((sd / mean) * 100);
  }, [monthsWithTotals]);

  const hasAnything = shifts.length > 0 || (expenses?.length ?? 0) > 0;

  function handleExport() {
    const header = ["type", "date", "platform_or_category", "amount_rm", "perkeso_rm"];
    const rows = [
      ...shifts.map((s) => [
        "shift",
        new Date(s.logged_at).toISOString().slice(0, 10),
        s.platform,
        s.amount.toFixed(2),
        (s.socso_deducted ?? 0).toFixed(2),
      ]),
      ...(expenses ?? []).map((e) => [
        "expense",
        new Date(e.logged_at).toISOString().slice(0, 10),
        e.category,
        (-e.amount).toFixed(2),
        "",
      ]),
    ].sort((a, b) => a[1].localeCompare(b[1]));

    const csv =
      "﻿" +
      [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pelang-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mx-4 bg-card border border-card-edge rounded-2xl p-4 space-y-4">

      {/* Monthly consistency bars */}
      <div>
        <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-600 mb-3">
          {t.recordsTitle ?? "Income records"}
        </p>
        <div className="grid grid-cols-3 gap-2 mb-2" aria-label={t.consistencyLabel ?? "Monthly income, last 3 months"}>
          {monthsWithTotals.map((m) => (
            <div key={m.label} className="text-center">
              <div className="h-16 flex items-end justify-center mb-1">
                <div
                  className={`w-7 rounded-md ${m.total > 0 ? "bg-accent/70" : "bg-neutral-800"}`}
                  style={{ height: `${Math.max((m.total / maxMonth) * 100, m.total > 0 ? 8 : 4)}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-500">{m.label}</p>
              <p className="text-xs font-bold text-neutral-300" style={{ fontVariantNumeric: "tabular-nums" }}>
                {m.total > 0 ? rm0(m.total) : "—"}
              </p>
            </div>
          ))}
        </div>
        {variance !== null && (
          <p className="text-[12px] text-neutral-500" style={{ fontVariantNumeric: "tabular-nums" }}>
            {(t.consistencyNote ?? ((pct) => `Monthly income varies by ±${pct}%`))(variance)}
          </p>
        )}
      </div>

      {/* Penyata Pendapatan */}
      <div>
        <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-600 mb-1">
          Penyata Pendapatan
        </p>
        <p className="text-[12px] text-neutral-500 leading-relaxed mb-3">
          Proof of income for loan applications, tenancy, or LHDN filing — saves as PDF from your browser.
        </p>

        {/* Period chips */}
        <div className="flex gap-1.5 mb-3">
          {periodChips.map((c) => {
            const active = c.year === selectedPeriod.year && c.month === selectedPeriod.month;
            return (
              <button
                key={`${c.year}-${c.month}`}
                onClick={() => setSelectedPeriod({ year: c.year, month: c.month })}
                className={`flex-1 min-h-[40px] rounded-xl text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                  active
                    ? "bg-accent text-neutral-950"
                    : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                {c.label}
                {c.count > 0 && (
                  <span className={`block text-[10px] font-medium mt-0.5 ${active ? "text-neutral-800" : "text-neutral-600"}`}>
                    {c.count} syif
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => printIncomeStatement(shifts, expenses, selectedPeriod, lang)}
          disabled={!canGenerate}
          className="w-full min-h-[44px] rounded-xl bg-accent text-neutral-950 font-bold text-sm disabled:opacity-30 transition-colors hover:brightness-105 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-white"
        >
          Jana Penyata / Generate Statement
        </button>
        {!canGenerate && (
          <p className="text-[11px] text-neutral-600 mt-1.5 text-center">
            No shifts logged in {selectedChip?.label ?? "this period"}
          </p>
        )}
      </div>

      {/* Raw CSV export */}
      <div>
        <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-600 mb-2">
          {t.recordsExport ?? "Raw data export"}
        </p>
        <button
          onClick={handleExport}
          disabled={!hasAnything}
          className="w-full min-h-[44px] rounded-xl bg-neutral-900 hover:bg-neutral-800 text-sm font-bold text-neutral-200 disabled:opacity-40 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
        >
          {t.recordsExport ?? "Download records (CSV)"}
        </button>
      </div>

    </section>
  );
}
