import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useLang } from "./context/LanguageContext";
import { fetchShifts } from "./api";
import ShiftLogger from "./components/ShiftLogger";
import EarningsSummary from "./components/EarningsSummary";
import ProjectionCard from "./components/ProjectionCard";
import ComplianceCard from "./components/ComplianceCard";
import RightsCard from "./components/RightsCard";
import { platformLabel } from "./platforms";

function SignalIcon() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
      <rect x="0" y="8" width="3" height="4" rx="0.5" opacity="0.3" />
      <rect x="4.7" y="5.5" width="3" height="6.5" rx="0.5" opacity="0.3" />
      <rect x="9.3" y="3" width="3" height="9" rx="0.5" opacity="0.3" />
      <rect x="14" y="0" width="3" height="12" rx="0.5" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
      <circle cx="8" cy="10.5" r="1.5" />
      <path
        d="M4.4 7.2A5.2 5.2 0 0111.6 7.2"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M1.4 4.3A9.2 9.2 0 0114.6 4.3"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
      <rect
        x="0.75"
        y="0.75"
        width="20.5"
        height="10.5"
        rx="3.25"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <rect x="2.5" y="2.5" width="15" height="7" rx="1.5" fill="currentColor" />
      <path
        d="M22.5 4.5v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path
        d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusBar() {
  return (
    <div className="shrink-0 relative text-white" style={{ height: 52 }}>
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[10px] z-10 bg-black"
        style={{ width: 126, height: 34, borderRadius: 17 }}
      />
      <div
        className="flex items-end justify-between pb-1.5"
        style={{ height: "100%", padding: "0 28px" }}
      >
        <span className="text-[13px] font-semibold tracking-tight">9:41</span>
        <div className="flex items-center gap-1.5">
          <SignalIcon />
          <WifiIcon />
          <BatteryIcon />
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ summary, loading }) {
  const { t } = useLang();

  if (loading) {
    return (
      <div className="px-5 pt-2 pb-4 space-y-2.5">
        <div className="h-2.5 w-14 bg-neutral-800 rounded animate-pulse" />
        <div className="h-12 w-44 bg-neutral-800 rounded-lg animate-pulse" />
        <div className="h-2.5 w-40 bg-neutral-800 rounded animate-pulse" />
      </div>
    );
  }

  const thisWeek = summary?.total_earned_this_week ?? 0;
  const socso = summary?.total_socso_this_week ?? 0;
  const shiftCount = summary?.shift_count_this_week ?? 0;

  return (
    <div className="px-5 pt-2 pb-4">
      <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-500 mb-1.5">
        {t.thisWeek}
      </p>
      <p
        className="text-5xl font-extrabold text-white leading-none"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        RM{thisWeek.toFixed(2)}
      </p>
      <p className="text-sm text-neutral-500 mt-2 leading-snug">
        {t.socsoCredited(socso.toFixed(2))}
        {shiftCount > 0 && <span> &middot; {t.shiftCount(shiftCount)}</span>}
      </p>
    </div>
  );
}

function Toast({ data }) {
  const { t } = useLang();
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-toast-in absolute top-[60px] left-4 right-4 z-50 bg-card border border-card-edge rounded-2xl px-4 py-3 shadow-2xl"
    >
      <p className="text-sm font-bold text-white">
        RM{data.amount.toFixed(2)} — {platformLabel(data.platform)}
      </p>
      <p className="text-xs text-neutral-400 mt-0.5">
        SOCSO: RM{data.socso_deducted.toFixed(2)} · {t.protectedStatus}
      </p>
    </div>
  );
}

export default function App() {
  const { userId, authError } = useAuth();
  const { t, toggleLang } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadError(null);
      const res = await fetchShifts(userId);
      setData(res);
    } catch (err) {
      console.error(err);
      setLoadError(t.couldntLoad);
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function handleLogged(shift) {
    refresh();
    setToast(shift);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center py-10 px-4"
      style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 30%, #111 0%, #050505 70%)",
      }}
    >
      {/* Phone bezel */}
      <div
        className="relative shrink-0"
        style={{
          width: 390,
          height: 844,
          background: "linear-gradient(160deg, #1c1c1e 0%, #0c0c0c 100%)",
          borderRadius: 54,
          boxShadow:
            "0 0 0 1px #2a2a2a, 0 40px 100px rgba(0,0,0,0.85), inset 0 0 0 1px #333",
        }}
      >
        {/* Volume buttons */}
        <div
          className="absolute bg-[#252525] rounded-l-sm"
          style={{ left: -3, top: 120, width: 3, height: 32 }}
        />
        <div
          className="absolute bg-[#252525] rounded-l-sm"
          style={{ left: -3, top: 168, width: 3, height: 56 }}
        />
        <div
          className="absolute bg-[#252525] rounded-l-sm"
          style={{ left: -3, top: 236, width: 3, height: 56 }}
        />
        {/* Power button */}
        <div
          className="absolute bg-[#252525] rounded-r-sm"
          style={{ right: -3, top: 184, width: 3, height: 80 }}
        />

        {/* Screen */}
        <div
          className="absolute overflow-hidden flex flex-col"
          style={{ inset: 6, borderRadius: 48, background: "#0a0a0a" }}
        >
          {/* Screen glare */}
          <div
            className="absolute inset-0 pointer-events-none z-50"
            style={{
              borderRadius: 48,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 45%)",
            }}
          />

          <StatusBar />

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto phone-scroll relative">
            {toast && <Toast data={toast} />}

            <div className="space-y-3">
              {/* Header */}
              <header className="flex items-center gap-2.5 px-5 pt-2 pb-0">
                <ShieldIcon className="w-[18px] h-[18px] text-accent shrink-0" />
                <h1 className="text-[15px] font-extrabold tracking-tight text-white flex-1">
                  {t.appName}
                </h1>
                <button
                  onClick={toggleLang}
                  className="text-[11px] font-bold tracking-widest text-neutral-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-accent"
                  aria-label="Toggle language"
                >
                  {t.langToggle}
                </button>
              </header>

              {authError && (
                <p className="text-xs text-red-400 px-5">
                  {t.signInFailed(authError)}
                </p>
              )}
              {loadError && (
                <p className="text-xs text-red-400 px-5">{loadError}</p>
              )}

              <HeroMetric summary={data?.summary} loading={loading || !userId} />
              <EarningsSummary data={data} loading={loading || !userId} />
              <ProjectionCard summary={data?.summary} />
              <ComplianceCard summary={data?.summary} />
              <RightsCard />

              <footer className="px-5 pt-1 pb-3">
                <p className="text-[11px] text-neutral-700 leading-relaxed">
                  {t.footer}
                </p>
              </footer>

              <div className="h-4" />
            </div>
          </div>

          <ShiftLogger userId={userId} onLogged={handleLogged} />

          {/* Home indicator */}
          <div
            className="shrink-0 flex justify-center pb-2 pt-1"
            style={{ background: "#0a0a0a" }}
          >
            <div className="w-32 h-1 bg-neutral-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
