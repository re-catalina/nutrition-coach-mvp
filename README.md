# Nutrition Coaching MVP

Web-first MVP for personalized calorie targets, natural-language food logging, and going-out menu guidance.

## Features implemented

- Profile intake with BMR/TDEE-based calorie target calculation.
- Natural-language food logging with confidence scoring and structured nutrition diary items.
- Event planner with text and optional menu photo URL input, calorie impact analysis, and recommendation category.
- On-demand coaching endpoint for budget-aware nutrition guidance.
- Basic observability:
  - structured metric-event logging
  - persisted metric events
  - `/api/metrics` summary endpoint for parsing quality and usage counts

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma + Postgres
- Zod validation

## Setup

1. Install dependencies:
   - `npm install`
2. Create env file:
   - `cp .env.example .env`
3. Generate Prisma client and run migrations:
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
4. Start app:
   - `npm run dev`

## API Endpoints

- `POST /api/profile`
- `GET /api/targets/today?userId=...`
- `POST /api/food/log`
- `GET /api/food/log?userId=...&date=YYYY-MM-DD`
- `POST /api/event/plan`
- `POST /api/coach/query`
- `GET /api/metrics?days=7`

## Notes

- Nutrition matching currently uses a mocked local dataset (`src/lib/food-db.ts`) and is structured to be replaced with USDA FoodData Central integration.
- Menu photo support in MVP accepts an image URL placeholder and route-ready schema; vision OCR/model integration can plug into `src/lib/event-planner.ts`.
- Coaching responses are deterministic placeholders ready for replacement with an LLM provider.
