# Pelang

**Know your shifts. Know your rights.** A multi-platform income tracker that shows Malaysian gig workers exactly what the Gig Workers Act 2025 means for every shift they work.

> Submission for the **Shortcut Asia Internship Challenge 2026** — a self-proposed topic. Approach, technical decisions, architecture, flowcharts, and challenges are documented in [DOCUMENTATION.md](./DOCUMENTATION.md).

## Problem statement

Malaysia's Gig Workers Act 2025 (in force March 2026) made SOCSO contributions mandatory for ~1.2 million gig workers at 1.25% per ride or delivery, and Budget 2026 introduced i-Saraan Plus, a government EPF match worth up to RM600/year that most gig workers have never heard of. No consumer tool exists to help a Grab driver or Foodpanda rider working across multiple platforms understand what these deductions mean per shift, track their cross-platform income, or see what protection they actually have. Pelang fills that gap with the simplest possible interface: log a shift, see your coverage, understand your rights.

## Two core features

The scope was deliberately kept to two well-developed features (depth over breadth):

1. **Shift income logger** — pick a platform and type the amount on a Touch 'n Go-style reverse-decimal keypad; SOCSO (1.25%) is auto-calculated and stored server-side. Feeds a cross-platform dashboard: hero earnings figure, weekly/monthly/all-time filters, per-platform breakdown, projections, and expense-adjusted net income.
2. **Protection status** — live SOCSO coverage for the current week, an i-Saraan Plus EPF nudge, and plain-language rights explainers tied to the Gig Workers Act 2025 (Act 872).

## Everything else it does

Built around the two core features once they were solid — depth first, then breadth:

**Logging & input**
- **Screenshot OCR** — snap your in-app earnings screen; Google Gemini reads the RM total and platform and pre-fills the form (you still confirm before logging).
- **Touch 'n Go-style amount entry** — digits fill from the right of the decimal, so there's no misplaced decimal point.
- **Repeat & quick-amount chips** — one tap to re-log your last shift or a frequent amount.
- **Backdated logging** — log a shift for an earlier date; the server recomputes the SOCSO week.
- **Edit / delete shifts** — with a 5-second undo on delete.
- **CSV statement import** — bulk-import a platform earnings export.
- **Custom platforms** — add operators not in the preset list (e.g. Bolt).

**Dashboard & insights**
- **Filters & period navigation** — this week / month / all-time, with chevrons to page through past periods (honest date-range labels, never a fake "this week").
- **Charts & breakdown** — earnings over time and a per-platform split.
- **Income projection** — month-end estimate, with an optional *zakat pendapatan* (2.5%) toggle.
- **Expense tracking** — fuel / data / maintenance / other, surfaced as expense-adjusted net income.
- **Rule-based insight cards** — weekly-goal pacing, week-over-week change, best platform, strongest day, and an i-Saraan nudge.
- **Weekly goal** and a **weekly digest** summary.

**Records & export**
- **Penyata Pendapatan** — bilingual, print-ready income statement (browser print-to-PDF) for loan, tenancy, or LHDN purposes.
- **Monthly consistency bars** and a **raw CSV export** of all shifts + expenses.

**Protection & rights** (the second tab)
- Live SOCSO coverage status, a **SOCSO contribution ledger**, **i-Saraan Plus EPF** info, **work-accident / PERKESO claim** guidance, plain-language **rights explainers** (Act 872), and direct links to PERKESO / KWSP.

**Experience**
- **Bilingual** English / Bahasa Melayu · **installable PWA** with offline-tolerant caching · **anonymous auth** (no login screen) · optional **evening reminder** notification · subtle **reward animations** · **demo mode** (`?demo`).

## Tech stack

- **Frontend:** React 18 + Vite 6 + Tailwind CSS v4, Recharts, vite-plugin-pwa
- **Backend:** FastAPI (Python 3.12), Pydantic v2
- **Database:** Firebase Firestore (Admin SDK)
- **Auth:** Firebase anonymous auth (no login screen)
- **OCR:** Google Gemini 2.0 Flash (free tier)
- **Deployment:** Vercel (frontend SPA + Python serverless backend)

## Live demo

- **App:** https://pelang-my.vercel.app
- **Demo data:** https://pelang-my.vercel.app/?demo — loads a pre-seeded account (~120 shifts + expenses across Apr–Jun) so the dashboard, insights, and statement generator all have data to show. Without `?demo`, every visitor gets their own private, empty account.

## Run locally

### Prerequisites

- Node.js 18+ and Python 3.12+
- A Firebase project with **Firestore** and **Anonymous Authentication** enabled
- A service account JSON: Firebase Console → Project settings → Service accounts → Generate new private key
- (Optional, for OCR) A Google AI Studio key: https://aistudio.google.com

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                 # set FIREBASE_SERVICE_ACCOUNT path (+ GEMINI_API_KEY)
export FIREBASE_SERVICE_ACCOUNT=./serviceAccount.json
uvicorn main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/ping` → `{"status": "ok"}`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # fill in your Firebase web config + VITE_API_URL
npm run dev
```

Open http://localhost:5173 — you're signed in anonymously and can log a shift immediately.

### Seed demo data (optional)

```bash
cd backend
python seed_demo.py demo-pelang-2026    # writes ~120 shifts + expenses for the ?demo account
```

## Environment variables

See `backend/.env.example` and `frontend/.env.example`. Summary:

| Variable | Where | Purpose |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | backend | Path to service account JSON (local) |
| `FIREBASE_SA_B64` | backend | Base64-encoded service account JSON (serverless/Vercel) |
| `GEMINI_API_KEY` | backend | Google AI Studio key for screenshot OCR (optional) |
| `VITE_API_URL` | frontend | Backend base URL |
| `VITE_FIREBASE_*` | frontend | Firebase web app config |

> **Note:** `VITE_*` values are baked in at build time. When setting them on Vercel, add them via a file or the dashboard — piping a string through PowerShell can prepend a UTF-8 BOM that corrupts the URL.

## Documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md) for approach, technical decisions, architecture, and flowcharts.
