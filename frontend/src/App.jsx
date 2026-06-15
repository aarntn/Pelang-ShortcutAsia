import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useLang } from "./context/LanguageContext";
import { fetchShifts, deleteShift, fetchExpenses, deleteExpense } from "./api";
import ShiftLogger from "./components/ShiftLogger";
import ImportSheet from "./components/ImportSheet";
import ExpensesCard from "./components/ExpensesCard";
import WeeklyDigest from "./components/WeeklyDigest";
import RecordsCard from "./components/RecordsCard";
import EarningsSummary from "./components/EarningsSummary";
import ProjectionCard from "./components/ProjectionCard";
import ComplianceCard from "./components/ComplianceCard";
import ContributionLedger from "./components/ContributionLedger";
import AccidentCard from "./components/AccidentCard";
import SaraanCard from "./components/SaraanCard";
import ProtectionLinks from "./components/ProtectionLinks";
import RightsCard from "./components/RightsCard";
import EditShiftSheet from "./components/EditShiftSheet";
import SettingsSheet from "./components/SettingsSheet";
import FilterBar from "./components/FilterBar";
import ChartsCard from "./components/ChartsCard";
import InsightsCard from "./components/InsightsCard";
import TabBar from "./components/TabBar";
import StatusBar from "./components/StatusBar";
import PhoneFrame from "./components/PhoneFrame";
import HeroMetric from "./components/HeroMetric";
import Toast from "./components/Toast";
import { mondayOf, addDays, isSameWeek, isSameMonth } from "./utils";
import { useSettings } from "./context/SettingsContext";
import { useEveningReminder } from "./useEveningReminder";

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

export default function App() {
  const { userId, authError } = useAuth();
  const { t, toggleLang } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [editingShift, setEditingShift] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const pendingDeleteRef = useRef(null);
  const deleteTimer = useRef(null);
  const [filter, setFilter] = useState({ timeScope: "week", platform: "all" });
  const [anchor, setAnchor] = useState(() => new Date());
  const [tab, setTab] = useState("home");
  const [logOpen, setLogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logPulse, setLogPulse] = useState(false);
  const pulseTimer = useRef(null);
  const [expenses, setExpenses] = useState([]);

  const { eveningReminder } = useSettings();

  const allShifts = data?.shifts ?? [];

  useEveningReminder({
    enabled: eveningReminder,
    shifts: allShifts,
    title: t.reminderTitle ?? "Worked today?",
    body: t.reminderBody ?? "Log it in 2 taps before you forget.",
  });

  const visibleShifts = useMemo(
    () => (pendingDelete ? allShifts.filter((s) => s.id !== pendingDelete.id) : allShifts),
    [allShifts, pendingDelete]
  );

  const filteredShifts = useMemo(() => {
    let result = visibleShifts;
    if (filter.platform !== "all") {
      result = result.filter((s) => s.platform === filter.platform);
    }
    if (filter.timeScope === "week") {
      const start = mondayOf(anchor);
      const end = addDays(start, 7);
      result = result.filter((s) => {
        const d = new Date(s.logged_at);
        return d >= start && d < end;
      });
    } else if (filter.timeScope === "month") {
      result = result.filter((s) => {
        const d = new Date(s.logged_at);
        return d.getUTCFullYear() === anchor.getUTCFullYear() && d.getUTCMonth() === anchor.getUTCMonth();
      });
    }
    return result;
  }, [visibleShifts, filter, anchor]);

  // Expenses carry no platform, so they're only attributable to the whole
  // period — hide them (and the net line) when a platform filter is active.
  const filteredExpenses = useMemo(() => {
    if (filter.platform !== "all") return [];
    if (filter.timeScope === "week") {
      const start = mondayOf(anchor);
      const end = addDays(start, 7);
      return expenses.filter((e) => {
        const d = new Date(e.logged_at);
        return d >= start && d < end;
      });
    }
    if (filter.timeScope === "month") {
      return expenses.filter((e) => {
        const d = new Date(e.logged_at);
        return d.getUTCFullYear() === anchor.getUTCFullYear() && d.getUTCMonth() === anchor.getUTCMonth();
      });
    }
    return expenses;
  }, [expenses, filter, anchor]);

  const isCurrentPeriod = useMemo(() => {
    const now = new Date();
    if (filter.timeScope === "week") return isSameWeek(anchor, now);
    if (filter.timeScope === "month") return isSameMonth(anchor, now);
    return true; // "all" has no paging
  }, [filter.timeScope, anchor]);

  const filteredSummary = useMemo(() => {
    const total = filteredShifts.reduce((s, r) => s + r.amount, 0);
    const socso = filteredShifts.reduce((s, r) => s + r.socso_deducted, 0);
    const breakdown = {};
    for (const s of filteredShifts) {
      breakdown[s.platform] = (breakdown[s.platform] ?? 0) + s.amount;
    }
    return {
      total_earned: Math.round(total * 100) / 100,
      total_socso: Math.round(socso * 100) / 100,
      shift_count: filteredShifts.length,
      breakdown_by_platform: Object.fromEntries(
        Object.entries(breakdown).map(([k, v]) => [k, Math.round(v * 100) / 100])
      ),
    };
  }, [filteredShifts]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadError(null);
      const [res, exp] = await Promise.all([fetchShifts(userId), fetchExpenses(userId)]);
      setData(res);
      setExpenses(exp.expenses ?? []);
    } catch (err) {
      console.error(err);
      setLoadError(true); // translated at render so a language toggle doesn't refetch
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => () => {
    clearTimeout(toastTimer.current);
    clearTimeout(deleteTimer.current);
    clearTimeout(pulseTimer.current);
  }, []);

  function handleLogged(shift) {
    refresh();
    clearTimeout(toastTimer.current);
    setToast({ type: "shift", shift });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
    setLogPulse(true);
    clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setLogPulse(false), 700);
  }

  function showMessageToast(text) {
    refresh();
    clearTimeout(toastTimer.current);
    setToast({ type: "message", text });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  async function handleDeleteExpense(expense) {
    setExpenses((prev) => prev.filter((e) => e.id !== expense.id)); // optimistic
    try {
      await deleteExpense({ expenseId: expense.id, userId });
    } catch {
      setToast({ type: "error", message: t.networkError });
      refresh();
    }
  }

  function handleDelete(shift) {
    // Optimistically remove shift; delay the actual DELETE for 5s to allow undo.
    pendingDeleteRef.current = shift;
    setPendingDelete(shift);
    clearTimeout(toastTimer.current);
    clearTimeout(deleteTimer.current);
    setToast({ type: "undo", shift });
    deleteTimer.current = setTimeout(async () => {
      const toDelete = pendingDeleteRef.current;
      if (!toDelete) return; // undo was called
      pendingDeleteRef.current = null;
      setPendingDelete(null);
      setToast(null);
      try {
        await deleteShift({ shiftId: toDelete.id, userId });
        refresh();
      } catch {
        setToast({ type: "error", message: t.networkError });
      }
    }, 5000);
  }

  function handleUndo() {
    pendingDeleteRef.current = null;
    clearTimeout(deleteTimer.current);
    setPendingDelete(null);
    setToast(null);
  }

  function handleFilterChange(next) {
    if (next.timeScope !== filter.timeScope) {
      setAnchor(new Date()); // changing scope always returns to the current period
    }
    setFilter(next);
  }

  function handleClearFilters() {
    setAnchor(new Date());
    setFilter({ timeScope: "week", platform: "all" });
  }

  return (
    <PhoneFrame>
          <StatusBar />

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto phone-scroll relative">
            {toast && <Toast data={toast} onUndo={handleUndo} />}

            <div className="space-y-3">
              {/* Header */}
              <header className="flex items-center gap-2.5 px-5 pt-2 pb-0">
                <ShieldIcon className="w-[18px] h-[18px] text-accent shrink-0" />
                <h1 className="text-[15px] font-extrabold tracking-tight text-white flex-1">
                  {t.appName}
                </h1>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="text-neutral-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-accent"
                  aria-label="Settings"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px]">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.01a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h.01a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.01a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
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
                <div className="px-5 flex items-center gap-3">
                  <p className="text-xs text-red-400 flex-1">{t.couldntLoad}</p>
                  <button
                    onClick={refresh}
                    className="text-xs font-semibold text-accent shrink-0 px-2.5 py-1 rounded-lg border border-accent/30 hover:bg-accent/10 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {t.retryLabel ?? "Retry"}
                  </button>
                </div>
              )}

              {tab === "home" && (
                <div
                  key="home"
                  role="tabpanel"
                  id="panel-home"
                  aria-labelledby="tab-home"
                  className="space-y-3 animate-fade-in"
                >
                  <FilterBar
                    filter={filter}
                    onChange={handleFilterChange}
                    anchor={anchor}
                    onAnchorChange={setAnchor}
                    isCurrentPeriod={isCurrentPeriod}
                  />
                  <HeroMetric
                    summary={filteredSummary}
                    loading={loading || !userId}
                    filter={filter}
                    anchor={anchor}
                    isCurrentPeriod={isCurrentPeriod}
                    expensesTotal={filteredExpenses.reduce((s, e) => s + e.amount, 0)}
                  />
                  <ChartsCard
                    filteredShifts={filteredShifts}
                    filter={filter}
                    anchor={anchor}
                    isCurrentPeriod={isCurrentPeriod}
                  />
                  <InsightsCard shifts={visibleShifts} />
                  <WeeklyDigest shifts={visibleShifts} expenses={expenses} />
                  <EarningsSummary
                    filteredShifts={filteredShifts}
                    filteredSummary={filteredSummary}
                    loading={loading || !userId}
                    onEdit={setEditingShift}
                    onClearFilters={handleClearFilters}
                    filter={filter}
                  />
                  <ExpensesCard
                    expenses={filteredExpenses}
                    onDelete={handleDeleteExpense}
                    gross={filteredSummary?.total_earned ?? 0}
                  />
                  <ProjectionCard
                    summary={data?.summary}
                    loading={loading || !userId}
                    filter={filter}
                    isCurrentPeriod={isCurrentPeriod}
                  />
                </div>
              )}

              {tab === "protection" && (
                <div
                  key="protection"
                  role="tabpanel"
                  id="panel-protection"
                  aria-labelledby="tab-protection"
                  className="space-y-3 animate-fade-in"
                >
                  <ContributionLedger shifts={visibleShifts} />
                  <ComplianceCard summary={data?.summary} />
                  <AccidentCard />
                  <SaraanCard />
                  <RightsCard defaultExpanded />
                  <RecordsCard shifts={visibleShifts} expenses={expenses} />
                  <ProtectionLinks />
                  <footer className="px-5 pt-1 pb-3">
                    <p className="text-[11px] text-neutral-700 leading-relaxed">
                      {t.footer}
                    </p>
                  </footer>
                </div>
              )}

              <div className="h-4" />
            </div>
          </div>

          <TabBar tab={tab} onChange={setTab} onLog={() => setLogOpen(true)} pulsing={logPulse} />

          <ShiftLogger
            userId={userId}
            shifts={visibleShifts}
            onLogged={handleLogged}
            onExpenseLogged={(e) =>
              showMessageToast(`−RM${e.amount.toFixed(2)} · ${t.expenseCategories[e.category] ?? e.category}`)
            }
            onImport={() => setImportOpen(true)}
            open={logOpen}
            onClose={() => setLogOpen(false)}
          />

          {importOpen && (
            <ImportSheet
              userId={userId}
              onClose={() => setImportOpen(false)}
              onImported={(n) => showMessageToast(t.importedToast(n))}
            />
          )}

          {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}

          {editingShift && (
            <EditShiftSheet
              shift={editingShift}
              userId={userId}
              onClose={() => setEditingShift(null)}
              onSaved={refresh}
              onDelete={handleDelete}
            />
          )}

    </PhoneFrame>
  );
}
