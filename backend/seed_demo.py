"""
Seed realistic demo data for Pelang. Writes directly to Firestore via the
Admin SDK so historical dates and real times-of-day are correct (the bulk
API endpoint forces noon UTC, which would mute the best-time insight).

Covers 1 Apr – today: shifts most days, fuel/data/maintenance expenses,
and deliberately strong Saturday evenings so the pattern insights fire.

Usage:
    python seed_demo.py            # auto-detects UID from the latest shift
    python seed_demo.py <user_id>  # explicit UID
"""
import os
import random
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(__file__))
from firebase_client import get_db

SOCSO_RATE = 0.0125
MYT = timezone(timedelta(hours=8))  # Malaysia local time

PLATFORM_PROFILES = {
    "grab":       {"weight": 40, "amounts": (22, 38, 45, 52, 67, 78)},
    "foodpanda":  {"weight": 20, "amounts": (18, 24, 31, 40, 47, 55)},
    "shopeefood": {"weight": 13, "amounts": (15, 22, 28, 35, 44)},
    "lalamove":   {"weight": 14, "amounts": (55, 72, 88, 105, 120)},
    "maxim":      {"weight": 8,  "amounts": (18, 25, 32, 38)},
    "indrive":    {"weight": 5,  "amounts": (30, 45, 58, 70)},
}


def iso_week_label(dt):
    iso = dt.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def pick_platform():
    platforms = list(PLATFORM_PROFILES.keys())
    weights = [PLATFORM_PROFILES[p]["weight"] for p in platforms]
    return random.choices(platforms, weights=weights, k=1)[0]


def pick_amount(platform, saturday_evening=False):
    base = random.choice(PLATFORM_PROFILES[platform]["amounts"])
    amount = base * random.uniform(0.85, 1.15)
    if saturday_evening:
        amount *= random.uniform(1.25, 1.5)  # weekend dinner-rush premium
    return round(amount, 2)


def shift_dt(day, dow):
    """Realistic local working hour, converted to UTC. Saturdays skew evening."""
    if dow == 5 and random.random() < 0.75:  # Saturday evening bias
        hour = random.choice([18, 19, 19, 20, 20, 21])
    else:
        hour = random.choice([8, 9, 11, 12, 13, 13, 14, 17, 18, 19, 20])
    local = datetime(day.year, day.month, day.day, hour, random.randint(1, 59), tzinfo=MYT)
    return local.astimezone(timezone.utc), (dow == 5 and hour >= 18)


def main():
    db = get_db()

    if len(sys.argv) >= 2:
        user_id = sys.argv[1].strip()
    else:
        recent = list(
            db.collection("shifts")
            .order_by("logged_at", direction="DESCENDING")
            .limit(20)
            .stream()
        )
        if not recent:
            sys.exit("No shifts found — log one in the app first, or pass a UID.")
        counts = Counter(d.to_dict()["user_id"] for d in recent)
        user_id = counts.most_common(1)[0][0]

    print(f"Seeding demo data for user: {user_id}")
    random.seed()  # different data each run

    today = datetime.now(MYT).date()
    start = today.replace(month=4, day=1)

    batch = db.batch()
    pending = 0
    n_shifts = 0
    n_expenses = 0

    def add(collection, doc):
        nonlocal batch, pending
        batch.set(db.collection(collection).document(), doc)
        pending += 1
        if pending >= 400:
            batch.commit()
            batch = db.batch()
            pending = 0

    day = start
    while day <= today:
        dow = day.weekday()  # Mon=0 … Sat=5, Sun=6

        # Rest ~2 days/week; Saturdays almost always worked
        p_work = 0.92 if dow == 5 else 0.70
        if random.random() < p_work:
            if dow == 5:
                n = random.choices([2, 3, 4], weights=[0.3, 0.5, 0.2])[0]
            else:
                n = random.choices([1, 2, 3], weights=[0.35, 0.45, 0.20])[0]
            for _ in range(n):
                platform = pick_platform()
                dt, sat_evening = shift_dt(day, dow)
                amount = pick_amount(platform, sat_evening)
                add("shifts", {
                    "user_id": user_id,
                    "platform": platform,
                    "amount": amount,
                    "socso_deducted": round(amount * SOCSO_RATE, 2),
                    "logged_at": dt,
                    "week_label": iso_week_label(dt),
                })
                n_shifts += 1

            # Fuel roughly every other working day
            if random.random() < 0.45:
                dt, _ = shift_dt(day, dow)
                add("expenses", {
                    "user_id": user_id,
                    "category": "fuel",
                    "amount": round(random.uniform(12, 35), 2),
                    "logged_at": dt,
                })
                n_expenses += 1

        # Monthly data plan on the 3rd; occasional maintenance
        if day.day == 3:
            add("expenses", {
                "user_id": user_id,
                "category": "data",
                "amount": round(random.uniform(30, 45), 2),
                "logged_at": datetime(day.year, day.month, day.day, 10, 15, tzinfo=MYT).astimezone(timezone.utc),
            })
            n_expenses += 1
        if random.random() < 0.03:
            add("expenses", {
                "user_id": user_id,
                "category": "maintenance",
                "amount": round(random.uniform(40, 160), 2),
                "logged_at": datetime(day.year, day.month, day.day, 15, 30, tzinfo=MYT).astimezone(timezone.utc),
            })
            n_expenses += 1

        day += timedelta(days=1)

    if pending:
        batch.commit()

    # Ensure user doc exists
    user_ref = db.collection("users").document(user_id)
    if not user_ref.get().exists:
        user_ref.set({
            "platform_default": "grab",
            "created_at": datetime.now(timezone.utc),
            "epf_nudge_sent": False,
        })

    print(f"Done: {n_shifts} shifts + {n_expenses} expenses written, {start:%d %b} – {today:%d %b %Y}.")
    print("Reload the app to see the data.")


if __name__ == "__main__":
    main()
