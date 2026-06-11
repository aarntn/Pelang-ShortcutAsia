import { useState } from "react";
import { useLang } from "../context/LanguageContext";
import Sheet from "./Sheet";

const ICONS = {
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
    </svg>
  ),
  savings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M19 10c1 0 2 .9 2 2v2c0 .8-.5 1.5-1.2 1.8L19 18l-1 2h-2l-.5-1.5h-5L10 20H8l-1-2.2C5.2 16.7 4 14.9 4 13c0-3.3 3.1-6 7-6 1.3 0 2.5.3 3.6.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="11" r="0.5" fill="currentColor" />
      <path d="M11 4.5c1.5-1 3.5-1 5 0-.5 1.5-1 2.5-2.5 2.5S11.5 6 11 4.5z" strokeLinejoin="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M12 4L2.5 20h19L12 4z" strokeLinejoin="round" />
      <path d="M12 10v4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  ),
};

const STATUS_STYLES = {
  green: { text: "text-accent", border: "border-l-accent" },
  amber: { text: "text-amber-400", border: "border-l-amber-400" },
  grey: { text: "text-neutral-500", border: "border-l-neutral-600" },
};

function ChevronIcon({ open }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="text-neutral-600 transition-transform"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function StatusRow({ icon, label, subtext, status, onClick }) {
  const s = STATUS_STYLES[status];
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-start gap-3 bg-neutral-900 rounded-xl border-l-4 ${s.border} p-3.5 text-left ${
        onClick
          ? "hover:bg-neutral-800 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-accent"
          : ""
      }`}
    >
      <span className={`${s.text} mt-0.5 shrink-0`}>{ICONS[icon]}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="block text-xs text-neutral-500 mt-0.5">{subtext}</span>
      </span>
    </Tag>
  );
}

function EpfSheet({ onClose }) {
  const { t } = useLang();
  return (
    <Sheet onClose={onClose} label="i-Saraan Plus details">
      <h3 className="text-lg font-bold text-white mb-3">{t.epfSheetTitle}</h3>
      <div className="space-y-3 mb-6">
        {t.epfSheetBody.split("\n\n").map((para, i) => (
          <p key={i} className="text-sm text-neutral-400 leading-relaxed">{para}</p>
        ))}
      </div>
      <a
        href="https://www.kwsp.gov.my"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-accent text-neutral-950 font-bold rounded-2xl py-3.5 hover:brightness-110 transition"
      >
        {t.registerKWSP}
      </a>
      <button
        onClick={onClose}
        className="block w-full text-center text-sm text-neutral-500 mt-3 py-2 hover:text-neutral-300"
      >
        {t.dismiss}
      </button>
    </Sheet>
  );
}

export default function ComplianceCard({ summary }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeThisWeek = (summary?.shift_count_this_week ?? 0) > 0;

  return (
    <section className="mx-4 bg-card border border-card-edge rounded-2xl overflow-hidden">
      {/* Summary row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-neutral-800/40 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
        aria-expanded={expanded}
      >
        <span className={activeThisWeek ? "text-accent" : "text-amber-400"}>
          {ICONS.shield}
        </span>
        <span className="flex-1 text-sm font-semibold text-white leading-snug">
          {activeThisWeek ? t.protectedStatus : t.noCoverage}
        </span>
        <ChevronIcon open={expanded} />
      </button>

      {/* Expanded detail rows */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          <StatusRow
            icon="shield"
            label={t.workAccidentLabel(activeThisWeek)}
            subtext={t.workAccidentSub}
            status={activeThisWeek ? "green" : "amber"}
          />
          <StatusRow
            icon="savings"
            label={t.epfLabel}
            subtext={t.epfSub}
            status="amber"
            onClick={() => setSheetOpen(true)}
          />
          <StatusRow
            icon="warning"
            label={t.unemploymentLabel}
            subtext={t.unemploymentSub}
            status="grey"
          />
        </div>
      )}

      {sheetOpen && <EpfSheet onClose={() => setSheetOpen(false)} />}
    </section>
  );
}
