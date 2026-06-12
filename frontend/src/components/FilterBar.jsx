import { useEffect, useRef, useState } from "react";
import { PLATFORMS } from "../platforms";
import { useLang } from "../context/LanguageContext";
import { mondayOf, addDays, addMonths } from "../utils";

const SHORT_LABELS = {
  grab: "Grab",
  foodpanda: "Panda",
  lalamove: "Lala",
  shopeefood: "Shopee",
  maxim: "Maxim",
  indrive: "inDrive",
  other: "Other",
};

function RadioGroup({ label, options, value, onChange, focusIdx, setFocusIdx, btnRefs, className, btnExtra }) {
  function handleKeyDown(e, i) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (i + 1) % options.length;
      setFocusIdx(next);
      btnRefs.current[next]?.focus();
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (i - 1 + options.length) % options.length;
      setFocusIdx(prev);
      btnRefs.current[prev]?.focus();
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(options[i].id);
    }
  }

  // When value changes externally, sync focusIdx to the selected option
  useEffect(() => {
    const idx = options.findIndex((o) => o.id === value);
    if (idx !== -1) setFocusIdx(idx);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {options.map((opt, i) => (
        <button
          key={opt.id}
          type="button"
          ref={(el) => {
            btnRefs.current[i] = el;
          }}
          role="radio"
          aria-checked={value === opt.id}
          tabIndex={focusIdx === i ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onClick={() => {
            onChange(opt.id);
            setFocusIdx(i);
          }}
          className={`min-h-[44px] rounded-xl text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
            value === opt.id
              ? "bg-accent text-neutral-950 font-bold"
              : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
          } ${btnExtra ?? ""}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function periodLabelFor(anchor, timeScope, lang) {
  const locale = lang === "bm" ? "ms-MY" : "en-MY";
  if (timeScope === "month") {
    return anchor.toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  }
  const start = mondayOf(anchor);
  const end = addDays(start, 6);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const startStr = start.toLocaleDateString(locale, {
    day: "numeric",
    month: sameMonth ? undefined : "short",
    timeZone: "UTC",
  });
  const endStr = end.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${startStr}–${endStr}`;
}

// filter = { timeScope: "week"|"month"|"all", platform: "all"|platformId }
// onChange = (newFilter) => void
export default function FilterBar({ filter, onChange, anchor, onAnchorChange, isCurrentPeriod }) {
  const { t, lang } = useLang();

  function goBack() {
    onAnchorChange(filter.timeScope === "week" ? addDays(anchor, -7) : addMonths(anchor, -1));
  }

  function goForward() {
    if (isCurrentPeriod) return;
    onAnchorChange(filter.timeScope === "week" ? addDays(anchor, 7) : addMonths(anchor, 1));
  }

  // Fallback strings until Task 16 adds them to i18n.js
  const thisWeek = t.thisWeek ?? "This week";
  const thisMonth = t.thisMonth ?? "This month";
  const allTime = t.allTime ?? "All time";
  const filterAllLabel = t.filterAll ?? "All";

  const TIME_SCOPES = [
    { id: "week", label: thisWeek },
    { id: "month", label: thisMonth },
    { id: "all", label: allTime },
  ];

  const ALL_OPT = { id: "all", label: filterAllLabel };
  const platformOpts = [
    ALL_OPT,
    ...PLATFORMS.map((p) => ({ id: p.id, label: SHORT_LABELS[p.id] ?? p.label })),
  ];

  const [focusTimeIdx, setFocusTimeIdx] = useState(() => {
    const idx = TIME_SCOPES.findIndex((s) => s.id === filter.timeScope);
    return idx !== -1 ? idx : 0;
  });
  const [focusPlatIdx, setFocusPlatIdx] = useState(() => {
    const idx = platformOpts.findIndex((p) => p.id === filter.platform);
    return idx !== -1 ? idx : 0;
  });

  const timeBtnRefs = useRef([]);
  const platBtnRefs = useRef([]);

  return (
    <div className="px-4 pt-3 pb-1">
      {/* Row 1 — time scope segmented control */}
      <RadioGroup
        label="Time scope"
        options={TIME_SCOPES}
        value={filter.timeScope}
        onChange={(timeScope) => onChange({ ...filter, timeScope })}
        focusIdx={focusTimeIdx}
        setFocusIdx={setFocusTimeIdx}
        btnRefs={timeBtnRefs}
        className="grid grid-cols-3 gap-1"
      />
      {/* Period navigator — hidden for "all time" (nothing to page through) */}
      {filter.timeScope !== "all" && (
        <div className="flex items-center justify-center gap-1 mt-2">
          <button
            type="button"
            onClick={goBack}
            aria-label="Previous period"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg
              viewBox="0 0 16 16"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 12L6 8l4-4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => !isCurrentPeriod && onAnchorChange(new Date())}
            className={`min-h-[44px] px-3 text-sm font-semibold rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              isCurrentPeriod ? "text-white cursor-default" : "text-neutral-300 hover:bg-neutral-800"
            }`}
            aria-label={isCurrentPeriod ? undefined : "Back to current period"}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {periodLabelFor(anchor, filter.timeScope, lang)}
          </button>
          <button
            type="button"
            onClick={goForward}
            disabled={isCurrentPeriod}
            aria-label="Next period"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-400 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg
              viewBox="0 0 16 16"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </div>
      )}
      {/* Row 2 — platform chips */}
      <div className="overflow-x-auto mt-2" style={{ scrollbarWidth: "none" }}>
        <RadioGroup
          label="Platform"
          options={platformOpts}
          value={filter.platform}
          onChange={(platform) => onChange({ ...filter, platform })}
          focusIdx={focusPlatIdx}
          setFocusIdx={setFocusPlatIdx}
          btnRefs={platBtnRefs}
          className="flex gap-1.5 w-max"
          btnExtra="px-3 whitespace-nowrap"
        />
      </div>
    </div>
  );
}
