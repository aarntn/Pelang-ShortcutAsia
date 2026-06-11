# CRUD, Filters & Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shift edit/delete (CRUD), client-side time-scope + platform filters, scope-aware Recharts bar charts, and an accessibility pass.

**Architecture:** One `GET /shifts/{user_id}` call returns all shifts; `useMemo` in App.jsx derives `filteredShifts` and `filteredSummary` from a `{ timeScope, platform }` filter state — no new fetch endpoints. Two new backend endpoints (`PATCH` + `DELETE`) handle mutation server-side with ownership checks and server-recomputed SOCSO. `ComplianceCard` always receives the unfiltered server `summary` so Protection Status reflects the true current week regardless of active filters.

**Tech Stack:** FastAPI + Pydantic (backend), React 18 + Vite 6 + Tailwind CSS v4 (frontend), Recharts (re-added), Firebase Firestore.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/models.py` | Modify | Add 3 platforms to enum; add `ShiftUpdate`, `DeleteResponse` |
| `backend/main.py` | Modify | `PATCH /shifts/{id}`, `DELETE /shifts/{id}`, CORS update |
| `frontend/src/api.js` | Modify | `updateShift()`, `deleteShift()` |
| `frontend/src/utils.js` | Create | `isoWeekLabel(date)` — ISO week string matching backend |
| `frontend/src/i18n.js` | Modify | CRUD strings + filter strings in EN + BM |
| `frontend/src/components/Sheet.jsx` | Create | Shared bottom-sheet shell (backdrop, Esc, drag handle) |
| `frontend/src/components/ComplianceCard.jsx` | Modify | Refactor `EpfSheet` to use `Sheet.jsx` |
| `frontend/src/components/EditShiftSheet.jsx` | Create | Edit amount/platform + delete trigger |
| `frontend/src/components/FilterBar.jsx` | Create | Time-scope segments + platform chips, roving tabindex |
| `frontend/src/components/ChartsCard.jsx` | Create | Daily bars (week) / weekly trend (month+all) via Recharts |
| `frontend/src/components/EarningsSummary.jsx` | Modify | Accept `filteredShifts`/`filteredSummary`, tappable rows, empty state |
| `frontend/src/components/ProjectionCard.jsx` | Modify | Accept `filter` prop, suppress when not week+all |
| `frontend/src/App.jsx` | Modify | Filter state, `filteredShifts` memo, edit/undo-delete wiring, ChartsCard |
| `frontend/vite.config.js` | Modify | Re-add `charts: ["recharts"]` to `manualChunks` |
| `frontend/package.json` | Modify | Re-add `recharts` dependency |

---

## Phase A — CRUD

---

### Task 1: Backend models — Platform enum + ShiftUpdate

**Files:**
- Modify: `backend/models.py`

- [ ] **Open `backend/models.py` and replace the `Platform` enum with the 7-platform version:**

```python
class Platform(str, Enum):
    GRAB = "grab"
    FOODPANDA = "foodpanda"
    LALAMOVE = "lalamove"
    SHOPEEFOOD = "shopeefood"
    MAXIM = "maxim"
    INDRIVE = "indrive"
    OTHER = "other"
```

- [ ] **Add `ShiftUpdate` and `DeleteResponse` models after the existing `Shift` class:**

```python
class ShiftUpdate(BaseModel):
    """Payload for PATCH /shifts/{shift_id}."""
    user_id: str = Field(..., min_length=1)
    platform: Optional[Platform] = None
    amount: Optional[float] = Field(None, gt=0, le=10_000)

    @field_validator("amount")
    @classmethod
    def round_to_sen(cls, v: float) -> float:
        return round(v, 2) if v is not None else v


class DeleteResponse(BaseModel):
    deleted: str
```

- [ ] **Verify imports at the top of `models.py` include `Optional`** — it's already imported via `from typing import Optional`. Confirm, add if missing.

- [ ] **Verify the import works:**

```bash
cd backend
python -c "from models import ShiftUpdate, DeleteResponse, Platform; print(Platform.SHOPEEFOOD)"
```

Expected output: `Platform.shopeefood`

- [ ] **Commit:**

```bash
git add backend/models.py
git commit -m "feat: expand Platform enum to 7 platforms, add ShiftUpdate + DeleteResponse models"
```

---

### Task 2: Backend endpoints — PATCH + DELETE + CORS

**Files:**
- Modify: `backend/main.py`

- [ ] **Update the CORS `allow_methods` list** (find the existing `allow_methods=["GET", "POST"]` line and replace):

```python
allow_methods=["GET", "POST", "PATCH", "DELETE"],
```

- [ ] **Add the `PATCH` endpoint after the existing `POST /shifts` route:**

```python
@app.patch("/shifts/{shift_id}", response_model=Shift)
def update_shift(shift_id: str, payload: ShiftUpdate):
    db = get_db()
    ref = db.collection("shifts").document(shift_id)
    snap = ref.get()
    # Never 403 — always 404 to avoid leaking document existence.
    if not snap.exists or snap.to_dict()["user_id"] != payload.user_id:
        raise HTTPException(status_code=404, detail="Shift not found")

    updates: dict = {}
    if payload.amount is not None:
        updates["amount"] = payload.amount
        updates["socso_deducted"] = round(payload.amount * SOCSO_RATE, 2)
    if payload.platform is not None:
        updates["platform"] = payload.platform.value
    # logged_at and week_label are immutable — never updated.
    if updates:
        ref.update(updates)

    updated = ref.get().to_dict()
    return Shift(id=shift_id, **updated)
```

- [ ] **Add the `DELETE` endpoint immediately after the PATCH route:**

```python
@app.delete("/shifts/{shift_id}", response_model=DeleteResponse)
def delete_shift(shift_id: str, user_id: str):
    db = get_db()
    ref = db.collection("shifts").document(shift_id)
    snap = ref.get()
    if not snap.exists or snap.to_dict()["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Shift not found")
    ref.delete()
    return DeleteResponse(deleted=shift_id)
```

- [ ] **Update the imports at the top of `main.py`** to include the new models:

```python
from models import (
    SOCSO_RATE,
    DeleteResponse,
    Shift,
    ShiftCreate,
    ShiftUpdate,
    ShiftsResponse,
    ShiftSummary,
)
```

- [ ] **Verify the import and route registration:**

```bash
cd backend
python -c "import main; print([r.path for r in main.app.routes])"
```

Expected output includes: `'/shifts/{shift_id}'` (appears twice — PATCH and DELETE).

- [ ] **Commit:**

```bash
git add backend/main.py
git commit -m "feat: add PATCH /shifts/{id} and DELETE /shifts/{id} endpoints with ownership checks"
```

---

### Task 3: Frontend api.js — updateShift + deleteShift

**Files:**
- Modify: `frontend/src/api.js`

- [ ] **Append `updateShift` and `deleteShift` to the bottom of `api.js`:**

```js
export function updateShift({ shiftId, userId, platform, amount }) {
  const body = { user_id: userId };
  if (platform !== undefined) body.platform = platform;
  if (amount !== undefined) body.amount = amount;
  return request(`/shifts/${encodeURIComponent(shiftId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteShift({ shiftId, userId }) {
  return request(
    `/shifts/${encodeURIComponent(shiftId)}?user_id=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
}
```

- [ ] **Run build to confirm no syntax errors:**

```bash
cd frontend
npm run build 2>&1 | tail -5
```

Expected: `✓ built in`

- [ ] **Commit:**

```bash
git add frontend/src/api.js
git commit -m "feat: add updateShift and deleteShift API client functions"
```

---

### Task 4: Sheet.jsx shared shell + refactor EpfSheet

**Files:**
- Create: `frontend/src/components/Sheet.jsx`
- Modify: `frontend/src/components/ComplianceCard.jsx`

- [ ] **Create `frontend/src/components/Sheet.jsx`:**

```jsx
import { useEffect } from "react";

export default function Sheet({ onClose, label, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className="w-full max-w-[420px] bg-card border-t border-card-edge rounded-t-2xl p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mb-5" />
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Refactor `EpfSheet` in `ComplianceCard.jsx`** — replace the entire `EpfSheet` function (the `fixed inset-0` div and its contents) with this version that delegates the shell to `Sheet`:

```jsx
import Sheet from "./Sheet";

function EpfSheet({ onClose }) {
  const { t } = useLang();
  return (
    <Sheet onClose={onClose} label="i-Saraan Plus details">
      <h3 className="text-lg font-bold text-white mb-3">{t.epfSheetTitle}</h3>
      <div className="space-y-3 mb-6">
        {t.epfSheetBody.split("\n\n").map((para, i) => (
          <p key={i} className="text-sm text-neutral-400 leading-relaxed">{para}</p>
        ))}
      </div>
      <a
        href="https://www.kwsp.gov.my"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-accent text-neutral-950 font-bold rounded-2xl py-3.5 hover:brightness-110 transition"
      >
        {t.registerKWSP}
      </a>
      <button
        onClick={onClose}
        className="block w-full text-center text-sm text-neutral-500 mt-3 py-2 hover:text-neutral-300"
      >
        {t.dismiss}
      </button>
    </Sheet>
  );
}
```

(Remove the old `useEffect` Esc listener from `EpfSheet` — `Sheet.jsx` handles it now.)

- [ ] **Build to confirm:**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit:**

```bash
git add frontend/src/components/Sheet.jsx frontend/src/components/ComplianceCard.jsx
git commit -m "refactor: extract Sheet.jsx shared bottom-sheet shell, use in EpfSheet"
```

---

### Task 5: i18n — CRUD strings

**Files:**
- Modify: `frontend/src/i18n.js`

- [ ] **Add CRUD strings to the `en` object** (after the existing `dismiss` key):

```js
// Edit sheet
saveChanges: "Save changes",
deleteShift: "Delete shift",
shiftDeleted: "Shift deleted",
undoLabel: "Undo",
```

- [ ] **Add BM equivalents to the `bm` object** (after `dismiss`):

```js
// Edit sheet
saveChanges: "Simpan perubahan",
deleteShift: "Padam syif",
shiftDeleted: "Syif dipadam",
undoLabel: "Batal",
```

- [ ] **Build:**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit:**

```bash
git add frontend/src/i18n.js
git commit -m "feat: add CRUD i18n strings (saveChanges, deleteShift, shiftDeleted, undoLabel)"
```

---

### Task 6: EditShiftSheet.jsx

**Files:**
- Create: `frontend/src/components/EditShiftSheet.jsx`

- [ ] **Create `frontend/src/components/EditShiftSheet.jsx`:**

```jsx
import { useState } from "react";
import { PLATFORMS } from "../platforms";
import { updateShift } from "../api";
import { useLang } from "../context/LanguageContext";
import Sheet from "./Sheet";

const SHORT_LABELS = {
  grab: "Grab",
  foodpanda: "Panda",
  lalamove: "Lala",
  shopeefood: "Shopee",
  maxim: "Maxim",
  indrive: "inDrive",
  other: "Other",
};

export default function EditShiftSheet({ shift, userId, onClose, onSaved, onDelete }) {
  const { t } = useLang();
  const [platform, setPlatform] = useState(shift.platform);
  const [amount, setAmount] = useState(String(shift.amount));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const parsed = parseFloat(amount);
  const valid = !isNaN(parsed) && parsed > 0 && parsed <= 10000;
  const unchanged = platform === shift.platform && parsed === shift.amount;

  async function handleSave() {
    if (!valid || unchanged) return;
    setSaving(true);
    setError(null);
    try {
      await updateShift({
        shiftId: shift.id,
        userId,
        platform: platform !== shift.platform ? platform : undefined,
        amount: parsed !== shift.amount ? parsed : undefined,
      });
      onSaved();
      onClose();
    } catch {
      setError(t.networkError);
      setSaving(false);
    }
  }

  return (
    <Sheet onClose={onClose} label="Edit shift">
      {/* Platform selector */}
      <div className="grid grid-cols-4 gap-1.5 mb-4" role="radiogroup" aria-label="Platform">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={platform === p.id}
            onClick={() => setPlatform(p.id)}
            className={`py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-accent ${
              platform === p.id
                ? "bg-accent text-neutral-950"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            {SHORT_LABELS[p.id]}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div className="flex items-baseline gap-2 bg-neutral-900 rounded-2xl px-4 py-3 mb-4 border border-neutral-800">
        <span className="text-lg font-bold text-neutral-500 shrink-0">RM</span>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          aria-label="Amount in ringgit"
          className="flex-1 bg-transparent text-3xl font-extrabold text-white focus:outline-none"
          style={{ fontVariantNumeric: "tabular-nums" }}
          autoFocus
        />
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      <button
        onClick={handleSave}
        disabled={!valid || saving || unchanged}
        className="w-full bg-accent text-neutral-950 font-bold rounded-2xl py-3.5 mb-2 min-h-[44px] disabled:opacity-40 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-accent"
      >
        {saving ? t.saving : t.saveChanges}
      </button>
      <button
        onClick={() => { onDelete(shift); onClose(); }}
        className="w-full text-center text-sm text-red-400 py-2 min-h-[44px] hover:text-red-300 focus-visible:outline-2 focus-visible:outline-accent rounded-xl"
      >
        {t.deleteShift}
      </button>
    </Sheet>
  );
}
```

- [ ] **Build:**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit:**

```bash
git add frontend/src/components/EditShiftSheet.jsx
git commit -m "feat: add EditShiftSheet with platform selector, amount input, delete trigger"
```

---

### Task 7: App.jsx — edit state + undo-delete wiring

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Add imports at the top of `App.jsx`:**

```jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchShifts, updateShift, deleteShift } from "./api";
import EditShiftSheet from "./components/EditShiftSheet";
```

(Replace the existing `useCallback, useEffect, useRef, useState` import; add `useMemo`. Replace `fetchShifts` import line to add `updateShift, deleteShift`.)

- [ ] **Add new state and refs inside the `App` component, after existing state declarations:**

```jsx
const [editingShift, setEditingShift] = useState(null);
const [pendingDelete, setPendingDelete] = useState(null);
const pendingDeleteRef = useRef(null);
const deleteTimer = useRef(null);
```

- [ ] **Add `handleDelete` and `handleUndo` functions inside `App` after `handleLogged`:**

```jsx
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
```

- [ ] **Update `handleLogged` to use the new toast shape:**

```jsx
function handleLogged(shift) {
  refresh();
  clearTimeout(toastTimer.current);
  setToast({ type: "shift", shift });
  toastTimer.current = setTimeout(() => setToast(null), 4000);
}
```

- [ ] **Add `allShifts` derivation and a `visibleShifts` that excludes the pending-delete shift.** Add these lines just after the state declarations (before the `refresh` callback):

```jsx
const allShifts = data?.shifts ?? [];
const visibleShifts = useMemo(
  () => (pendingDelete ? allShifts.filter((s) => s.id !== pendingDelete.id) : allShifts),
  [allShifts, pendingDelete]
);
```

- [ ] **Update the `Toast` component** to handle the three toast types (`shift`, `undo`, `error`). Replace the existing `Toast` function:

```jsx
function Toast({ data, onUndo }) {
  const { t } = useLang();

  if (data.type === "undo") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="animate-toast-in absolute top-[60px] left-4 right-4 z-50 bg-card border border-card-edge rounded-2xl px-4 py-3 shadow-2xl flex items-center justify-between gap-3"
      >
        <p className="text-sm font-bold text-white">{t.shiftDeleted}</p>
        <button
          onClick={onUndo}
          className="text-sm font-bold text-accent shrink-0 focus-visible:outline-2 focus-visible:outline-accent rounded"
        >
          {t.undoLabel}
        </button>
      </div>
    );
  }

  if (data.type === "error") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="animate-toast-in absolute top-[60px] left-4 right-4 z-50 bg-red-950 border border-red-800 rounded-2xl px-4 py-3 shadow-2xl"
      >
        <p className="text-sm text-red-300">{data.message}</p>
      </div>
    );
  }

  // type === "shift" — newly logged shift confirmation
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-toast-in absolute top-[60px] left-4 right-4 z-50 bg-card border border-card-edge rounded-2xl px-4 py-3 shadow-2xl"
    >
      <p className="text-sm font-bold text-white">
        RM{data.shift.amount.toFixed(2)} — {platformLabel(data.shift.platform)}
      </p>
      <p className="text-xs text-neutral-400 mt-0.5">
        SOCSO: RM{data.shift.socso_deducted.toFixed(2)} · {t.protectedStatus}
      </p>
    </div>
  );
}
```

- [ ] **Update the Toast render in the JSX** — find `{toast && <Toast data={toast} />}` and replace with:

```jsx
{toast && <Toast data={toast} onUndo={handleUndo} />}
```

- [ ] **Wire `EditShiftSheet` into the JSX** — add it just before the closing `</div>` of the screen div (after `ShiftLogger`, before the home indicator div):

```jsx
{editingShift && (
  <EditShiftSheet
    shift={editingShift}
    userId={userId}
    onClose={() => setEditingShift(null)}
    onSaved={refresh}
    onDelete={handleDelete}
  />
)}
```

- [ ] **Add cleanup for `deleteTimer` in the existing cleanup effect** — find the `useEffect(() => () => clearTimeout(toastTimer.current), [])` line and update to:

```jsx
useEffect(() => () => {
  clearTimeout(toastTimer.current);
  clearTimeout(deleteTimer.current);
}, []);
```

- [ ] **Build:**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit:**

```bash
git add frontend/src/App.jsx
git commit -m "feat: wire edit/undo-delete in App — editingShift state, handleDelete with 5s optimistic delay"
```

---

### Task 8: EarningsSummary — tappable shift rows

**Files:**
- Modify: `frontend/src/components/EarningsSummary.jsx`

- [ ] **Update the component signature** — change `{ data, loading }` to `{ filteredShifts, filteredSummary, loading, onEdit }`

- [ ] **Update the body** — replace the lines that read from `data`:

```jsx
// OLD
const summary = data?.summary;
const shifts = data?.shifts ?? [];
const breakdown = summary?.breakdown_by_platform ?? {};
const recent = shifts.slice(0, 12);
const grouped = groupByDate(recent, t);
const hasBreakdown = PLATFORMS.some((p) => (breakdown[p.id] ?? 0) > 0);

// NEW
const breakdown = filteredSummary?.breakdown_by_platform ?? {};
const recent = (filteredShifts ?? []).slice(0, 20);
const grouped = groupByDate(recent, t);
const hasBreakdown = PLATFORMS.some((p) => (breakdown[p.id] ?? 0) > 0);
```

- [ ] **Make each shift `<li>` a tappable button** — replace the `<li>` contents:

```jsx
<li key={s.id}>
  <button
    onClick={() => onEdit(s)}
    className="w-full flex items-center gap-2.5 py-2.5 min-h-[44px] text-left rounded-lg px-1 hover:bg-neutral-800/30 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
  >
    <div
      className="w-1.5 h-1.5 rounded-full shrink-0"
      style={{ backgroundColor: platformColor(s.platform) }}
    />
    <span className="flex-1 text-sm text-neutral-400">
      {platformLabel(s.platform)}
    </span>
    <span
      className="text-sm font-bold text-white"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      RM{s.amount.toFixed(2)}
    </span>
    <span className="text-xs text-neutral-600 w-14 text-right shrink-0">
      {timeAgo(s.logged_at)}
    </span>
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-3.5 h-3.5 text-neutral-700 shrink-0"
    >
      <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" strokeLinejoin="round" />
    </svg>
  </button>
</li>
```

- [ ] **Remove the outer `<ul className="divide-y ...">` divider** — the tap target button replaces it. Use `<ul className="space-y-0.5">` instead.

- [ ] **Build:**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Update App.jsx** to pass the new props — find `<EarningsSummary data={data} loading={loading || !userId} />` and replace:

```jsx
<EarningsSummary
  filteredShifts={visibleShifts}
  filteredSummary={data?.summary}
  loading={loading || !userId}
  onEdit={setEditingShift}
/>
```

(Temporarily using `visibleShifts` and `data?.summary` — will be replaced by the proper `filteredShifts` + `filteredSummary` in Phase B.)

- [ ] **Build again:**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit:**

```bash
git add frontend/src/components/EarningsSummary.jsx frontend/src/App.jsx
git commit -m "feat: make shift rows tappable for editing, wire to EditShiftSheet"
```

---

### Task 9: Phase A build verify

- [ ] **Full build:**

```bash
cd frontend && npm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Backend import check:**

```bash
cd backend && python -c "import main; print('OK')"
```

Expected: `OK`

- [ ] **Manual smoke test** (start both servers, open browser):
  - Log a shift → shift-logged toast appears, row shows in list with pencil icon
  - Tap a shift row → EditShiftSheet opens with correct platform pre-selected and amount pre-filled
  - Change amount → "Save changes" enables, tap it → sheet closes, hero total updates
  - Open a shift → tap "Delete shift" → sheet closes, shift disappears immediately, "Shift deleted / Undo" toast appears
  - Tap Undo within 5s → shift reappears with identical data
  - Open a shift → delete without undoing → after 5s, shift is gone on next refresh (or already gone from UI)
  - Delete the only shift this week → ComplianceCard flips to "No coverage this week — log a shift"

---

## Phase B — Filters, Charts, Accessibility

---

### Task 10: Re-add Recharts

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.js`

- [ ] **Install Recharts:**

```bash
cd frontend && npm install recharts
```

- [ ] **Open `frontend/vite.config.js`** and re-add the `charts` chunk to `manualChunks`. Find the `manualChunks` object and add:

```js
charts: ["recharts"],
```

- [ ] **Build to verify Recharts resolves correctly:**

```bash
npm run build 2>&1 | tail -8
```

Expected output includes a `charts-*.js` chunk.

- [ ] **Commit:**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js
git commit -m "feat: re-add recharts for scope-aware charts"
```

---

### Task 11: utils.js — isoWeekLabel + App.jsx filter state + filteredShifts

**Files:**
- Create: `frontend/src/utils.js`
- Modify: `frontend/src/App.jsx`

- [ ] **Create `frontend/src/utils.js`:**

```js
/**
 * Returns an ISO 8601 week label (e.g. "2026-W24") matching Python's
 * datetime.isocalendar() output used by the backend's week_label field.
 */
export function isoWeekLabel(date = new Date()) {
  const raw = date instanceof Date ? date : new Date(date);
  // Work in UTC to match server-side computation.
  const d = new Date(Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate()));
  const dayOfWeek = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek); // advance to Thursday
  const year = d.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((d - startOfYear) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
```

- [ ] **Add import to `App.jsx`:**

```jsx
import { isoWeekLabel } from "./utils";
```

- [ ] **Add `filter` state inside the `App` component** (after existing state):

```jsx
const [filter, setFilter] = useState({ timeScope: "week", platform: "all" });
```

- [ ] **Replace the existing `visibleShifts` memo with a full `filteredShifts` + `filteredSummary` derivation** — add these after the `visibleShifts` definition:

```jsx
const filteredShifts = useMemo(() => {
  let result = visibleShifts;
  if (filter.platform !== "all") {
    result = result.filter((s) => s.platform === filter.platform);
  }
  const now = new Date();
  if (filter.timeScope === "week") {
    const currentWeek = isoWeekLabel(now);
    result = result.filter((s) => s.week_label === currentWeek);
  } else if (filter.timeScope === "month") {
    const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    result = result.filter((s) => new Date(s.logged_at).toISOString().slice(0, 7) === ym);
  }
  return result;
}, [visibleShifts, filter]);

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
```

- [ ] **Add a `handleClearFilters` helper:**

```jsx
function handleClearFilters() {
  setFilter({ timeScope: "week", platform: "all" });
}
```

- [ ] **Build:**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit:**

```bash
git add frontend/src/utils.js frontend/src/App.jsx
git commit -m "feat: add isoWeekLabel util, filter state, filteredShifts + filteredSummary memos in App"
```

---

### Task 12: FilterBar.jsx with roving tabindex

**Files:**
- Create: `frontend/src/components/FilterBar.jsx`

- [ ] **Create `frontend/src/components/FilterBar.jsx`:**

```jsx
import { useEffect, useRef, useState } from "react";
import { PLATFORMS, platformLabel } from "../platforms";
import { useLang } from "../context/LanguageContext";

function RadioGroup({ groupLabel, options, value, onChange, className = "" }) {
  const refs = useRef([]);
  const [focusIdx, setFocusIdx] = useState(() =>
    Math.max(0, options.findIndex((o) => o.id === value))
  );

  // Sync focusIdx when value changes externally (e.g. clear filters).
  useEffect(() => {
    setFocusIdx(Math.max(0, options.findIndex((o) => o.id === value)));
  }, [value, options]);

  function handleKeyDown(e, idx) {
    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = (idx + 1) % options.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = (idx - 1 + options.length) % options.length;
    } else {
      return;
    }
    e.preventDefault();
    setFocusIdx(next);
    refs.current[next]?.focus();
    onChange(options[next].id);
  }

  return (
    <div role="radiogroup" aria-label={groupLabel} className={className}>
      {options.map((opt, i) => (
        <button
          key={opt.id}
          ref={(el) => (refs.current[i] = el)}
          role="radio"
          aria-checked={value === opt.id}
          tabIndex={i === focusIdx ? 0 : -1}
          onClick={() => {
            setFocusIdx(i);
            onChange(opt.id);
          }}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className={`flex-1 min-h-[44px] text-xs font-semibold rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-accent whitespace-nowrap px-3 ${
            value === opt.id
              ? "bg-accent text-neutral-950"
              : "bg-neutral-800 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function FilterBar({ filter, onChange }) {
  const { t } = useLang();

  const TIME_OPTIONS = [
    { id: "week", label: t.thisWeek },
    { id: "month", label: t.thisMonth },
    { id: "all", label: t.allTime },
  ];

  const PLATFORM_OPTIONS = [
    { id: "all", label: t.filterAll },
    ...PLATFORMS.map((p) => ({ id: p.id, label: platformLabel(p.id) })),
  ];

  return (
    <div className="px-4 space-y-2">
      {/* Time scope */}
      <RadioGroup
        groupLabel="Time scope"
        options={TIME_OPTIONS}
        value={filter.timeScope}
        onChange={(timeScope) => onChange({ ...filter, timeScope })}
        className="grid grid-cols-3 gap-1"
      />
      {/* Platform chips — scrollable */}
      <div className="overflow-x-auto phone-scroll -mx-0">
        <RadioGroup
          groupLabel="Platform filter"
          options={PLATFORM_OPTIONS}
          value={filter.platform}
          onChange={(platform) => onChange({ ...filter, platform })}
          className="flex gap-1 w-max"
        />
      </div>
    </div>
  );
}
```

- [ ] **Build:**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit:**

```bash
git add frontend/src/components/FilterBar.jsx
git commit -m "feat: add FilterBar with time-scope segments and platform chips, roving tabindex"
```

---

### Task 13: App.jsx — wire FilterBar + update HeroMetric + suppress ProjectionCard

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Import FilterBar and add it to App.jsx imports section:**

```jsx
import FilterBar from "./components/FilterBar";
```

- [ ] **Update `HeroMetric` to accept `filteredSummary` and `filter` instead of `summary`** — replace the function signature and body:

```jsx
function HeroMetric({ filteredSummary, filter, loading }) {
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

  const total = filteredSummary?.total_earned ?? 0;
  const socso = filteredSummary?.total_socso ?? 0;
  const count = filteredSummary?.shift_count ?? 0;

  // Build the label that always tells the user what the number represents.
  let scopeLabel =
    filter.timeScope === "week" ? t.thisWeek
    : filter.timeScope === "month" ? t.thisMonth
    : t.allTime;
  if (filter.platform !== "all") {
    scopeLabel = `${platformLabel(filter.platform)} · ${scopeLabel.toLowerCase()}`;
  }

  return (
    <div className="px-5 pt-2 pb-4">
      <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-500 mb-1.5">
        {scopeLabel}
      </p>
      <p
        className="text-5xl font-extrabold text-white leading-none"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        RM{total.toFixed(2)}
      </p>
      <p className="text-sm text-neutral-500 mt-2 leading-snug">
        {t.socsoCredited(socso.toFixed(2))}
        {count > 0 && <span> &middot; {t.shiftCount(count)}</span>}
      </p>
    </div>
  );
}
```

Note: `platformLabel` is already imported from `"./platforms"` at the top of `App.jsx`. Remove the `require()` call — just use it directly.

- [ ] **Update the JSX render tree** — find the existing `<HeroMetric summary={...} loading={...} />` and replace with:

```jsx
<FilterBar filter={filter} onChange={setFilter} />
<HeroMetric filteredSummary={filteredSummary} filter={filter} loading={loading || !userId} />
```

- [ ] **Update `EarningsSummary` props** to use real filtered data:

```jsx
<EarningsSummary
  filteredShifts={filteredShifts}
  filteredSummary={filteredSummary}
  loading={loading || !userId}
  onEdit={setEditingShift}
  onClearFilters={handleClearFilters}
  filter={filter}
/>
```

- [ ] **Update `ProjectionCard` props** — add `filter`:

```jsx
<ProjectionCard summary={data?.summary} filter={filter} />
```

- [ ] **Update `ProjectionCard.jsx`** to suppress when filter is not default — open `ProjectionCard.jsx` and change the early-return guard from:

```jsx
if (shiftCount === 0 || weekTotal <= 0) return null;
```

to:

```jsx
// Projections from partial filtered data are misleading and deliberately suppressed.
if (!filter || filter.timeScope !== "week" || filter.platform !== "all") return null;
if (shiftCount === 0 || weekTotal <= 0) return null;
```

And update the function signature from `{ summary }` to `{ summary, filter }`.

- [ ] **Build:**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit:**

```bash
git add frontend/src/App.jsx frontend/src/components/ProjectionCard.jsx
git commit -m "feat: wire FilterBar, update HeroMetric for filtered label, suppress ProjectionCard on filtered views"
```

---

### Task 14: ChartsCard.jsx

**Files:**
- Create: `frontend/src/components/ChartsCard.jsx`

- [ ] **Create `frontend/src/components/ChartsCard.jsx`:**

```jsx
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { isoWeekLabel } from "../utils";

const ACCENT = "#10b981";
const MUTED = "#404040";

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#141414",
    border: "1px solid #1e1e1e",
    borderRadius: 8,
    fontSize: 11,
    color: "#e5e5e5",
  },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

function buildDailyData(shifts) {
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const s of shifts) {
    totals[new Date(s.logged_at).getDay()] += s.amount;
  }
  const today = new Date().getDay();
  return DAY_NAMES.map((name, i) => ({
    name,
    value: Math.round(totals[i] * 100) / 100,
    isToday: i === today,
  }));
}

function buildWeeklyData(shifts, timeScope) {
  const weekMap = {};
  for (const s of shifts) {
    weekMap[s.week_label] = (weekMap[s.week_label] ?? 0) + s.amount;
  }
  const currentWeek = isoWeekLabel();
  let keys = Object.keys(weekMap).sort();
  if (timeScope === "all") keys = keys.slice(-8);
  return keys.map((wk) => ({
    name: wk.replace(/^\d{4}-/, ""),
    value: Math.round((weekMap[wk] ?? 0) * 100) / 100,
    isCurrentWeek: wk === currentWeek,
  }));
}

function buildAriaLabel(data, timeScope) {
  if (data.length === 0) return "No earnings data for this period";
  const max = data.reduce((m, d) => (d.value > m.value ? d : m), data[0]);
  return timeScope === "week"
    ? `Daily earnings this week. Highest: ${max.name} RM${max.value.toFixed(2)}`
    : `Weekly earnings trend. Highest: ${max.name} RM${max.value.toFixed(2)}`;
}

function TodayLabel({ x, y, width, value, data, index }) {
  if (!data[index]?.isToday || !value) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill={ACCENT}
      fontSize={9}
      textAnchor="middle"
      fontVariantNumeric="tabular-nums"
    >
      {`RM${Number(value).toFixed(0)}`}
    </text>
  );
}

export default function ChartsCard({ filteredShifts, timeScope }) {
  const isWeek = timeScope === "week";
  const data = isWeek
    ? buildDailyData(filteredShifts)
    : buildWeeklyData(filteredShifts, timeScope);

  const ariaLabel = buildAriaLabel(data, timeScope);
  const hasData = data.some((d) => d.value > 0);

  if (!hasData) return null;

  return (
    <section
      className="mx-4 bg-card border border-card-edge rounded-2xl p-4"
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barCategoryGap="20%">
          <Bar dataKey="value" radius={[3, 3, 0, 0]} minPointSize={2}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isToday || entry.isCurrentWeek ? ACCENT : MUTED}
              />
            ))}
            <LabelList
              dataKey="value"
              content={(props) => <TodayLabel {...props} data={data} />}
            />
          </Bar>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#525252", fontSize: 10 }}
          />
          <Tooltip
            formatter={(v) => [`RM${Number(v).toFixed(2)}`, "Earned"]}
            {...TOOLTIP_STYLE}
          />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
```

- [ ] **Import and render `ChartsCard` in `App.jsx`** — add the import:

```jsx
import ChartsCard from "./components/ChartsCard";
```

Then add the component between `EarningsSummary` and `ProjectionCard`:

```jsx
<ChartsCard filteredShifts={filteredShifts} timeScope={filter.timeScope} />
```

- [ ] **Build:**

```bash
npm run build 2>&1 | tail -8
```

Expected: `charts-*.js` chunk appears.

- [ ] **Commit:**

```bash
git add frontend/src/components/ChartsCard.jsx frontend/src/App.jsx
git commit -m "feat: add ChartsCard with daily bars (week) and weekly trend (month/all) via Recharts"
```

---

### Task 15: EarningsSummary — empty filtered state + filter prop

**Files:**
- Modify: `frontend/src/components/EarningsSummary.jsx`

- [ ] **Update the component signature** to accept `filter` and `onClearFilters`:

```jsx
export default function EarningsSummary({ filteredShifts, filteredSummary, filter, loading, onEdit, onClearFilters })
```

- [ ] **Add the empty-filtered-state block** — replace the `{recent.length > 0 && ...}` block so that when `filteredShifts` is empty it shows an informative message:

```jsx
{recent.length === 0 ? (
  <div className="py-4 text-center space-y-2">
    <p className="text-sm text-neutral-600">
      {filter?.platform !== "all"
        ? t.noShiftsFiltered(platformLabel(filter.platform))
        : t.noShiftsYet}
    </p>
    {(filter?.platform !== "all" || filter?.timeScope !== "week") && (
      <button
        onClick={onClearFilters}
        className="text-xs text-accent focus-visible:outline-2 focus-visible:outline-accent rounded"
      >
        {t.clearFilters}
      </button>
    )}
  </div>
) : (
  <div className="mt-4">
    {Array.from(grouped.entries()).map(([dateLabel, dayShifts], groupIndex) => (
      <div key={dateLabel}>
        <p
          className={`text-[11px] font-medium tracking-widest uppercase text-neutral-600 mb-1.5 ${
            groupIndex > 0 ? "mt-3" : ""
          }`}
        >
          {dateLabel}
        </p>
        <ul className="space-y-0.5">
          {dayShifts.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onEdit(s)}
                className="w-full flex items-center gap-2.5 py-2.5 min-h-[44px] text-left rounded-lg px-1 hover:bg-neutral-800/30 transition-colors focus-visible:outline-2 focus-visible:outline-accent"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: platformColor(s.platform) }}
                />
                <span className="flex-1 text-sm text-neutral-400">
                  {platformLabel(s.platform)}
                </span>
                <span
                  className="text-sm font-bold text-white"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  RM{s.amount.toFixed(2)}
                </span>
                <span className="text-xs text-neutral-600 w-14 text-right shrink-0">
                  {timeAgo(s.logged_at)}
                </span>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-3.5 h-3.5 text-neutral-700 shrink-0"
                >
                  <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
)}
```

- [ ] **Build:**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Commit:**

```bash
git add frontend/src/components/EarningsSummary.jsx
git commit -m "feat: EarningsSummary empty-filtered state with clear-filters CTA"
```

---

### Task 16: i18n — filter strings + Phase B build verify

**Files:**
- Modify: `frontend/src/i18n.js`

- [ ] **Add filter strings to the `en` object** (under the `// Projection card` section):

```js
// Filter bar
thisMonth: "This month",
allTime: "All time",
filterAll: "All",
noShiftsFiltered: (platform) => `No ${platform} shifts in this period.`,
clearFilters: "Clear filters",
```

- [ ] **Add BM equivalents to the `bm` object:**

```js
// Filter bar
thisMonth: "Bulan ini",
allTime: "Semua masa",
filterAll: "Semua",
noShiftsFiltered: (platform) => `Tiada syif ${platform} dalam tempoh ini.`,
clearFilters: "Padam penapis",
```

- [ ] **Final build:**

```bash
cd frontend && npm run build
```

Expected output (approximate):
```
dist/assets/index.html       ~1 kB
dist/assets/index-*.css      ~22 kB
dist/assets/firebase-*.js    ~160 kB
dist/assets/charts-*.js      ~180 kB  ← recharts chunk
dist/assets/index-*.js       ~180 kB
✓ built in ~3s
```

- [ ] **Backend verify:**

```bash
cd backend && python -c "import main; print('backend OK')"
```

- [ ] **Manual verification checklist:**
  - [ ] Time scope: tap "This month" → hero label changes, chart shows weekly bars, projection hidden
  - [ ] Platform filter: tap "Grab" → hero says "Grab · this week", chart + list show only Grab shifts
  - [ ] Combined: "Grab" + "This month" → correct
  - [ ] Empty state: filter to a platform with no shifts → "No X shifts in this period." + "Clear filters" button
  - [ ] Clear filters: tap "Clear filters" → resets to week + all
  - [ ] Chart: week scope → 7 daily bars, today column is emerald with RM label
  - [ ] Chart: month scope → weekly bars, current week emerald
  - [ ] ProjectionCard: visible at week+all, hidden otherwise
  - [ ] Language toggle: filter bar labels switch EN↔BM correctly
  - [ ] Keyboard: arrow keys navigate time-scope segments and platform chips
  - [ ] CRUD: edit + delete + undo still work after Phase B changes

- [ ] **Commit:**

```bash
git add frontend/src/i18n.js
git commit -m "feat: add filter i18n strings (thisMonth, allTime, filterAll, noShiftsFiltered, clearFilters)"
```
