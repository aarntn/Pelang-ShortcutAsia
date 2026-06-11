"""GigShield MY — FastAPI backend.

Routes:
    GET  /ping                health check
    POST /shifts              log a shift (SOCSO auto-calculated)
    PATCH  /shifts/{shift_id} update amount/platform (ownership-checked)
    DELETE /shifts/{shift_id} delete a shift (ownership-checked)
    GET  /shifts/{user_id}    all shifts + aggregated summary
"""
import os
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from firebase_client import get_db
from models import (
    SOCSO_RATE,
    DeleteResponse,
    Shift,
    ShiftCreate,
    ShiftUpdate,
    ShiftsResponse,
    ShiftSummary,
)

app = FastAPI(title="GigShield MY API", version="1.0.0")

# CORS — localhost for dev, Vercel domain via env var for production.
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)


def iso_week_label(dt: datetime) -> str:
    """ISO week label, e.g. 2026-W24."""
    iso = dt.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


@app.get("/ping")
def ping():
    return {"status": "ok"}


@app.post("/shifts", response_model=Shift)
def create_shift(payload: ShiftCreate):
    db = get_db()
    now = datetime.now(timezone.utc)

    socso = round(payload.amount * SOCSO_RATE, 2)
    doc = {
        "user_id": payload.user_id,
        "platform": payload.platform.value,
        "amount": payload.amount,
        "socso_deducted": socso,
        "logged_at": now,
        "week_label": iso_week_label(now),
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
    # logged_at and week_label are immutable — never updated.
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
