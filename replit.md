# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (Tailwind CSS, Framer Motion, React Hook Form)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── watch-earn/         # Watch Video & Earn React frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Render.com Deployment

A `render.yaml` file at the project root configures deployment to [Render.com](https://render.com):

- **Single web service** (`watch-earn-api`): builds the React frontend + Express API, serves both from one Node.js process
- **PostgreSQL database** (`watch-earn-db`): free-tier Render Postgres, `DATABASE_URL` auto-injected
- **Build command**: installs pnpm → runs OpenAPI codegen → builds frontend → bundles API
- **Start command**: `node artifacts/api-server/dist/index.cjs`

**To deploy:**
1. Push this repo to GitHub/GitLab
2. Go to Render dashboard → New → Blueprint → connect the repo
3. Render reads `render.yaml` and creates everything automatically

---

## Watch Video & Earn App

A reward platform where users sign up, watch sponsored videos, and earn points to cash out.

### Features
- **Auth**: Email + password signup/login, session stored in `localStorage` as `wve_session`
- **Points**: Earn 10 points per completed video, 5 daily bonus points
- **Monetag**: Rewarded video integration via `window.Monetag.showRewardedVideo()` (dev fallback mock)
- **Cash Out**: Request cashout with minimum 100 points

### Monetag Setup
To activate real ads, edit `artifacts/watch-earn/index.html`:
1. Replace `YOUR_MONETAG_TAG_ID` with your actual Monetag publisher tag ID
2. Uncomment the `<script>` tag in the `<head>`
3. Whitelist your domain in Monetag dashboard > Sites > Add Site

### API Endpoints
- `POST /api/auth/signup` — Create account
- `POST /api/auth/login` — Login
- `GET /api/user/me` — Get profile + points (header: `x-user-id`)
- `POST /api/user/earn` — Award 10 points (header: `x-user-id`)
- `POST /api/user/daily-bonus` — Claim 5 daily points (header: `x-user-id`)
- `POST /api/user/cashout` — Cash out points (header: `x-user-id`, min 100 pts)

### Database Schema
- `users` table: `id`, `email`, `password_hash`, `points`, `last_daily_bonus`, `created_at`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
