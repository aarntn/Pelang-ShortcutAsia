import { useRef } from "react";
import { useLang } from "../context/LanguageContext";

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = { home: HomeIcon, protection: ShieldIcon };

// tab = "home" | "protection"
// onChange = (id) => void
// onLog = () => void (opens the shift logger)
// pulsing = bool (triggers emerald ring burst on shift logged)
export default function TabBar({ tab, onChange, onLog, pulsing }) {
  const { t } = useLang();
  const tabRefs = useRef({});

  // Fallback strings until tabHome/tabProtection are added to i18n.js
  const TABS = [
    { id: "home", label: t.tabHome ?? "Home" },
    { id: "protection", label: t.tabProtection ?? "Protection" },
  ];

  function selectAndFocus(id) {
    onChange(id);
    tabRefs.current[id]?.focus();
  }

  function handleKeyDown(e, i) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      const other = TABS[(i + 1) % TABS.length].id;
      selectAndFocus(other);
    }
    if (e.key === "Home") {
      e.preventDefault();
      selectAndFocus(TABS[0].id);
    }
    if (e.key === "End") {
      e.preventDefault();
      selectAndFocus(TABS[TABS.length - 1].id);
    }
  }

  return (
    <nav
      className="shrink-0 relative px-2"
      style={{ background: "#0a0a0a", borderTop: "1px solid #1a1a1a", height: 64 }}
      aria-label="Main navigation"
    >
      <div role="tablist" aria-label="Views" className="flex items-stretch h-full">
        {TABS.map(({ id, label }, i) => {
          const Icon = ICONS[id];
          const selected = tab === id;
          return [
            // Spacer under the FAB — sits between the two tabs
            i > 0 && <div key={`spacer-${id}`} className="w-14 shrink-0" aria-hidden="true" />,
            <button
              key={id}
              type="button"
              ref={(el) => {
                tabRefs.current[id] = el;
              }}
              role="tab"
              id={`tab-${id}`}
              aria-selected={selected}
              aria-controls={`panel-${id}`}
              tabIndex={selected ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onClick={() => onChange(id)}
              className={`flex-1 min-h-[44px] flex flex-col items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                selected ? "text-accent" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon />
              <span className="text-[10px] font-semibold tracking-wide mt-0.5">{label}</span>
            </button>,
          ];
        })}
      </div>
      {/* Log-shift FAB, absolutely positioned over the spacer */}
      <button
        type="button"
        onClick={onLog}
        aria-label={t.logShift}
        className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 rounded-full bg-accent text-neutral-950 flex items-center justify-center shadow-lg shadow-emerald-950/40 active:scale-95 transition-transform hover:brightness-105 focus-visible:outline-2 focus-visible:outline-white"
      >
        {pulsing && (
          <span
            aria-hidden="true"
            className="animate-fab-ring absolute inset-0 rounded-full bg-accent pointer-events-none"
          />
        )}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
    </nav>
  );
}
