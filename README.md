# Ripple

Communication lifecycle management platform. Monorepo with contract-first architecture — frontend (Lovable) and backend (Cursor) communicate only through shared TypeScript contracts.

## Architecture

```
/shared     ← Contracts (source of truth for both sides)
/backend    ← Express API stub + legacy Next.js app
/frontend   ← Lovable-generated Vite + React app
```

### Contracts (`/shared`)

All API types live in `/shared/src/`:

| File | What it defines |
|------|----------------|
| `events.schema.ts` | `Event`, `EventCategory`, `EventStatus`, `EventFilterCondition` |
| `journey.schema.ts` | `Journey`, `JourneyStep` (discriminated union: event/delay/communication), `StepInput` |
| `api.contract.ts` | Request/response shapes for all 6 endpoints, `PaginationParams`, `PaginatedResponse<T>` |
| `errors.ts` | `ApiError` with typed `ErrorCode`, `ApiResponse<T>` wrapper |
| `index.ts` | Barrel re-export |

### API Stub Server

Lightweight Express server that implements the contracts with in-memory storage. No database required.

**Start it:**

```bash
npm run dev:backend     # from repo root — runs on http://localhost:3000
```

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/journeys` | List journeys (paginated, filterable) |
| `GET` | `/api/journeys/:id` | Get journey with steps |
| `POST` | `/api/journeys` | Create journey |
| `PUT` | `/api/journeys/:id` | Full update (replace steps) |
| `DELETE` | `/api/journeys/:id` | Delete journey |
| `GET` | `/api/events` | List event definitions (paginated) |
| `GET` | `/api/health` | Health check |

**Frontend integration:**

```typescript
// In Lovable, set the base URL:
const API_BASE = "http://localhost:3000";

// Import types from the contract — never define your own:
import type { Journey, ListJourneysResponse, ApiError } from "@ripple/shared";

const res = await fetch(`${API_BASE}/api/journeys`);
const body: ListJourneysResponse = await res.json();
// body.data is JourneySummary[], body.pagination has page/total info

// Errors are always ApiError:
if (!res.ok) {
  const err: ApiError = await res.json();
  console.error(err.code, err.message); // e.g. "NOT_FOUND", "Journey not found"
}
```

CORS is enabled for `http://localhost:5173` (Lovable dev server).

---

## Legacy Full-Stack App (Next.js)

The original full-featured Next.js app is still available under `/backend`:

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** + **Tailwind CSS**
- **PostgreSQL** + **Prisma** ORM
- **Zod** for validation

## Quick Start (Legacy)

### 1. Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **npm** (comes with Node.js)
- **PostgreSQL** — via Docker, Neon.tech, or local install (see step 2)

### 2. Clone & install

```bash
cd PMInternalTool
npm install
```

### 3. Database (choose one)

**Option A: Docker** (recommended if you have Docker)

```bash
docker compose up -d
```

Then copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` and set:

```
DATABASE_URL="postgresql://pmuser:pmpass@localhost:5432/pm_internal_tool"
```

**Option B: Neon.tech** (free cloud DB, no install)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project and copy the connection string
3. Create `.env` from the example and paste:

```bash
cp .env.example .env
```

```
DATABASE_URL="postgresql://your_user:your_pass@your_host/neondb?sslmode=require"
```

**Option C: Local PostgreSQL**

Create a database and update `.env`:

```
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/pm_internal_tool"
```

### 4. Create tables & seed data

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 5. Run the app

```bash
npm run dev
```

Open **http://localhost:3005** in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3005 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run open` | Open the app in browser |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:seed` | Seed database with defaults |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run test` | Run tests |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── domain/[id]/        # Domain-specific pages
│   │   ├── dashboard/      # Domain overview & progress
│   │   ├── data-layer/     # Event definition (unified input)
│   │   ├── mapping/        # Journey mapping
│   │   ├── communications/ # Communication planning
│   │   ├── channels/       # Channels & Rules (policy reference)
│   │   └── archive/        # Export & snapshots
│   ├── api/                # API routes
│   │   ├── ai/             # AI generation endpoints
│   │   ├── domains/        # Domain CRUD + events + flows
│   │   └── ...
│   └── select-domain/      # Domain picker
├── components/             # React components
│   ├── data-layer-guide.tsx    # Educational guide (from Event Guide doc)
│   ├── data-layer-input.tsx    # Unified event input (screens + questions + comms)
│   ├── journey-builder.tsx     # Journey step builder
│   ├── journey-example.tsx     # Example card order journey
│   ├── policy-reference.tsx    # Channels & Rules reference
│   ├── sidebar-nav.tsx         # Navigation sidebar
│   └── ...
├── lib/
│   ├── ai/                 # AI provider (mock for now)
│   ├── services/           # Business logic
│   ├── validations/        # Zod schemas
│   ├── policy-data.ts      # Structured policy data (chatbot-ready)
│   └── prisma.ts           # Prisma client
prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Seed data
```

## Features

### Process (linear workflow)
1. **Data Layer** — Define Figma screens, business questions, and communication intent. Generate behavioral + application events automatically.
2. **Mapping** — Map events to journey steps. Visual timeline with actions, triggers, and communication points.
3. **Communications** — Plan and manage communications tied to journey steps.

### Reference
- **Channels & Rules** — Complete communication policy reference from the Policy Book. Searchable, filterable. All data structured for future AI chatbot integration.
- **Archive** — Export snapshots (planned).

## Key Documents (source material)

- **Communication Event Guide (March 2026)** — defines behavioral vs application events, what PMs provide, and the Aurora event framework
- **Communication Policy Book** — defines all communication channels, their rules, audience, CTA requirements, timing, and design guidelines

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (required) |

## Troubleshooting

- **Port conflict**: The app runs on port 3005. If it's taken, edit the port in `package.json` under the `dev` script.
- **Prisma errors**: Run `npx prisma generate` after any schema changes.
- **Empty DB**: Run `npm run db:seed` to populate taxonomy types, templates, and question bank.
