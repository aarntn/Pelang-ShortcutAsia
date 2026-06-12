# GigShield MY — Period Navigation, Insight Cards, Backdated Logging (Phase D)

**Date:** 2026-06-12
**Status:** Approved
**Benchmark:** Gridwise / Solo (US gig-driver trackers) — week/month trend navigation, action-oriented insights, manual backdated entry. Their tax/mileage layer is US-specific (IRS mileage deduction) and does not translate to LHDN; documented as roadmap contrast, not copied.

---

## 1. Period navigation — anchor + chevrons

No calendar picker. When `timeScope` is `week` or `month`, the FilterBar gains a second line:

```
[ This week | This month | All time ]
        ‹   9–15 Jun 2026   ›
```

- New state in App.jsx: `anchor` (Date, defaults to today). Chevrons shift ±7 days (week) or ±1 month (month). Switching timeScope snaps anchor back to today. Tapping the period label snaps back to today. Forward chevron disabled when the anchor is in the current period.
- **Filtering by date range, not ISO strings**: `mondayOf(date)` helper in utils.js returns the UTC Monday 00:00 of the containing week; week scope filters `logged_at ∈ [monday, monday+7d)`. Month scope matches anchor's UTC `YYYY-MM`. Fewer year-boundary edge cases than recomputing ISO week labels client-side.
- **Honest labels**: when viewing a past period the hero label says so — "Week of 2–8 Jun" / "May 2026" — never "This week". Current period keeps "This week"/"This month".
- ProjectionCard renders **only on the current week** (past weeks are finished; projecting them is meaningless).
- ChartsCard daily bars show the anchored week; the today-highlight only applies when the anchored week is the current week. Month chart shows the anchored month's weeks.
- Years come free: month scope paged back 12 times crosses into 2025. No extra UI.

## 2. Action dashboard — rule-based insight cards

New `InsightsCard.jsx`: horizontal strip (max 2 cards shown, scrollable) above the Activity section on the Home tab. Each card is one sentence with a verb, computed client-side. **Every rule has a data-sufficiency threshold and renders nothing below it** — no fake intelligence from one shift.

Priority order (show top 2 eligible):

| # | Card | Eligibility | Content |
|---|---|---|---|
| 1 | Goal pacing | `weeklyGoal > 0` set in settings | "RM144 to go — RM48/day across your 3 remaining days hits RM800." |
| 2 | Week-over-week | ≥1 shift in current AND previous week | "↑ 12% vs last week (RM586)." Up = accent green; down = neutral grey, **never red** — the app doesn't scold rest. |
| 3 | Best platform | ≥3 shifts on each of ≥2 platforms this month | "Grab is paying you 2.1× more per shift than Foodpanda this month." |
| 4 | Strongest day | ≥2 distinct weeks of data | "Saturdays are your best day — RM142 average." |
| 5 | Protection action | always | "RM50/month into i-Saraan captures the full RM600 government match." |

- **Weekly goal**: new `weeklyGoal` field in SettingsContext (default 0 = unset) + numeric input row in SettingsSheet.
- **Deliberately no earnings-per-hour**: we don't capture shift duration; faking it would be the one dishonest number. Optional duration field = roadmap.
- Insights always computed from real calendar weeks (not the filtered view) — they answer "what should I do next?", which is anchored to now.

## 3. Backdated logging

- **Log sheet**: "Today ▾" chip beside the amount; tapping reveals a native `<input type="date">`, `max` = today, `min` = 1 year back. Native picker — free, localized, accessible.
- **Backend**: `POST /shifts` accepts optional `logged_date` (YYYY-MM-DD). Server validates bounds (not future, ≤1 year back), sets `logged_at` to that date (12:00 UTC to keep it stable within the day) and computes `week_label` from it.
- **Reversal of Prompt A's immutability rule**: `PATCH /shifts/{id}` now also accepts `logged_date` and recomputes both `logged_at` and `week_label`. Immutability was the right call until backdating existed; once dates are user-supplied, date correction is a first-class edit. Recorded in DOCUMENTATION.md.
- **Edit sheet**: date field added, pre-filled with the shift's date.
- Ripple: a backdated shift into last week updates last week's totals (visible via the new chevrons) and must not inflate this week's Protection Status — guaranteed because Protection reads server `shift_count_this_week`, computed from `week_label`.

## 4. Skipped (roadmap, documented in DOCUMENTATION.md)

Verbatim from the Gridwise/Solo feature set: automatic platform income syncing (no Grab/Foodpanda earnings APIs in MY), mileage/expense tracking for tax deductions (needs GPS; IRS-mileage framing is US-specific vs LHDN), community earnings comparison (needs a user base). Optional shift-duration field to enable honest per-hour metrics.

## 5. Files

| File | Change |
|---|---|
| `backend/models.py` | `logged_date` on ShiftCreate + ShiftUpdate, bounds validators |
| `backend/main.py` | POST/PATCH honor logged_date, recompute week_label |
| `frontend/src/utils.js` | `mondayOf`, `addDays`, `isSamePeriod`, `formatPeriodLabel` |
| `frontend/src/App.jsx` | anchor state, range-based filteredShifts, wiring |
| `frontend/src/components/FilterBar.jsx` | period navigator row (chevrons + snap-to-today label) |
| `frontend/src/components/ChartsCard.jsx` | anchored week/month charts |
| `frontend/src/components/ProjectionCard.jsx` | current-week-only guard |
| `frontend/src/components/InsightsCard.jsx` | NEW — rule engine + strip UI |
| `frontend/src/components/SettingsSheet.jsx` | weekly goal input row |
| `frontend/src/context/SettingsContext.jsx` | weeklyGoal |
| `frontend/src/components/ShiftLogger.jsx` | date chip + native date input |
| `frontend/src/components/EditShiftSheet.jsx` | date field |
| `frontend/src/api.js` | logged_date passthrough |
| `frontend/src/i18n.js` | insight/date/goal strings en+bm |
| `DOCUMENTATION.md` | immutability reversal + roadmap section |
