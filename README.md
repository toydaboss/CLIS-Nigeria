# CLIS Nigeria

## Cloud-Based Centralized Land Information System

A full-stack web application for Nigerian land title registration, public verification, and dispute management. Built with React, Express, TypeScript, and MongoDB.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started (Local)](#getting-started-local)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Running the Application](#running-the-application)
- [Demo Credentials](#demo-credentials)
- [Setting Up MFA](#setting-up-the-authenticator-app-mfa)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Docker Reference](#docker-reference)

---

## Overview

CLIS Nigeria provides two main surfaces:

**Public portal** — Any citizen can verify a land title by reference number (e.g. `LAGOS-2024-00142`) without an account. Results show registration status, jurisdiction, and any active dispute.

**Admin portal** — Government registrars and administrators log in with email/password + TOTP two-factor authentication to register new titles, look up full title records, flag disputes, manage users, view jurisdiction statistics, and review the immutable audit log.

The interface is fully responsive — it works on desktop, tablet, and mobile, with a collapsible sidebar drawer on small screens.

### Target Users

| User           | Role                                                           |
| -------------- | -------------------------------------------------------------- |
| General public | Read-only title verification                                   |
| Land registrar | Register titles, look up records, flag disputes                |
| Administrator  | Full access: titles, disputes, users, jurisdictions, audit log |

---

## Tech Stack

| Layer        | Technology                                                    |
| ------------ | ------------------------------------------------------------- |
| Frontend     | React 18, TypeScript, Vite 5                                  |
| Routing      | TanStack Router v1                                            |
| Server state | TanStack Query v5                                             |
| Styling      | Custom CSS (design tokens, responsive utility classes)        |
| Backend      | Express 4, TypeScript                                         |
| Database     | MongoDB 8 (Docker locally, MongoDB Atlas in production)       |
| ODM          | Mongoose 8                                                    |
| Auth         | JWT (jsonwebtoken) + TOTP (otplib) + bcryptjs                 |
| Testing      | Vitest, Supertest, Testing Library                            |
| Hosting      | Render (backend), Vercel (frontend), MongoDB Atlas (database) |

---

## Project Structure

```
repo/
├── docker-compose.yml          # Local MongoDB container
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── db/
│       │   ├── index.ts        # Mongoose connection (with masked URI logging)
│       │   ├── seed.ts         # Demo data seeder
│       │   └── models/
│       │       ├── User.ts
│       │       ├── Title.ts
│       │       └── AuditLog.ts
│       ├── middleware/
│       │   └── auth.ts         # JWT verification + role guards (auth, adminOnly)
│       ├── routes/
│       │   ├── public.ts       # GET /api/titles/:ref, GET /api/health
│       │   └── admin/
│       │       ├── auth.ts     # POST /api/auth/login, /mfa, /logout
│       │       ├── titles.ts   # Title CRUD + dispute flag
│       │       ├── dashboard.ts # Stats, recent activity, chart data
│       │       ├── audit.ts    # Paginated audit log (admin only)
│       │       ├── users.ts    # User management CRUD (admin only)
│       │       └── jurisdictions.ts # Per-state title + registrar stats (admin only)
│       ├── __tests__/          # Vitest + Supertest suites (73 tests)
│       └── index.ts            # Express app entry point
└── frontend/
    ├── src/
    │   ├── lib/
    │   │   ├── api.ts          # Axios instance; reads VITE_API_URL in production
    │   │   ├── auth.ts         # localStorage token helpers, CurrentUser type
    │   │   ├── queryClient.ts  # TanStack Query configuration
    │   │   └── theme.ts        # Dark/light mode helpers
    │   ├── components/
    │   │   ├── AdminLayout.tsx # Sidebar + topbar shell (responsive, mobile drawer)
    │   │   ├── Logo.tsx
    │   │   ├── RefChip.tsx
    │   │   ├── StatusBadge.tsx
    │   │   └── Stepper.tsx
    │   ├── pages/
    │   │   ├── VerifyPage.tsx          # Public title lookup
    │   │   └── admin/
    │   │       ├── LoginPage.tsx
    │   │       ├── DashboardPage.tsx
    │   │       ├── RegisterTitlePage.tsx
    │   │       ├── LookupPage.tsx
    │   │       ├── DisputesPage.tsx
    │   │       ├── AuditLogPage.tsx
    │   │       ├── UsersPage.tsx       # User management (admin only)
    │   │       └── JurisdictionsPage.tsx # State-level stats (admin only)
    │   ├── styles/
    │   │   └── globals.css     # Design tokens + responsive utility classes
    │   └── router.tsx          # Route definitions + auth guards
    └── __tests__/              # Vitest + Testing Library suites (60 tests)
```

---

## Prerequisites

- **Node.js** 20 or later
- **npm** 9 or later
- **Docker** with Docker Compose — [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
- A **TOTP authenticator app** (Google Authenticator, Authy, or similar) for admin login

---

## Getting Started (Local)

### 1. Clone and enter the repo

```bash
git clone <repo-url>
cd repo
```

### 2. Start MongoDB

```bash
docker compose up -d
```

This pulls `mongo:8`, creates the `clis_nigeria` database, and exposes it on `127.0.0.1:27017`. Data persists in a Docker volume between restarts.

Verify it is ready:

```bash
docker exec clis_mongo mongosh -u mongo -p mongo --eval "db.adminCommand({ ping: 1 })"
# Expected: { ok: 1 }
```

### 3. Configure the backend environment

```bash
cp backend/.env.example backend/.env
```

The defaults in `.env.example` work out of the box with the Docker container. Change `JWT_SECRET` and `JWT_TEMP_SECRET` before deploying to a public server.

### 4. Install backend dependencies and seed the database

```bash
cd backend
npm install
npm run db:seed
```

The seed script prints TOTP secrets and OTP URIs — **save these**. You need them to log in to the admin portal.

### 5. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Environment Variables

### `backend/.env`

| Variable          | Description                                 | Default                                                               |
| ----------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| `MONGODB_URI`     | MongoDB connection string                   | `mongodb://mongo:mongo@127.0.0.1:27017/clis_nigeria?authSource=admin` |
| `JWT_SECRET`      | Secret for signing access tokens (8h TTL)   | _(change this)_                                                       |
| `JWT_TEMP_SECRET` | Secret for signing MFA temp tokens (5m TTL) | _(change this)_                                                       |
| `PORT`            | Backend server port                         | `3001`                                                                |
| `FRONTEND_URL`    | Allowed CORS origin                         | `http://localhost:5173`                                               |

> **Note:** Use `127.0.0.1` not `localhost` in the MongoDB URI. On Linux, `localhost` resolves to a Unix socket; `127.0.0.1` forces TCP which the Docker container requires.

### `frontend/.env` (optional — local dev only)

In development the Vite proxy forwards `/api/*` to `localhost:3001`, so no frontend env file is needed locally. In production, set:

| Variable       | Description                          | Example                                 |
| -------------- | ------------------------------------ | --------------------------------------- |
| `VITE_API_URL` | Full backend URL (no trailing slash) | `https://clis-nigeria-api.onrender.com` |

---

## Database

### MongoDB collections

| Collection  | Model      | Description                                                         |
| ----------- | ---------- | ------------------------------------------------------------------- |
| `users`     | `User`     | Admin and registrar accounts with hashed passwords and TOTP secrets |
| `titles`    | `Title`    | Land title records with coordinates, status, and ownership data     |
| `auditlogs` | `AuditLog` | Append-only record of every INSERT, UPDATE, and FLAG_DISPUTE action |

### Key schema fields

**User**

```
email              String   unique, lowercased
name               String
role               String   "admin" | "registrar"
jurisdictionState  String   required for registrar, null for admin
userCode           String   auto-generated, e.g. "USR-LAG-4821"
passwordHash       String   bcrypt (12 rounds)
mfaSecret          String   base32 TOTP secret
```

**Title**

```
titleRef           String   unique, e.g. "LAGOS-2024-00142"
status             String   "registered" | "disputed" | "pending"
jurisdictionState  String   Nigerian state name
latitude/longitude Number   used for proximity conflict detection (~20m radius)
registeredBy       String   userCode of the registrar who created it
disputeCase        String   set when status is "disputed"
```

**AuditLog** — append-only, no updates or deletes

```
userCode     String   who performed the action
operation    String   INSERT | UPDATE | FLAG_DISPUTE
recordRef    String   titleRef the action affected
beforeState  Mixed    snapshot before the change (null for inserts)
afterState   Mixed    snapshot after the change
```

### Re-seeding (wipes and re-inserts all demo data)

```bash
cd backend
npm run db:seed
```

### Connecting with MongoDB Compass

```
mongodb://mongo:mongo@127.0.0.1:27017/clis_nigeria?authSource=admin
```

| Field         | Value          |
| ------------- | -------------- |
| Host          | `127.0.0.1`    |
| Port          | `27017`        |
| Username      | `mongo`        |
| Password      | `mongo`        |
| Auth Database | `admin`        |
| Database      | `clis_nigeria` |

---

## Running the Application

Open two terminals.

**Terminal 1 — Backend**

```bash
cd backend
npm run dev
# API running at http://localhost:3001
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
# App running at http://localhost:5173
```

Verify the backend health check:

```bash
curl http://localhost:3001/api/health
# {"ok":true,"ts":"..."}
```

---

## Demo Credentials

These are inserted by `npm run db:seed`. The TOTP secrets are printed fresh each time you seed.

| Role          | Email                       | Password       |
| ------------- | --------------------------- | -------------- |
| Registrar     | `a.bello@lagosstate.gov.ng` | `Password123!` |
| Administrator | `o.adeyemi@clis.gov.ng`     | `Password123!` |

### Public title references for testing

| Reference           | Status     |
| ------------------- | ---------- |
| `LAGOS-2024-00142`  | Registered |
| `ABUJA-2022-08891`  | Disputed   |
| `LAGOS-2026-04193`  | Registered |
| `KANO-2025-02211`   | Registered |
| `RIVERS-2026-00871` | Registered |

---

## Setting Up the Authenticator App (MFA)

Admin login requires a 6-digit TOTP code after entering your password.

### Step 1 — Install an authenticator app

| App                     | Android     | iOS       |
| ----------------------- | ----------- | --------- |
| Google Authenticator    | Google Play | App Store |
| Microsoft Authenticator | Google Play | App Store |
| Authy                   | Google Play | App Store |

### Step 2 — Run the seed

```bash
cd backend
npm run db:seed
```

Output includes base32 secrets and `otpauth://` URIs for each demo user.

> **Important:** Secrets change every time you re-seed. Update your authenticator app after re-seeding.

### Step 3 — Add accounts to your authenticator app

#### Option A — QR code (recommended)

1. Copy the `otpauth://` URI from the seed output
2. Visit [https://stefansundin.github.io/2fa-qr](https://stefansundin.github.io/2fa-qr) and paste the URI to generate a QR code
3. Scan the QR code with your authenticator app

#### Option B — Manual entry

1. Copy the base32 secret (e.g. `OA6U42RQHMSBKOY4`)
2. In your authenticator app, add a new account manually
3. Enter the secret and select **Time-based (TOTP)**

### Step 4 — Log in

1. Go to `/admin/login`
2. Enter email and password → click **Sign In**
3. Enter the current 6-digit TOTP code → click **Verify**

### Troubleshooting

| Problem                                   | Fix                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| "Invalid TOTP code" with the correct code | Phone clock may be out of sync — enable **Set time automatically** in your phone's date/time settings |
| Forgot which secret belongs to which user | Run `npm run db:seed` again and re-add to authenticator                                               |
| Code rejected immediately after scanning  | Ensure you chose **Time-based (TOTP)**, not counter-based (HOTP)                                      |

---

## API Reference

### Public

| Method | Endpoint           | Description                        |
| ------ | ------------------ | ---------------------------------- |
| `GET`  | `/api/titles/:ref` | Verify a title by reference number |
| `GET`  | `/api/health`      | Health check                       |

### Auth

| Method | Endpoint           | Description                                        |
| ------ | ------------------ | -------------------------------------------------- |
| `POST` | `/api/auth/login`  | Step 1 — validate credentials, returns `tempToken` |
| `POST` | `/api/auth/mfa`    | Step 2 — validate TOTP, returns `accessToken`      |
| `POST` | `/api/auth/logout` | Signal logout (client discards token)              |

### Admin — Titles (Registrar+)

| Method  | Endpoint                         | Description               |
| ------- | -------------------------------- | ------------------------- |
| `GET`   | `/api/admin/titles`              | Paginated title list      |
| `GET`   | `/api/admin/titles/:ref`         | Full title record         |
| `POST`  | `/api/admin/titles`              | Register a new title      |
| `PATCH` | `/api/admin/titles/:ref/dispute` | Flag a dispute on a title |

### Admin — Dashboard (Registrar+)

| Method | Endpoint                      | Description                         |
| ------ | ----------------------------- | ----------------------------------- |
| `GET`  | `/api/admin/dashboard/stats`  | Aggregate title counts              |
| `GET`  | `/api/admin/dashboard/recent` | Last 10 audit entries               |
| `GET`  | `/api/admin/dashboard/chart`  | Registrations over the last 14 days |

### Admin — Users (Admin only)

| Method   | Endpoint                    | Description                                   |
| -------- | --------------------------- | --------------------------------------------- |
| `GET`    | `/api/admin/users`          | List all users                                |
| `POST`   | `/api/admin/users`          | Create a new user (returns TOTP secret + URI) |
| `PATCH`  | `/api/admin/users/:id/role` | Change a user's role or jurisdiction          |
| `DELETE` | `/api/admin/users/:id`      | Remove a user                                 |

### Admin — Jurisdictions (Admin only)

| Method | Endpoint                   | Description                                 |
| ------ | -------------------------- | ------------------------------------------- |
| `GET`  | `/api/admin/jurisdictions` | Per-state title counts and registrar counts |

### Admin — Audit Log (Admin only)

| Method | Endpoint           | Description         |
| ------ | ------------------ | ------------------- |
| `GET`  | `/api/admin/audit` | Paginated audit log |

### Title reference format

References must match `STATE-YEAR-NNNNN`:

- `LAGOS-2024-00142` ✓
- `FCT-2022-08891` ✓
- `lagos-2024-00142` ✗ (auto-uppercased internally)
- `LAGOS-2024-1234` ✗ (sequence must be 5 digits)

---

## Testing

### Backend (73 tests)

```bash
cd backend
npm test
```

Tests use Vitest + Supertest. Mongoose models are mocked — no live database connection required.

```typescript
vi.mock('../../../db/models/Title', () => ({
  Title: { findOne: vi.fn(), find: vi.fn(), create: vi.fn(), ... }
}));
```

### Frontend (60 tests)

```bash
cd frontend
npm test
```

Tests use Vitest + Testing Library in a jsdom environment.

### Run all 133 tests

```bash
cd backend && npm test && cd ../frontend && npm test
```

---

## Deployment

The application is deployed as three separate services:

| Service     | Provider                                   | Purpose                  |
| ----------- | ------------------------------------------ | ------------------------ |
| Database    | [MongoDB Atlas](https://cloud.mongodb.com) | Managed MongoDB cluster  |
| Backend API | [Render](https://render.com)               | Node.js / Express server |
| Frontend    | [Vercel](https://vercel.com)               | Static React/Vite build  |

### 1. MongoDB Atlas

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Under **Database Access**, create a user with **Read and write** permissions
   - Use an alphanumeric-only password to avoid URL-encoding issues
3. Under **Network Access**, add `0.0.0.0/0` to allow Render's dynamic IPs
4. Get your connection string from **Connect → Drivers** — it looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/clis_nigeria?retryWrites=true&w=majority
   ```
5. Run the seed against Atlas to create demo data:
   ```bash
   MONGODB_URI="<atlas-connection-string>" cd backend && npm run db:seed
   ```

### 2. Render (Backend)

1. Create a new **Web Service** and connect your GitHub repo
2. Set the **Root Directory** to `backend`
3. Set the **Build Command** to `npm run build`
   - The build script runs `npm install --include=dev && tsc` to ensure TypeScript type packages are available during compilation
4. Set the **Start Command** to `npm start`
5. Add the following **Environment Variables** in the Render dashboard:

| Key               | Value                                                             |
| ----------------- | ----------------------------------------------------------------- |
| `MONGODB_URI`     | Your Atlas connection string                                      |
| `JWT_SECRET`      | A long random string                                              |
| `JWT_TEMP_SECRET` | A different long random string                                    |
| `FRONTEND_URL`    | Your Vercel frontend URL (e.g. `https://clis-nigeria.vercel.app`) |

### 3. Vercel (Frontend)

1. Create a new project and connect your GitHub repo
2. Set the **Root Directory** to `frontend`
3. Build settings are auto-detected from `vite.config.ts`
4. Add the following **Environment Variable** in the Vercel dashboard:

| Key            | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| `VITE_API_URL` | Your Render backend URL (e.g. `https://clis-nigerio-api.onrender.com`) |

5. Redeploy after adding the env var

### CORS

The backend reads `FRONTEND_URL` to set the CORS allowed origin. Ensure this matches your Vercel deployment URL exactly (no trailing slash).

---

## Docker Reference

| Command                                                | Effect                                 |
| ------------------------------------------------------ | -------------------------------------- |
| `docker compose up -d`                                 | Start MongoDB in the background        |
| `docker compose down`                                  | Stop container (data volume preserved) |
| `docker compose down -v`                               | Stop container and **delete all data** |
| `docker compose ps`                                    | Show container status                  |
| `docker logs clis_mongo`                               | View MongoDB logs                      |
| `docker exec -it clis_mongo mongosh -u mongo -p mongo` | Open a MongoDB shell                   |

If the container stops between sessions (e.g. after a machine restart):

```bash
docker compose up -d
```
