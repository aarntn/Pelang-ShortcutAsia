"""Pydantic models for Pelang."""
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
    # +1 day tolerance: a client east of UTC (Malaysia is UTC+8) may
    # legitimately send its local "today" while the server is still on
    # the previous UTC date.
    if v > today + timedelta(days=1):
        raise ValueError("logged_date cannot be in the future")
    if v < today - timedelta(days=366):
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


class BulkShiftItem(BaseModel):
    """One row of an imported earnings statement."""
    platform: Platform
    amount: float = Field(..., gt=0, le=10_000)
    logged_date: date  # statements always carry a date

    @field_validator("amount")
    @classmethod
    def round_to_sen(cls, v: float) -> float:
        return round(v, 2)

    @field_validator("logged_date")
    @classmethod
    def within_bounds(cls, v: date) -> date:
        return _validate_logged_date(v)


class BulkShiftCreate(BaseModel):
    """Payload for POST /shifts/bulk (statement import)."""
    user_id: str = Field(..., min_length=1)
    shifts: list[BulkShiftItem] = Field(..., min_length=1, max_length=200)


class BulkShiftResponse(BaseModel):
    created: int


class ExpenseCategory(str, Enum):
    FUEL = "fuel"
    DATA = "data"
    MAINTENANCE = "maintenance"
    OTHER = "other"


class ExpenseCreate(BaseModel):
    """Payload for POST /expenses."""
    user_id: str = Field(..., min_length=1)
    category: ExpenseCategory
    amount: float = Field(..., gt=0, le=10_000, description="RM spent")
    logged_date: Optional[date] = None

    @field_validator("amount")
    @classmethod
    def round_to_sen(cls, v: float) -> float:
        return round(v, 2)

    @field_validator("logged_date")
    @classmethod
    def within_bounds(cls, v: Optional[date]) -> Optional[date]:
        return _validate_logged_date(v)


class Expense(BaseModel):
    """A stored expense document."""
    id: str
    user_id: str
    category: ExpenseCategory
    amount: float
    logged_at: datetime


class ExpensesResponse(BaseModel):
    expenses: list[Expense]


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


ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


class OcrRequest(BaseModel):
    """Payload for POST /ocr-shift."""
    image_base64: str = Field(..., description="Base64-encoded image, max ~3 MB raw")
    mime_type: str = Field(default="image/jpeg")

    @field_validator("mime_type")
    @classmethod
    def validate_mime(cls, v: str) -> str:
        if v not in ALLOWED_MIME_TYPES:
            raise ValueError(f"mime_type must be one of {ALLOWED_MIME_TYPES}")
        return v

    @field_validator("image_base64")
    @classmethod
    def validate_size(cls, v: str) -> str:
        if len(v) > 4_200_000:  # ~3 MB raw after base64 overhead
            raise ValueError("Image too large — compress to under 3 MB before uploading")
        return v


class OcrResult(BaseModel):
    """Response from POST /ocr-shift."""
    amount: Optional[float] = None
    platform: str = "other"
    confidence: str = "low"  # "high" | "low"
