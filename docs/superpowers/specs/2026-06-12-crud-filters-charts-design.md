# GigShield MY — CRUD, Filters & Charts Design

**Date:** 2026-06-12  
**Status:** Approved  
**Scope:** Two implementation prompts (A: CRUD, B: Filters + Charts + A11y)

---

## 1. Architecture

**One fetch, multiple views.** `GET /shifts/{user_id}` returns all shifts unchanged. A `useFilteredData` hook (or inline `useMemo`) derives `filteredShifts` + a client-computed `filteredSummary` from raw shifts. Every display component (hero, chart, shift list, projection) reads from the filtered derivation. The server-returned `summary` is used exclusively by `ComplianceCard` (Protection Status), which must always reflect the true current week regardless of active filters.

**Filter state** lives in `App.jsx`:
```js
const [filter, setFilter] = useState({ timeScope: "week", platform: "all" });
```
Props drill down one level. No new context.

**Platform enum** updated to 7 platforms (both backend and frontend): grab, foodpanda, lalamove, shopeefood, maxim, indrive, other.

---

## 2. Backend Changes

### 2a. models.py

- Update `Platform` enum: add `SHOPEEFOOD = "shopeefood"`, `MAXIM = "maxim"`, `INDRIVE = "indrive"`
- Add `ShiftUpdate` model:
  ```python
  class ShiftUpdate(BaseModel):
      user_id: str = Field(..., min_length=1)
      platform: Optional[Platform] = None
      amount: Optional[float] = Field(None, gt=0, le=10_000)

      @field_validator("amount")
      @classmethod
      def round_to_sen(cls, v):
          return round(v, 2) if v is not None else v
  ```
- Add `DeleteResponse` model: `class DeleteResponse(BaseModel): deleted: str`

### 2b. main.py

- Add `"PATCH"` and `"DELETE"` to `allow_methods` in CORS middleware
- `PATCH /shifts/{shift_id}`:
  - Fetch doc; if not exists OR `doc["user_id"] != payload.user_id` → 404 "Shift not found"
  - If `amount` provided: update `amount` + recompute `socso_deducted = round(amount * SOCSO_RATE, 2)`
  - If `platform` provided: update `platform`
  - `logged_at` and `week_label` are **immutable** — never touched
  - Return full updated `Shift`
- `DELETE /shifts/{shift_id}?user_id=...`:
  - Same ownership check (query param, not body)
  - Hard delete, return `{"deleted": shift_id}`

---

## 3. Frontend — CRUD

### 3a. api.js additions
```js
updateShift({ shiftId, userId, platform, amount })  // PATCH
deleteShift({ shiftId, userId })                     // DELETE
```

### 3b. Sheet.jsx (shared shell)
Extracted from EpfSheet pattern: backdrop tap closes, Esc closes, `role="dialog"`, `aria-modal`, drag handle, `max-w-[420px]`. EpfSheet and the logger bottom sheet both refactored to use it.

### 3c. EditShiftSheet.jsx
- Platform segmented control (pre-selected to shift's platform)
- Amount input pre-filled, auto-focused
- Primary: "Save changes" (disabled while in-flight or amount ≤ 0)
- Secondary: "Delete shift" in `text-red-400`
- On save: call `updateShift()`, then `refresh()`

### 3d. Shift row editability (EarningsSummary.jsx)
- Each shift row becomes a `<button>` (min-h-11, full width)
- Visible focus ring (focus-visible:outline-2 focus-visible:outline-accent)
- Subtle edit indicator on the right (pencil icon or chevron)
- Tapping opens `EditShiftSheet` for that shift

### 3e. Delete with undo
1. User taps "Delete shift" → close sheet
2. Optimistically remove shift from local state
3. Show toast: "Shift deleted — Undo" (`role="status"`, 5s)
4. **Do NOT call DELETE API yet**
5. If Undo tapped: restore shift to local state, cancel timer
6. If timer expires: call `deleteShift()`, then `refresh()`
7. If DELETE fails: restore row + show error toast

---

## 4. Frontend — Filters

### 4a. Filter derivation (App.jsx useMemo)
```js
const filteredShifts = useMemo(() => {
  let result = allShifts;
  if (filter.platform !== "all")
    result = result.filter(s => s.platform === filter.platform);
  const now = new Date();
  if (filter.timeScope === "week") {
    const currentWeek = isoWeekLabel(now);
    result = result.filter(s => s.week_label === currentWeek);
  } else if (filter.timeScope === "month") {
    const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    result = result.filter(s => s.logged_at.slice(0,7) === ym);
  }
  return result;
}, [allShifts, filter]);
```

### 4b. FilterBar.jsx (new component)
Placed directly under the header, above HeroMetric:
- **Row 1** — time scope: `grid-cols-3` segmented control `[This week | This month | All time]`, `role="radiogroup"`, min-h-11, active = `bg-accent text-neutral-950`
- **Row 2** — platform chips: `All` + one chip per PLATFORM entry, horizontally scrollable (`overflow-x-auto`, scrollbar hidden), single-select, `role="radiogroup"`, min-h-11
- Arrow-key navigation (roving tabindex), `aria-checked` on active item

### 4c. Hero label
Hero subtitle changes to reflect active filter:
- Default: "This week"
- Platform active: "Grab · this month" / "ShopeeFood · all time"

### 4d. Projection suppression
`ProjectionCard` renders only when `timeScope === "week" && platform === "all"`. Code comment: *projections from partial filtered data are misleading and deliberately suppressed.*

### 4e. Empty filtered state (EarningsSummary.jsx)
When `filteredShifts.length === 0`: "No [Platform] shifts in this period." + "Clear filters" text button that resets filter to defaults.

### 4f. Shift list cap
Show `filteredShifts.slice(0, 20)` in "all" scope, still grouped by date, still tappable for editing.

---

## 5. Charts (Recharts, re-added)

**New component: ChartsCard.jsx**

Chart type driven by `timeScope`:

**Week → Daily bars**
- `BarChart` height ~140px, 7 bars Mon–Sun
- Data: `filteredShifts` grouped by `logged_at` day
- All bars `fill="#404040"` except today `fill="#10b981"`
- Today's bar shows RM value label on top
- Empty days render as 0 (no gap)
- No Y-axis, no grid lines, tabular-nums tooltip `RM0.00`

**Month / All → Weekly trend**
- `BarChart` height ~140px, grouped by `week_label`
- Month scope: weeks of current calendar month only
- All scope: last 8 week_labels
- Current week `fill="#10b981"`, others `fill="#404040"`
- X-axis labels: strip year prefix ("W23", "W24")
- Same no-axis, no-grid style

Platform stacked bar + legend (already in EarningsSummary) stays below the chart, computed from `filteredShifts`.

Chart container: `role="img"` with dynamic `aria-label`, e.g. "Daily earnings this week, highest Tuesday RM231".

---

## 6. Accessibility

- Both filter rows: roving tabindex arrow-key nav, `aria-checked`
- Every chip/segment: min 44px tall
- Chart `role="img"` + `aria-label`
- Delete/undo toast: `role="status"`
- Shift-logged toast: already `role="status"` ✓
- Visible focus rings on: chips, segments, shift rows, sheet buttons

---

## 7. Files Changed / Created

| File | Change |
|------|--------|
| `backend/models.py` | Add 3 platforms to enum, add `ShiftUpdate`, `DeleteResponse` |
| `backend/main.py` | PATCH + DELETE endpoints, CORS update |
| `frontend/src/api.js` | `updateShift`, `deleteShift` |
| `frontend/src/platforms.js` | Already has 7 — no change needed |
| `frontend/src/components/Sheet.jsx` | New shared bottom-sheet shell |
| `frontend/src/components/EditShiftSheet.jsx` | New edit/delete sheet |
| `frontend/src/components/FilterBar.jsx` | New filter UI |
| `frontend/src/components/ChartsCard.jsx` | New Recharts-based chart |
| `frontend/src/components/EarningsSummary.jsx` | Row editability, empty state |
| `frontend/src/components/ComplianceCard.jsx` | EpfSheet uses Sheet.jsx |
| `frontend/src/components/ProjectionCard.jsx` | Conditional render on filter |
| `frontend/src/App.jsx` | Filter state, filteredShifts memo, ChartsCard |
| `frontend/package.json` | Re-add recharts |
| `gigshield-my/DOCUMENTATION.md` | Note client-side filtering pattern |

---

## 8. Build Verification

After each prompt:
- `npm run build` passes in `/frontend`
- `python -c "import main"` passes in `/backend`

Edge cases to manually verify:
- Editing amount updates hero + projection
- Deleting only shift this week → SOCSO status flips to amber
- Undo restores row with identical data
- Filter "Grab" shows only Grab shifts across all cards
- ProjectionCard hidden in month/all scope or when platform filtered
