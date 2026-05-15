# FusionHub Marketplace

A full-stack B2B marketplace for CMPE 272 that unifies four member company storefronts—Nexus Academy, Travel Agency, Bean & Brew, and Krativerse—into one discovery hub. Users can browse listings, track visits, leave reviews, compete on leaderboards, and manage favorites from a personal dashboard. Admins get analytics, moderation, and catalog tools.

## Features

- **Public marketplace** — Explore companies and products, search, view listing details, and open partner storefronts.
- **Live activity** — Real-time-style activity feed and visit stats.
- **Reviews & rankings** — Product reviews, company leaderboards, and popularity scoring.
- **User accounts** — Email/password signup and login; optional Facebook OAuth.
- **User dashboard** — Favorites, visit history, analytics, top products, and profile settings.
- **Admin console** — Users, visits, activity, reviews moderation, listings, rankings, and partners at `/admin`.
- **ShopVerse AI** — In-app chat assistant (Groq) to help users navigate the marketplace.

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 18, Vite, React Router, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express, JWT auth (httpOnly cookies) |
| Database | PostgreSQL (Supabase-compatible) |

## Project structure

```
├── client/          # Vite + React SPA (port 5173)
├── server/          # Express API (port 5001)
├── marketplace-backend/   # Legacy PHP helpers (optional; not required for the Node app)
└── package.json     # Root scripts to run API + client together
```

## Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database (recommended: [Supabase](https://supabase.com) free tier)

## Quick start

### 1. Install dependencies

From the repository root:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Configure the API

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set at minimum:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase **Transaction pooler** URI (port `6543`) or any Postgres connection string |
| `JWT_SECRET` | Long random string for signing session tokens |

Optional: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, and `FACEBOOK_REDIRECT_URI` for Facebook Login.

### 3. Seed the database

**Warning:** `npm run seed` drops and recreates marketplace tables, then loads demo companies, products, and an admin user.

```bash
npm run seed
```

Default admin (also used for `/admin/login`):

- **Email:** `admin@fusionhub.demo`
- **Password:** `fusionhub123`

Override via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env` before seeding if you prefer different credentials.

### 4. Configure the client (optional)

For the ShopVerse AI chatbot:

```bash
cp client/.env.example client/.env
```

Add a [Groq](https://console.groq.com/) API key as `VITE_GROQ_API_KEY`. Restart the Vite dev server after changing env vars.

### 5. Run locally

From the project root (starts API on `:5001` and client on `:5173` with `/api` proxied to the server):

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Run services separately if needed:

```bash
npm run dev --prefix server
npm run dev --prefix client
```

## Health checks

- API: `GET http://localhost:5001/health`
- Database: `GET http://localhost:5001/health/db`

From `server/`:

```bash
node scripts/check-db.js
```

## Production build

```bash
npm run build --prefix client
npm run start --prefix server
```

Set `NODE_ENV=production`, a strong `JWT_SECRET`, and `CLIENT_ORIGIN` to your deployed frontend URL. Serve the built client (`client/dist`) from your host or CDN and point it at the API.

## Environment reference

### Server (`server/.env`)

See `server/.env.example` for the full list. Key entries:

- `PORT` — API port (default `5001`)
- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` / `JWT_EXPIRES` — Auth tokens
- `CLIENT_ORIGIN` — Allowed frontend origin in production
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Used by seed and admin login

### Client (`client/.env`)

- `VITE_GROQ_API_KEY` — Groq API key for ShopVerse AI (browser-side)

## API overview

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Register, login, Facebook OAuth, session (`/me`) |
| `/api/marketplace` | Catalog, companies, products, visits, favorites, leaderboards, activity |
| `/api/reviews` | Product reviews (public + authenticated) |
| `/api/user` | Authenticated dashboard summary |
| `/api/admin` | Admin login, overview, review moderation, product management |

The Vite dev server proxies `/api` to `http://127.0.0.1:5001`.

## Migrations

If you are upgrading an existing database instead of re-seeding:

```bash
npm run migrate:users --prefix server
npm run migrate:facebook --prefix server
```

SQL files live under `server/scripts/`.

## Member companies

| Storefront | Team member |
|------------|-------------|
| Nexus Academy | Geeshitha |
| Travel Agency | Surbhi |
| Bean & Brew (Srikavya Enterprise) | Kavya |
| Krativerse | Krati |

## License

Academic / course project — see your course and team agreements for distribution and deployment terms.
