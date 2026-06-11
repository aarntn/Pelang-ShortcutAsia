# GigShield MY 🛡️

**Know your shifts. Know your rights.** A multi-platform income tracker that shows Malaysian gig workers exactly what the Gig Workers Act 2025 means for every shift they work.

## Problem statement

Malaysia's Gig Workers Act 2025 (in force March 2026) made SOCSO contributions mandatory for ~1.2 million gig workers at 1.25% per ride or delivery, and Budget 2026 introduced i-Saraan Plus, a government EPF match worth up to RM600/year that most gig workers have never heard of. No consumer tool exists to help a Grab driver or Foodpanda rider working across multiple platforms understand what these deductions mean per shift, track their cross-platform income, or see what protection they actually have. GigShield MY fills that gap with the simplest possible interface: log a shift, see your coverage, understand your rights.

## Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS v4, Recharts
- **Backend:** FastAPI (Python 3.11+)
- **Database:** Firebase Firestore
- **Auth:** Firebase anonymous auth (no login screen)
- **Deployment:** Vercel (frontend) + Railway (backend)

## Run locally

### Prerequisites

- Node.js 18+ and Python 3.11+
- A Firebase project with **Firestore** and **Anonymous Authentication** enabled
- A service account JSON: Firebase Console → Project settings → Service accounts → Generate new private key

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                 # set FIREBASE_SERVICE_ACCOUNT path
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

## Environment variables

See `backend/.env.example` and `frontend/.env.example`. Summary:

| Variable | Where | Purpose |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | backend | Path to service account JSON |
| `FRONTEND_URL` | backend | Deployed frontend origin for CORS |
| `VITE_API_URL` | frontend | Backend base URL |
| `VITE_FIREBASE_*` | frontend | Firebase web app config |

## Live demo

[to be filled]

## Documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md) for approach, technical decisions, architecture, and flowcharts.
