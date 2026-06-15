"""Pelang — FastAPI backend.

Routes:
    GET  /ping                health check
    POST /shifts              log a shift (SOCSO auto-calculated)
    PATCH  /shifts/{shift_id} update amount/platform (ownership-checked)
    DELETE /shifts/{shift_id} delete a shift (ownership-checked)
    GET  /shifts/{user_id}    all shifts + aggregated summary
"""
import json
import os
from collections import defaultdict
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from firebase_client import get_db
from models import (
    SOCSO_RATE,
    BulkShiftCreate,
    BulkShiftResponse,
    DeleteResponse,
    Expense,
    ExpenseCreate,
    ExpensesResponse,
    OcrRequest,
    OcrResult,
    Platform,
    Shift,
    ShiftCreate,
    ShiftUpdate,
    ShiftsResponse,
    ShiftSummary,
)

app = FastAPI(title="Pelang API", version="1.0.0")

# CORS — public API (no cookies, Firebase UID sent in body), so allow any origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)


def iso_week_label(dt: datetime) -> str:
    """ISO week label, e.g. 2026-W24."""
    iso = dt.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


_GEMINI_MODEL = "gemini-2.0-flash"
_GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{_GEMINI_MODEL}:generateContent"
)
_OCR_PROMPT = """\
Look at this gig-delivery app screenshot and extract:
1. The FINAL total earnings amount shown in RM (the biggest number, not a sub-total or tip breakdown).
2. Which platform the app belongs to.

Reply with ONLY this JSON — no markdown, no explanation:
{"amount": 45.50, "platform": "grab", "confidence": "high"}

Platform values: grab, foodpanda, lalamove, shopeefood, maxim, indrive, other
Use "other" if the platform is not in the list above.
Set confidence "low" and amount null if you cannot clearly read the RM total.\
"""


@app.get("/ping")
def ping():
    return {"status": "ok"}


@app.post("/ocr-shift", response_model=OcrResult)
def ocr_shift(payload: OcrRequest):
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="OCR service not configured on this server")

    body = {
        "contents": [{
            "parts": [
                {"inline_data": {"mime_type": payload.mime_type, "data": payload.image_base64}},
                {"text": _OCR_PROMPT},
            ]
        }],
        "generationConfig": {"response_mime_type": "application/json", "temperature": 0},
    }

    try:
        resp = httpx.post(f"{_GEMINI_URL}?key={api_key}", json=body, timeout=25)
        resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Gemini API returned {exc.response.status_code}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="OCR request timed out")

    try:
        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(text)
    except Exception:
        raise HTTPException(status_code=502, detail="Could not parse Gemini response")

    # Sanitise amount
    raw_amount = parsed.get("amount")
    amount: float | None = None
    if raw_amount is not None:
        try:
            amount = round(float(raw_amount), 2)
            if not (0 < amount <= 10_000):
                amount = None
        except (ValueError, TypeError):
            pass

    # Sanitise platform
    valid_platforms = {p.value for p in Platform}
    platform_raw = str(parsed.get("platform", "other")).lower().strip()
    platform = platform_raw if platform_raw in valid_platforms else "other"

    confidence = "high" if (amount is not None and parsed.get("confidence") == "high") else "low"

    return OcrResult(amount=amount, platform=platform, confidence=confidence)


@app.post("/shifts", response_model=Shift)
def create_shift(payload: ShiftCreate):
    db = get_db()
    now = datetime.now(timezone.utc)
    if payload.logged_date is not None:
        # Noon UTC keeps the timestamp stable within the chosen day.
        logged_at = datetime(payload.logged_date.year, payload.logged_date.month,
                             payload.logged_date.day, 12, 0, tzinfo=timezone.utc)
    else:
        logged_at = now

    socso = round(payload.amount * SOCSO_RATE, 2)
    doc = {
        "user_id": payload.user_id,
        "platform": payload.platform.value,
        "amount": payload.amount,
        "socso_deducted": socso,
        "logged_at": logged_at,
        "week_label": iso_week_label(logged_at),
    }
    ref = db.collection("shifts").document()
    ref.set(doc)

    # Ensure the user document exists (first shift creates it).
    user_ref = db.collection("users").document(payload.user_id)
    if not user_ref.get().exists:
        user_ref.set({
            "platform_default": payload.platform.value,
            "created_at": now,
            "epf_nudge_sent": False,
        })

    return Shift(id=ref.id, **doc)


@app.post("/shifts/bulk", response_model=BulkShiftResponse)
def create_shifts_bulk(payload: BulkShiftCreate):
    """Statement import — create many backdated shifts in one batch write."""
    db = get_db()
    batch = db.batch()
    for item in payload.shifts:
        logged_at = datetime(item.logged_date.year, item.logged_date.month,
                             item.logged_date.day, 12, 0, tzinfo=timezone.utc)
        ref = db.collection("shifts").document()
        batch.set(ref, {
            "user_id": payload.user_id,
            "platform": item.platform.value,
            "amount": item.amount,
            "socso_deducted": round(item.amount * SOCSO_RATE, 2),
            "logged_at": logged_at,
            "week_label": iso_week_label(logged_at),
        })
    batch.commit()
    return BulkShiftResponse(created=len(payload.shifts))


@app.post("/expenses", response_model=Expense)
def create_expense(payload: ExpenseCreate):
    db = get_db()
    if payload.logged_date is not None:
        logged_at = datetime(payload.logged_date.year, payload.logged_date.month,
                             payload.logged_date.day, 12, 0, tzinfo=timezone.utc)
    else:
        logged_at = datetime.now(timezone.utc)

    doc = {
        "user_id": payload.user_id,
        "category": payload.category.value,
        "amount": payload.amount,
        "logged_at": logged_at,
    }
    ref = db.collection("expenses").document()
    ref.set(doc)
    return Expense(id=ref.id, **doc)


@app.get("/expenses/{user_id}", response_model=ExpensesResponse)
def list_expenses(user_id: str):
    if not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")
    db = get_db()
    # No order_by: equality-filter + sort needs a composite index Firestore
    # won't auto-create. Per-user expense lists are small — sort in memory.
    docs = db.collection("expenses").where("user_id", "==", user_id).stream()
    expenses = [Expense(id=d.id, **d.to_dict()) for d in docs]
    expenses.sort(key=lambda e: e.logged_at, reverse=True)
    return ExpensesResponse(expenses=expenses)


@app.delete("/expenses/{expense_id}", response_model=DeleteResponse)
def delete_expense(expense_id: str, user_id: str):
    db = get_db()
    ref = db.collection("expenses").document(expense_id)
    snap = ref.get()
    # 404 (never 403) so callers cannot probe for document existence.
    if not snap.exists or snap.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Expense not found")
    ref.delete()
    return DeleteResponse(deleted=expense_id)


def _require_owned_shift(db, shift_id: str, user_id: str):
    """Return the DocumentReference for shift_id after verifying ownership.

    Raises 404 (never 403) so callers cannot probe for document existence.
    """
    ref = db.collection("shifts").document(shift_id)
    snap = ref.get()
    if not snap.exists or snap.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Shift not found")
    return ref, snap


@app.patch("/shifts/{shift_id}", response_model=Shift)
def update_shift(shift_id: str, payload: ShiftUpdate):
    db = get_db()
    ref, snap = _require_owned_shift(db, shift_id, payload.user_id)

    updates: dict = {}
    if payload.amount is not None:
        updates["amount"] = payload.amount
        updates["socso_deducted"] = round(payload.amount * SOCSO_RATE, 2)
    if payload.platform is not None:
        updates["platform"] = payload.platform.value
    # logged_at/week_label were immutable until backdating existed; date
    # correction is now a first-class edit (see DOCUMENTATION.md).
    if payload.logged_date is not None:
        logged_at = datetime(payload.logged_date.year, payload.logged_date.month,
                             payload.logged_date.day, 12, 0, tzinfo=timezone.utc)
        updates["logged_at"] = logged_at
        updates["week_label"] = iso_week_label(logged_at)
    if updates:
        ref.update(updates)

    updated = ref.get().to_dict()
    return Shift(id=shift_id, **updated)


@app.delete("/shifts/{shift_id}", response_model=DeleteResponse)
def delete_shift(shift_id: str, user_id: str):
    db = get_db()
    ref, _ = _require_owned_shift(db, shift_id, user_id)
    ref.delete()
    return DeleteResponse(deleted=shift_id)


@app.get("/shifts/{user_id}", response_model=ShiftsResponse)
def list_shifts(user_id: str):
    if not user_id.strip():
        raise HTTPException(status_code=400, detail="user_id is required")

    db = get_db()
    docs = (
        db.collection("shifts")
        .where("user_id", "==", user_id)
        .order_by("logged_at", direction="DESCENDING")
        .stream()
    )

    shifts: list[Shift] = []
    for d in docs:
        data = d.to_dict()
        shifts.append(Shift(id=d.id, **data))

    current_week = iso_week_label(datetime.now(timezone.utc))

    total_all = 0.0
    total_week = 0.0
    socso_all = 0.0
    socso_week = 0.0
    by_platform: dict[str, float] = defaultdict(float)
    week_count = 0

    for s in shifts:
        total_all += s.amount
        socso_all += s.socso_deducted
        by_platform[s.platform.value] += s.amount
        if s.week_label == current_week:
            total_week += s.amount
            socso_week += s.socso_deducted
            week_count += 1

    summary = ShiftSummary(
        total_earned_all_time=round(total_all, 2),
        total_earned_this_week=round(total_week, 2),
        total_socso_all_time=round(socso_all, 2),
        total_socso_this_week=round(socso_week, 2),
        breakdown_by_platform={k: round(v, 2) for k, v in by_platform.items()},
        shift_count_this_week=week_count,
    )

    return ShiftsResponse(shifts=shifts, summary=summary)
