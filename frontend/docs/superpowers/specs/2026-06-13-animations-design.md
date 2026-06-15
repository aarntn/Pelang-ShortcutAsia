# Animations Design

**Goal:** Add tight, professional motion that rewards key user actions without decorative excess.

**Approach:** CSS keyframes only — no third-party library. All animations respect `prefers-reduced-motion`.

---

## Keyframes (index.css)

| Class | Trigger | Duration |
|---|---|---|
| `animate-sheet-in` | Sheet mount | 360ms spring |
| `animate-sheet-out` | Sheet close | 220ms ease-in |
| `animate-backdrop-in/out` | Sheet overlay | 220ms |
| `animate-fab-ring` | Shift logged | 700ms dissolve |
| `animate-num-pop` | Hero number value change | 380ms scale spring |
| `animate-fade-in` | Tab panel switch | 180ms |

## Sheet enter/exit (Sheet.jsx)

Local `exiting` state. `handleClose` sets it true → swaps to `*-out` classes. `onAnimationEnd` fires `onClose()` after exit finishes. Affects all sheets: Settings, ShiftLogger, Import, EditShift, EPF.

## FAB ring pulse (TabBar.jsx)

`pulsing` prop. When true, an `aria-hidden` `<span>` with `animate-fab-ring` sits concentric with the FAB and expands to 2.8× while dissolving. Emerald ring, `pointer-events-none`.

## Reward wiring (App.jsx)

`logPulse` state. `handleLogged` → `setLogPulse(true)` → cleared after 700ms. Passed to `<TabBar pulsing={logPulse}>`.

## Hero number pop (App.jsx / HeroMetric)

`<span key={Math.round(total * 100)} className="animate-num-pop">` inside the hero `<p>`. React remounts the span on value change, re-triggering the CSS animation (scale 1→1.18→1 with momentary accent color flash).

## Tab crossfade (App.jsx)

Both tab panel `<div>`s get `key="home"` / `key="protection"` + `animate-fade-in` class. React remounts on tab switch, triggering the fade.
