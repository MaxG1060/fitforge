# FitForge

A personal fitness companion — AI-generated weekly training plans, Sunday meal prep, and Strava activity sync.

## Stack
- **Next.js** — frontend + backend in one
- **Supabase** — database + auth
- **Tailwind CSS** — styling
- **Claude API** — AI training + meal plans
- **Strava API** — activity sync

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your API keys
2. Install dependencies: `npm install`
3. Run locally: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure
```
src/
  app/         # Pages and API routes (Next.js App Router)
  components/  # Reusable UI pieces
  lib/         # Helpers: Supabase client, Strava, Claude
```

## Roadmap
See [FUTURE.md](./FUTURE.md) for the backlog.
