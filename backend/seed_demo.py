"""
Seed realistic-looking demo data for GigShield MY.
Writes directly to Firestore via the Admin SDK so historical dates are correct.

Usage:
    python seed_demo.py <user_id>

To find your user_id:
  1. Open http://localhost:5173
  2. Open DevTools > Network tab
  3. Look at any request to /shifts/<something> — the something IS your UID
     (e.g.  GET /shifts/abc123xyz)
"""
import sys
import random
from datetime import datetime, timedelta, timezone

# Re-use the project's firebase client (same service-account.json)
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from firebase_client import get_db

SOCSO_RATE = 0.0125

PLATFORM_PROFILES = {
    "grab":       {"weight": 40, "amounts": (22, 38, 45, 52, 67, 78, 88, 95)},
    "foodpanda":  {"weight": 20, "amounts": (18, 24, 31, 40, 47, 55)},
    "shopeefood": {"weight": 15, "amounts": (15, 22, 28, 35, 44, 52)},
    "lalamove":   {"weight": 12, "amounts": (55, 72, 88, 105, 120, 145)},
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

def pick_amount(platform):
    amounts = PLATFORM_PROFILES[platform]["amounts"]
    base = random.choice(amounts)
    return round(base * random.uniform(0.85, 1.15), 2)

def make_shifts():
    today = datetime.now(timezone.utc).date()
    weekday = today.weekday()  # 0=Mon, 6=Sun
    shifts = []

    def add_day(d, count_range, skip_prob=0.0):
        if random.random() < skip_prob:
            return
        n = random.randint(*count_range)
        for _ in range(n):
            platform = pick_platform()
            amount = pick_amount(platform)
            # Random hour between 8 am – 10 pm MY time (UTC+8 → UTC 0–14)
            hour = random.randint(0, 14)
            minute = random.randint(0, 59)
            dt = datetime(d.year, d.month, d.day, hour, minute, tzinfo=timezone.utc)
            shifts.append((platform, amount, dt))

    # This week: Mon → today, skip 1-in-5 days
    for days_ago in range(weekday, -1, -1):
        d = today - timedelta(days=days_ago)
        add_day(d, (1, 3), skip_prob=0.2 if days_ago > 0 else 0)

    # Last week: busier
    prev_start = today - timedelta(days=weekday + 7)
    for i in range(7):
        add_day(prev_start + timedelta(days=i), (2, 4), skip_prob=0.15)

    # Two weeks ago: lighter
    two_start = today - timedelta(days=weekday + 14)
    for i in range(7):
        add_day(two_start + timedelta(days=i), (1, 2), skip_prob=0.4)

    # Three weeks ago: a handful
    three_start = today - timedelta(days=weekday + 21)
    for i in [0, 2, 4, 6]:
        add_day(three_start + timedelta(days=i), (1, 2), skip_prob=0.3)

    return shifts

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    user_id = sys.argv[1].strip()
    print(f"Seeding demo data for user: {user_id}")

    db = get_db()
    random.seed(42)
    shifts = make_shifts()
    print(f"Writing {len(shifts)} shifts directly to Firestore...")

    ok = 0
    for platform, amount, dt in shifts:
        socso = round(amount * SOCSO_RATE, 2)
        doc = {
            "user_id": user_id,
            "platform": platform,
            "amount": amount,
            "socso_deducted": socso,
            "logged_at": dt,
            "week_label": iso_week_label(dt),
        }
        try:
            db.collection("shifts").add(doc)
            print(f"  ✓ {platform:12s}  RM{amount:6.2f}  {dt.strftime('%Y-%m-%d %H:%M UTC')}")
            ok += 1
        except Exception as e:
            print(f"  ✗ {platform} RM{amount} — {e}")

    # Ensure user doc exists
    user_ref = db.collection("users").document(user_id)
    if not user_ref.get().exists:
        user_ref.set({
            "platform_default": "grab",
            "created_at": datetime.now(timezone.utc),
            "epf_nudge_sent": False,
        })

    print(f"\nDone: {ok}/{len(shifts)} shifts written.")
    print("Reload the app at http://localhost:5173 to see the data.")

if __name__ == "__main__":
    main()
