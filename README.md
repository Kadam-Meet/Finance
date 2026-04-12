# Pocket Pal Finance - Frontend

Frontend application for Pocket Pal Finance built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

## Prerequisites

- Node.js 18+
- npm 9+
- Backend server running locally

## Setup

```bash
cd FE/FFE
npm install
```

## Run (Development)

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

## Key Routes

- `/investments/stocks-crypto` - Stocks & Crypto Analyzer (add/update/delete + profit/tax insights)
- `/investments/all` - All Investments (all asset types with portfolio analytics)
- `/investments` - redirects to `/investments/stocks-crypto`

## Investment Types

The app now stores an explicit `investment_type` and uses type-aware fields in the All Investments page.

Supported types:

- stocks
- crypto
- mutual_funds
- fd
- rd
- sip
- gold

Form behavior on the All Investments page:

- Stocks/Crypto/Mutual Funds/SIP use unit-based quantity inputs.
- FD/RD use principal + optional maturity amount instead of a required current value.
- Gold uses amount-based inputs without forcing a unit price.

## Build (Production)

```bash
npm run build
npm run preview
```

## Lint

```bash
npm run lint
```

## Notes

- Ensure backend API is running before using authenticated and data-driven pages.
- API requests are handled through `src/services/api.ts`.
- If needed, set `VITE_API_URL` in a `.env` file (default fallback is `http://localhost:8000`).
