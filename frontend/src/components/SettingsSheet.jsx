import { useEffect, useRef, useState } from "react";
import Sheet from "./Sheet";
import { useLang } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { PLATFORMS } from "../platforms";

const SHORT_LABELS = {
  grab: "Grab",
  foodpanda: "Panda",
  lalamove: "Lala",
  shopeefood: "Shopee",
  maxim: "Maxim",
  indrive: "inDrive",
  other: "Other",
};

function SectionLabel({ children }) {
  return (
    <h3 className="text-[11px] font-medium tracking-widest uppercase text-neutral-600 mb-2">
      {children}
    </h3>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
          checked ? "bg-accent" : "bg-neutral-700"
        }`}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform"
          style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
        />
      </button>
      <span className="text-xs text-neutral-500">{label}</span>
    </label>
  );
}

export default function SettingsSheet({ onClose }) {
  const { t, lang, toggleLang } = useLang();
  const {
    defaultPlatform,
    showZakat,
    weeklyGoal,
    setDefaultPlatform,
    setShowZakat,
    setWeeklyGoal,
    clearData,
  } = useSettings();

  const [goalDraft, setGoalDraft] = useState(weeklyGoal > 0 ? String(weeklyGoal) : "");
  const [armed, setArmed] = useState(false);
  const armTimer = useRef(null);

  useEffect(() => () => clearTimeout(armTimer.current), []);

  function handleClear() {
    if (!armed) {
      setArmed(true);
      armTimer.current = setTimeout(() => setArmed(false), 3000);
      return;
    }
    clearTimeout(armTimer.current);
    clearData();
  }

  function commitGoal() {
    const v = parseFloat(goalDraft);
    if (Number.isFinite(v) && v > 0) {
      setWeeklyGoal(Math.round(v * 100) / 100);
    } else {
      setWeeklyGoal(0);
      setGoalDraft("");
    }
  }

  const langLabel = t.settingsLanguage ?? "Language";
  const platformLabel = t.settingsDefaultPlatform ?? "Default platform";

  return (
    <Sheet onClose={onClose} label={t.settingsTitle ?? "Settings"}>
      <div className="space-y-5">
        {/* Language */}
        <section>
          <SectionLabel>{langLabel}</SectionLabel>
          <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label={langLabel}>
            {[
              { id: "en", label: "English" },
              { id: "bm", label: "Bahasa Melayu" },
            ].map((l) => (
              <button
                key={l.id}
                role="radio"
                aria-checked={lang === l.id}
                onClick={() => lang !== l.id && toggleLang()}
                className={`min-h-[44px] rounded-xl text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                  lang === l.id
                    ? "bg-accent text-neutral-950 font-bold"
                    : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </section>

        {/* Default platform */}
        <section>
          <SectionLabel>{platformLabel}</SectionLabel>
          <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label={platformLabel}>
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                role="radio"
                aria-checked={defaultPlatform === p.id}
                onClick={() => setDefaultPlatform(p.id)}
                className={`min-h-[44px] rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                  defaultPlatform === p.id
                    ? "bg-accent text-neutral-950"
                    : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                }`}
              >
                {SHORT_LABELS[p.id]}
              </button>
            ))}
          </div>
        </section>

        {/* Weekly goal */}
        <section>
          <SectionLabel>{t.settingsWeeklyGoal ?? "Weekly goal"}</SectionLabel>
          <div
            className="flex items-center rounded-xl px-3"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          >
            <span className="text-neutral-500 font-semibold text-sm mr-2 shrink-0">RM</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="10"
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              onBlur={commitGoal}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder="0"
              aria-label={t.settingsWeeklyGoal ?? "Weekly goal"}
              className="w-full bg-transparent py-3 text-base font-bold text-white placeholder-neutral-700 outline-none min-h-[44px]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            />
          </div>
          <p className="text-[11px] text-neutral-600 leading-relaxed mt-2">
            {t.settingsWeeklyGoalHint ??
              "Used for goal pacing on the dashboard. Leave empty to turn it off."}
          </p>
        </section>

        {/* Zakat */}
        <section>
          <SectionLabel>Zakat</SectionLabel>
          <Toggle checked={showZakat} onChange={setShowZakat} label={t.zakatToggle} />
        </section>

        {/* Clear data */}
        <section>
          <SectionLabel>{t.settingsClearData ?? "Clear my data"}</SectionLabel>
          <button
            onClick={handleClear}
            className={`w-full min-h-[44px] rounded-xl text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              armed
                ? "bg-red-950 border border-red-800 text-red-300 font-bold"
                : "bg-neutral-900 text-red-400 hover:bg-neutral-800 font-semibold"
            }`}
          >
            {armed
              ? (t.settingsClearConfirm ?? "Tap again to confirm")
              : (t.settingsClearData ?? "Clear my data")}
          </button>
          <p className="text-[11px] text-neutral-600 leading-relaxed mt-2">
            {t.settingsDataNote ??
              "Your data is stored under an anonymous ID on this device. Clearing it starts fresh and cannot be undone."}
          </p>
        </section>
      </div>
    </Sheet>
  );
}
