# Tab Navigation & Settings Implementation Plan (Phase C)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Split the app into Home and Protection tabs with a center log button and a settings sheet, persisted to localStorage.

**Architecture:** Tab state in App.jsx (no router). New SettingsContext for defaultPlatform/showZakat. ShiftLogger becomes a controlled Sheet opened by the tab bar's ＋ button. Settings sheet from the header gear icon.

**Tech Stack:** React 18, Tailwind v4, existing Sheet.jsx, localStorage.

Spec: `docs/superpowers/specs/2026-06-12-tabs-settings-design.md`

---

### Task C1: SettingsContext + language persistence

**Files:**
- Create: `frontend/src/context/SettingsContext.jsx`
- Modify: `frontend/src/context/LanguageContext.jsx`, `frontend/src/main.jsx`

SettingsContext: `{ defaultPlatform, showZakat, setDefaultPlatform, setShowZakat, clearData }`. Read initial state from `localStorage["gigshield-settings"]` (JSON, try/catch fallback to defaults `{ defaultPlatform: "grab", showZakat: false }`). Persist on every change via useEffect. `clearData()` removes `gigshield-settings` + `gigshield-lang`, calls Firebase `signOut(auth)` (import from firebase config used by AuthContext), then `window.location.reload()`.

LanguageContext: initialize `lang` from `localStorage["gigshield-lang"]` (fallback "en"), write on toggle.

main.jsx: wrap tree in `<SettingsProvider>` (inside LanguageProvider order is fine either way).

Build, commit: `feat: add SettingsContext with localStorage persistence, persist language`

### Task C2: ShiftLogger → controlled log sheet

**Files:** Modify: `frontend/src/components/ShiftLogger.jsx`

Convert to controlled Sheet: props `{ userId, onLogged, open, onClose }`. When `open` is false render null. Use `Sheet` from `./Sheet` as the shell (drag handle, Esc, backdrop). Keep platform grid + amount input + confirm button exactly as-is inside the sheet. Initial platform = `defaultPlatform` from `useSettings()` (re-sync when sheet opens). Autofocus amount on open. On successful log: `onLogged(shift)` then `onClose()`. Remove the collapsed sticky-bar rendering entirely (TabBar replaces it in C3).

Build (App.jsx still passes old props — sheet just won't open; build must pass), commit: `refactor: ShiftLogger becomes controlled bottom sheet with default platform from settings`

### Task C3: TabBar component

**Files:** Create: `frontend/src/components/TabBar.jsx`

Props: `{ tab, onChange, onLog }`. Layout: fixed-height bar (h-16) with three zones — Home tab, center ＋ button (w-14 h-14 rounded-full bg-accent text-neutral-950, raised -mt-5, shadow), Protection tab. Tabs: icon (house / shield SVG) + 11px label, `role="tab"`, `aria-selected`, active = text-accent, inactive = text-neutral-500. Wrapper `role="tablist"`. Roving tabindex + ArrowLeft/Right between the two tabs (＋ excluded, plain button with `aria-label={t.logShift}`). All zones min-h-[44px]. i18n: `t.tabHome ?? "Home"`, `t.tabProtection ?? "Protection"`.

Build (esbuild transpile check since not imported yet), commit: `feat: add TabBar with center log button and tablist semantics`

### Task C4: App.jsx — tab state + views + wiring

**Files:** Modify: `frontend/src/App.jsx`, `frontend/src/components/ComplianceCard.jsx`

- `const [tab, setTab] = useState("home")`, `const [logOpen, setLogOpen] = useState(false)`, `const [settingsOpen, setSettingsOpen] = useState(false)`.
- ComplianceCard: add `defaultExpanded = false` prop → `useState(defaultExpanded)`.
- Scroll area content becomes: header (+ gear button before lang toggle, ⚙ SVG, `aria-label="Settings"`), errors, then `tab === "home"` panel: FilterBar, HeroMetric, ChartsCard, EarningsSummary, ProjectionCard; `tab === "protection"` panel: ComplianceCard (`defaultExpanded`), RightsCard, footer. Each panel `role="tabpanel"`.
- Replace `<ShiftLogger userId onLogged />` with `<TabBar tab={tab} onChange={setTab} onLog={() => setLogOpen(true)} />` placed where ShiftLogger was (above home indicator), and render `<ShiftLogger userId={userId} onLogged={handleLogged} open={logOpen} onClose={() => setLogOpen(false)} />` as an overlay sibling of EditShiftSheet.
- Toast/EditShiftSheet/undo flow unchanged and global.

Build, commit: `feat: two-tab app shell — Home and Protection panels, TabBar wired`

### Task C5: SettingsSheet

**Files:** Create: `frontend/src/components/SettingsSheet.jsx`; Modify: `frontend/src/App.jsx` (render it), `frontend/src/components/ProjectionCard.jsx` (showZakat from context)

Sheet content, 4 rows: (1) Language — two-button segmented EN/BM using `lang`/`toggleLang` from useLang (highlight active); (2) Default platform — 4-col chip grid (SHORT_LABELS) writing `setDefaultPlatform`; (3) Zakat toggle — reuse existing Toggle pattern, bound to `showZakat`/`setShowZakat` from useSettings; (4) Clear data — red text button; first tap arms ("Tap again to confirm", 3s timeout reverts), second tap calls `clearData()`. Explanatory caption: data lives on this device + anonymous ID.

ProjectionCard: delete local `useState(false)` for showZakat; read `{ showZakat, setShowZakat } = useSettings()`.

App.jsx: `{settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}`.

Build, commit: `feat: settings sheet — language, default platform, zakat, clear data`

### Task C6: i18n strings + final verify

**Files:** Modify: `frontend/src/i18n.js`

en: `tabHome: "Home"`, `tabProtection: "Protection"`, `settingsTitle: "Settings"`, `settingsLanguage: "Language"`, `settingsDefaultPlatform: "Default platform"`, `settingsClearData: "Clear my data"`, `settingsClearConfirm: "Tap again to confirm"`, `settingsDataNote: "Your data is stored under an anonymous ID on this device. Clearing it starts fresh and cannot be undone."`
bm: `tabHome: "Utama"`, `tabProtection: "Perlindungan"`, `settingsTitle: "Tetapan"`, `settingsLanguage: "Bahasa"`, `settingsDefaultPlatform: "Platform lalai"`, `settingsClearData: "Padam data saya"`, `settingsClearConfirm: "Tekan sekali lagi untuk sahkan"`, `settingsDataNote: "Data anda disimpan di bawah ID tanpa nama pada peranti ini. Memadamnya akan bermula semula dan tidak boleh dibatalkan."`

Skip keys that already exist. Full `npm run build` + `python -c "import main"` verify. Commit: `feat: add tab + settings i18n strings`

### Final: code review across C1–C6, fix findings, commit.
