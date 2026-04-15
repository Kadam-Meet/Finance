# Pocket Pal Finance - Frontend

Frontend application for Pocket Pal Finance, built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.
It provides dashboards and workflows for expenses, budgets, investments, groups, reminders, and other finance features powered by the backend API.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

## Project Context

This frontend is part of a full-stack project:

- Frontend folder: `FE/FFE`
- Backend folder: `be/FBE`
- Default local flow:
	- Frontend on `http://localhost:5173`
	- Backend on `http://127.0.0.1:8000`

Start backend first, then run this frontend.

## Prerequisites

- Node.js 18+
- npm 9+
- Backend server running locally

## Installation

```bash
cd FE/FFE
npm install
```

## Environment Configuration

Optional `.env` in `FE/FFE`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

If `VITE_API_URL` is not set, app uses fallback API URL `http://localhost:8000`.

## Run (Development)

```bash
cd FE/FFE
npm run dev
```

App URL: `http://localhost:5173`

## Key Routes

- `/dashboard` - Overview and summary cards
- `/expenses` - Expense tracking and history
- `/budget` - Budget planning and utilization
- `/income` - Income tracking
- `/groups` - Shared/group expense workflows
- `/forecast` - Forecast and analytics
- `/investments/stocks-crypto` - Stocks and Crypto Analyzer
- `/investments/all` - All Investments view with analytics
- `/investments` - Redirects to `/investments/stocks-crypto`

## Investments Behavior

Supported `investment_type` values:

- `stocks`
- `crypto`
- `mutual_funds`
- `fd`
- `rd`
- `sip`
- `gold`

All Investments form behavior:

- Stocks, Crypto, Mutual Funds, and SIP use quantity-based inputs.
- FD and RD use principal with optional maturity amount.
- Gold uses amount-based inputs and does not force unit price.

## Build and Preview (Production)

```bash
npm run build
npm run preview
```

## Lint

```bash
npm run lint
```

## Full-Stack Quick Start

1. Start backend in one terminal:

```bash
cd be/FBE
.\env\Scripts\Activate.ps1
uvicorn main:app --reload
```

2. Start frontend in another terminal:

```bash
cd FE/FFE
npm install
npm run dev
```

3. Open app:

- `http://localhost:5173`

Keep backend running for login and all data-driven pages.

## Notes

- API requests are managed in `src/services/api.ts`.
- Ensure backend API CORS and environment configuration match your frontend origin.
