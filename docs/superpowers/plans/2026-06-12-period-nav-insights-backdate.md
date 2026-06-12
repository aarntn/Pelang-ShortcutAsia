# Period Nav + Insights + Backdating Implementation Plan (Phase D)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Period paging (anchor + chevrons), rule-based insight cards, backdated shift logging.

**Spec:** `docs/superpowers/specs/2026-06-12-period-nav-insights-backdate-design.md`

---

### Task D1: Backend — logged_date support + docs reversal note
- `backend/models.py`: `ShiftCreate.logged_date: Optional[date] = None`, same on `ShiftUpdate`. Validator: not in the future, not older than 365 days.
- `backend/main.py`: POST — if `logged_date` set, `logged_at = datetime(y,m,d,12,0,tzinfo=utc)` and `week_label = iso_week_label(logged_at)`. PATCH — same recompute; remove the "immutable" comment.
- `DOCUMENTATION.md`: note the immutability reversal with reasoning.
- Verify `python -c "import main"`. Commit.

### Task D2: utils.js period helpers + App.jsx anchor state
- utils.js: `mondayOf(date)` (UTC Monday 00:00), `addDays(date, n)`, `addMonths(date, n)`, `isSameWeek(a,b)`, `isSameMonth(a,b)`.
- App.jsx: `anchor` state (Date, today). `setFilter` wrapper snaps anchor to today on timeScope change. filteredShifts: week → `logged_at ∈ [mondayOf(anchor), +7d)`; month → anchor's UTC YYYY-MM. `isCurrentPeriod` memo. Pass `anchor`/`onAnchorChange`/`isCurrentPeriod` down.
- Build, commit.

### Task D3: FilterBar navigator + label honesty + chart anchoring
- FilterBar: second row when scope ≠ all — `‹ [period label] ›`; chevrons ±7d/±1mo; forward disabled at current period; label tap snaps to today; aria-labels.
- HeroMetric: past week → "Week of 2–8 Jun"; past month → "May 2026"; current keeps This week/This month. BM via lang.
- ProjectionCard: render only when current week + default filter.
- ChartsCard: daily bars from anchored week (`mondayOf(anchor)` + day offsets); today-highlight only when anchored week is current; month chart = anchored month's weeks.
- Build, commit.

### Task D4: weeklyGoal setting
- SettingsContext: `weeklyGoal` (number, 0=unset) + `setWeeklyGoal`, persisted.
- SettingsSheet: "Weekly goal" row — RM-prefixed numeric input, blur/enter commits, 0/empty clears.
- Build, commit.

### Task D5: InsightsCard
- New `frontend/src/components/InsightsCard.jsx`. Inputs: `allShifts`, `weeklyGoal`. Computes 5 rules with thresholds (see spec table), fixed priority, renders top 2 as horizontal cards above Activity on Home tab. Always computed from real current/previous calendar weeks regardless of view filters. No per-hour metrics.
- Wire into App.jsx home panel between ChartsCard and EarningsSummary.
- Build, commit.

### Task D6: Backdated logging UI
- api.js: `logShift`/`updateShift` pass `logged_date` when provided.
- ShiftLogger: "Today ▾" chip next to amount; tap reveals `<input type="date" max=today min=1yr-back>`; chip label shows chosen date when not today; resets on open.
- EditShiftSheet: date input pre-filled from `shift.logged_at`; include in PATCH only when changed; unchanged-guard updated.
- Build, commit.

### Task D7: i18n + roadmap docs + final verify
- i18n en+bm: period/date/goal/insight strings (functions for templated sentences).
- DOCUMENTATION.md: roadmap section citing Gridwise/Solo — auto income sync (no MY APIs), mileage/expense (GPS + IRS-vs-LHDN), community compare (user base), optional duration field for honest per-hour.
- `npm run build` + backend import check. Commit.

### Final: code review across D1–D7, fix findings, commit.
