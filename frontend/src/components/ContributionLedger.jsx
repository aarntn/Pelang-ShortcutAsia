import { useMemo } from "react";
import { useLang } from "../context/LanguageContext";

// Converts the invisible 1.25% per-shift deduction into a visible, growing
// asset: contributed this month, all time, and when the last caruman landed.
export default function ContributionLedger({ shifts }) {
  const { t, lang } = useLang();
  const locale = lang === "bm" ? "ms-MY" : "en-MY";

  const { thisMonth, allTime, lastDate } = useMemo(() => {
    const now = new Date();
    let month = 0;
    let total = 0;
    let last = null;
    for (const s of shifts ?? []) {
      const d = new Date(s.logged_at);
      total += s.socso_deducted;
      if (d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()) {
        month += s.socso_deducted;
      }
      if (!last || d > last) last = d;
    }
    return { thisMonth: month, allTime: total, lastDate: last };
  }, [shifts]);

  return (
    <section className="mx-4 bg-card border border-card-edge rounded-2xl p-4">
      <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-600 mb-3">
        {t.ledgerTitle}
      </p>
      {lastDate ? (
        <>
          <div className="flex items-end gap-6">
            <div>
              <p
                className="text-3xl font-extrabold text-white leading-none"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                RM{thisMonth.toFixed(2)}
              </p>
              <p className="text-xs text-neutral-500 mt-1.5">{t.thisMonth}</p>
            </div>
            <div>
              <p
                className="text-lg font-bold text-neutral-300 leading-none"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                RM{allTime.toFixed(2)}
              </p>
              <p className="text-xs text-neutral-500 mt-1.5">{t.allTime}</p>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-3 pt-3 border-t border-neutral-800">
            {t.ledgerLast(
              lastDate.toLocaleDateString(locale, {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              })
            )}
          </p>
        </>
      ) : (
        <p className="text-sm text-neutral-500">{t.ledgerEmpty}</p>
      )}
    </section>
  );
}
