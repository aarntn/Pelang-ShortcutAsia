# GigShield MY — Tab Navigation & Settings Design (Phase C)

**Date:** 2026-06-12
**Status:** Approved (user: "okay implement as if it's like a full-on app")
**Scope:** Two-tab app shell, center log button, settings sheet, persistence

---

## 1. Architecture

**Two tabs + center FAB + settings sheet.** The single long scroll splits into:

- **Home tab** ("Home" / "Utama") — intent: *how am I doing?* FilterBar, HeroMetric, ChartsCard, EarningsSummary, ProjectionCard.
- **Protection tab** ("Protection" / "Perlindungan") — intent: *what am I covered for?* ComplianceCard (expanded by default on this tab), RightsCard, footer disclaimer.
- **Center ＋ button** in the tab bar opens the log sheet directly (amount autofocused) — replaces the sticky ShiftLogger bar. One-handed logging preserved.
- **⚙ gear icon** in the header opens a Settings sheet (not a tab — only 4 rows of content).

Tab state lives in App.jsx: `const [tab, setTab] = useState("home")`. No router — this is a single-screen phone-frame demo; a router adds bundle and complexity for zero user value (YAGNI).

## 2. Settings & Persistence

New `context/SettingsContext.jsx` persisted to localStorage under key `gigshield-settings`:

```js
{ defaultPlatform: "grab", showZakat: false }
```

- **Language** — persisted separately by LanguageContext under `gigshield-lang` (extend existing context to read/write localStorage).
- **Default platform** — pre-selects the platform in the log sheet.
- **Zakat toggle** — moves to context; ProjectionCard reads/writes the same context value, so the inline toggle and the settings toggle stay in sync.
- **Clear data** — confirmation step inside the sheet, then: clear both localStorage keys, `signOut()` from Firebase auth, `location.reload()`. Anonymous auth issues a fresh UID on reload — effectively a fresh start. (Old shifts remain orphaned in Firestore; acceptable for this app since they're unreachable. Documented tradeoff.)

## 3. Components

| File | Change |
|---|---|
| `context/SettingsContext.jsx` | New — defaultPlatform, showZakat, clearData; localStorage |
| `context/LanguageContext.jsx` | Persist lang to localStorage |
| `components/TabBar.jsx` | New — [Home \| ＋ \| Protection], `role="tablist"`, arrow-key nav |
| `components/ShiftLogger.jsx` | Refactored to controlled Sheet (`open`/`onClose` props), default platform from settings |
| `components/SettingsSheet.jsx` | New — language, default platform, zakat toggle, clear data |
| `components/ComplianceCard.jsx` | Accept `defaultExpanded` prop |
| `components/ProjectionCard.jsx` | showZakat from SettingsContext |
| `App.jsx` | Tab state, two tab views, TabBar, gear icon, log-sheet state |
| `i18n.js` | Tab labels + settings strings (en + bm) |
| `main.jsx` | Wrap in SettingsProvider |

## 4. Accessibility

- Tab bar: `role="tablist"`, each tab `role="tab"` + `aria-selected`, ArrowLeft/Right roving tabindex; ＋ button is a plain button (`aria-label` = log shift), not a tab.
- Tab panels: `role="tabpanel"` + `aria-labelledby`.
- All touch targets ≥ 44px; tab bar respects the home-indicator area.
- Settings sheet uses existing Sheet.jsx (dialog semantics, Esc, backdrop).

## 5. Edge cases

- Toast, EditShiftSheet, undo-delete flow stay global (above tabs) — deleting from Home while switching to Protection must not cancel the pending delete.
- Switching tabs preserves filter state (state lives in App, not in tab views).
- Log sheet opens from either tab; after logging, stay on current tab and show the confirmation toast.
- Clear-data requires an explicit second tap ("Are you sure?") before executing.

## 6. Verification

- `npm run build` passes after each task.
- Manual: log from Protection tab → toast appears, Home hero updates on switch back; zakat toggle in settings mirrors ProjectionCard; reload keeps language + default platform.
