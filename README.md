# Pelang

**Know your shifts. Know your rights.** A multi-platform income tracker that shows Malaysian gig workers exactly what the Gig Workers Act 2025 means for every shift they work.

## Problem statement

Malaysia's Gig Workers Act 2025 (in force March 2026) made SOCSO contributions mandatory for ~1.2 million gig workers at 1.25% per ride or delivery, and Budget 2026 introduced i-Saraan Plus, a government EPF match worth up to RM600/year that most gig workers have never heard of. No consumer tool exists to help a Grab driver or Foodpanda rider working across multiple platforms understand what these deductions mean per shift, track their cross-platform income, or see what protection they actually have. Pelang fills that gap with the simplest possible interface: log a shift, see your coverage, understand your rights.

## Features

- **One-tap shift logging** — pick a platform, type the amount (Touch 'n Go-style reverse-decimal keypad), done. SOCSO is auto-calculated server-side.
- **Screenshot OCR** — snap your in-app earnings screen; Google Gemini reads the RM total and platform and pre-fills the form.
- **Cross-platform dashboard** — hero earnings figure, weekly/monthly/all-time filters, per-platform breakdown, projections, and expense-adjusted net income.
- **Protection status** — live SOCSO coverage, an i-Saraan Plus EPF nudge, and plain-language rights explainers tied to Act 872.
- **Penyata Pendapatan** — generates a bilingual, print-ready income statement (PDF via the browser) for loan or grant applications.
- **Custom platforms** — add platforms not in the preset list (e.g. Bolt).
- **Bilingual** — full English / Bahasa Melayu toggle.
- **Installable PWA** with offline-tolerant caching.

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
