import { useState } from "react";
import { useLang } from "../context/LanguageContext";

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
      className="text-neutral-600 transition-transform shrink-0"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-5 h-5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v18M3 9l9-6 9 6" />
      <path d="M6 12l-3 6h6l-3-6z" />
      <path d="M18 12l-3 6h6l-3-6z" />
    </svg>
  );
}

export default function RightsCard({ defaultExpanded = false }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className="mx-4 bg-card border border-card-edge rounded-2xl overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-neutral-800/40 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
        aria-expanded={expanded}
      >
        <span className="text-accent shrink-0">
          <ScaleIcon />
        </span>
        <span className="flex-1 text-sm font-semibold text-white">
          {t.rightsCardSummary}
        </span>
        <ChevronIcon open={expanded} />
      </button>

      {/* Expanded rights list */}
      {expanded && (
        <div className="px-4 pb-4">
          <ol className="space-y-3">
            {t.rights.map((right, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-[11px] font-bold flex items-center justify-center mt-0.5"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-snug">
                    {right.title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    {right.sub}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-[11px] text-neutral-700 leading-relaxed border-t border-neutral-800 pt-3">
            {t.rightsFootnote}
          </p>
        </div>
      )}
    </section>
  );
}
