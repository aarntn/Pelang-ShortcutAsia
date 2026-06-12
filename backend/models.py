"""Pydantic models for GigShield MY."""
from datetime import date, datetime, timedelta, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator

SOCSO_RATE = 0.0125  # Gig Workers Act 2025 — 1.25% per shift


def _validate_logged_date(v: Optional[date]) -> Optional[date]:
    """Shared bounds check for backdated shift dates."""
    if v is None:
        return v
    today = datetime.now(timezone.utc).date()
    if v > today:
        raise ValueError("logged_date cannot be in the future")
    if v < today - timedelta(days=365):
        raise ValueError("logged_date cannot be more than a year ago")
    return v


class Platform(str, Enum):
    GRAB = "grab"
    FOODPANDA = "foodpanda"
    LALAMOVE = "lalamove"
    SHOPEEFOOD = "shopeefood"
    MAXIM = "maxim"
    INDRIVE = "indrive"
    OTHER = "other"


class ShiftCreate(BaseModel):
    """Payload for POST /shifts."""
    user_id: str = Field(..., min_length=1)
    platform: Platform
    amount: float = Field(..., gt=0, le=10_000, description="RM earned this shift")
    logged_date: Optional[date] = None

    @field_validator("amount")
    @classmethod
    def round_to_sen(cls, v: float) -> float:
        return round(v, 2)

    @field_validator("logged_date")
    @classmethod
    def within_bounds(cls, v: Optional[date]) -> Optional[date]:
        return _validate_logged_date(v)


class Shift(BaseModel):
    """A stored shift document."""
    id: str
    user_id: str
    platform: Platform
    amount: float
    socso_deducted: float
    logged_at: datetime
    week_label: str  # ISO week, e.g. "2026-W24"


class ShiftUpdate(BaseModel):
    """Payload for PATCH /shifts/{shift_id}."""
    user_id: str = Field(..., min_length=1)
    platform: Optional[Platform] = None
    amount: Optional[float] = Field(None, gt=0, le=10_000)
    logged_date: Optional[date] = None

    @field_validator("amount")
    @classmethod
    def round_to_sen(cls, v: float) -> float:
        return round(v, 2) if v is not None else v

    @field_validator("logged_date")
    @classmethod
    def within_bounds(cls, v: Optional[date]) -> Optional[date]:
        return _validate_logged_date(v)


class DeleteResponse(BaseModel):
    deleted: str


class ShiftSummary(BaseModel):
    """Aggregates returned alongside the shift list."""
    total_earned_all_time: float
    total_earned_this_week: float
    total_socso_all_time: float
    total_socso_this_week: float
    breakdown_by_platform: dict[str, float]
    shift_count_this_week: int


class ShiftsResponse(BaseModel):
    """Response body for GET /shifts/{user_id}."""
    shifts: list[Shift]
    summary: ShiftSummary


class UserProfile(BaseModel):
    """users/{userId} document."""
    platform_default: Optional[Platform] = None
    created_at: datetime
    epf_nudge_sent: bool = False
