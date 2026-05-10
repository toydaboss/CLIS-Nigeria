# CLIS Nigeria

## Cloud-Based Centralized Land Information System

A full-stack web application for Nigerian land title registration, public verification, and dispute management. Built with React, Express, TypeScript, and MongoDB.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Running the Application](#running-the-application)
- [Demo Credentials](#demo-credentials)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Docker Reference](#docker-reference)

---

## Overview

CLIS Nigeria provides two main surfaces:

**Public portal** — Any citizen can verify a land title by reference number (e.g. `LAGOS-2024-00142`) without an account. Results show registration status, jurisdiction, and any active dispute.

**Admin portal** — Government registrars and administrators log in with email/password + TOTP two-factor authentication to register new titles, look up full title records, flag disputes, view the dashboard, and review the immutable audit log.

### Target Users

| User           | Role                            |
| -------------- | ------------------------------- |
| General public | Read-only title verification    |
| Land registrar | Register titles, flag disputes  |
| Administrator  | Full access including audit log |

---

## Tech Stack

| Layer        | Technology                                    |
| ------------ | --------------------------------------------- |
| Frontend     | React 18, TypeScript, Vite 5                  |
| Routing      | TanStack Router v1                            |
| Server state | TanStack Query v5                             |
| Styling      | TailwindCSS v4                                |
| Backend      | Express 4, TypeScript                         |
| Database     | MongoDB 8 (via Docker)                        |
| ODM          | Mongoose 8                                    |
| Auth         | JWT (jsonwebtoken) + TOTP (otplib) + bcryptjs |
| Testing      | Vitest, Supertest, Testing Library            |

---

## Project Structure

```
repo/
├── docker-compose.yml        # MongoDB container
├── backend/
│   ├── .env.example
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.ts      # Mongoose connection
│   │   │   ├── seed.ts       # Demo data seeder
│   │   │   └── models/
│   │   │       ├── User.ts
│   │   │       ├── Title.ts
│   │   │       └── AuditLog.ts
│   │   ├── middleware/
│   │   │   └── auth.ts       # JWT + role guards
│   │   ├── routes/
│   │   │   ├── public.ts     # GET /api/titles/:ref
│   │   │   └── admin/
│   │   │       ├── auth.ts       # Login + MFA
│   │   │       ├── titles.ts     # Title CRUD
│   │   │       ├── dashboard.ts  # Stats + activity
│   │   │       └── audit.ts      # Audit log
│   │   └── index.ts          # Express app entry point
│   └── src/__tests__/        # Vitest test suites
└── frontend/
    ├── src/
    │   ├── lib/
    │   │   ├── api.ts        # Axios instance + interceptors
    │   │   └── auth.ts       # localStorage token helpers
    │   ├── components/       # RefChip, StatusBadge, Stepper
    │   ├── routes/           # Page components
    │   └── router.tsx        # Route definitions + auth guards
    └── src/__tests__/        # Vitest + Testing Library tests
```

---

## Prerequisites

- **Node.js** 20 or later
- **npm** 9 or later
- **Docker** with Docker Compose — [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
- A **TOTP authenticator app** (Google Authenticator, Authy, or similar) for admin login

---

## Getting Started

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

The defaults in `.env.example` work out of the box with the Docker container. Change `JWT_SECRET` and `JWT_TEMP_SECRET` for any non-local deployment.

### 4. Install backend dependencies and seed the database

```bash
cd backend
npm install
npm run db:seed
```

The seed script will output TOTP secrets and OTP URIs — **save these**. You need them to log in to the admin portal.

### 5. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Environment Variables

### `backend/.env`

| Variable          | Description                             | Default                                                               |
| ----------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `MONGODB_URI`     | MongoDB connection string               | `mongodb://mongo:mongo@127.0.0.1:27017/clis_nigeria?authSource=admin` |
| `JWT_SECRET`      | Secret for signing access tokens (8h)   | _(change this)_                                                       |
| `JWT_TEMP_SECRET` | Secret for signing MFA temp tokens (5m) | _(change this)_                                                       |
| `PORT`            | Backend server port                     | `3001`                                                                |
| `FRONTEND_URL`    | Allowed CORS origin                     | `http://localhost:5173`                                               |

> **Note:** Use `127.0.0.1` not `localhost` in the MongoDB URI. On Linux, `localhost` resolves to a Unix socket; `127.0.0.1` forces TCP which the Docker container requires.

---

## Database

### MongoDB collections

| Collection  | Model      | Description                                                         |
| ----------- | ---------- | ------------------------------------------------------------------- |
| `users`     | `User`     | Admin and registrar accounts with hashed passwords and TOTP secrets |
| `titles`    | `Title`    | Land title records with coordinates, status, and ownership data     |
| `auditlogs` | `AuditLog` | Append-only record of every INSERT, UPDATE, and FLAG_DISPUTE action |

### Key schema fields (camelCase throughout)

**Title**

```
titleRef           String   unique, e.g. "LAGOS-2024-00142"
status             String   "registered" | "disputed" | "pending"
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

Open MongoDB Compass and connect with:

```
mongodb://mongo:mongo@127.0.0.1:27017/clis_nigeria?authSource=admin
```

### Connecting with pgAdmin (MongoDB plugin) or Compass

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

**Setting up TOTP:**

1. Run `npm run db:seed` — it prints OTP URIs at the bottom
2. Scan the URI as a QR code in your authenticator app (use a QR code generator with the printed URI), or manually enter the base32 secret
3. Use the 6-digit code from the app at the MFA step

### Public title references for testing

| Reference           | Status     |
| ------------------- | ---------- |
| `LAGOS-2024-00142`  | Registered |
| `ABUJA-2022-08891`  | Disputed   |
| `LAGOS-2026-04193`  | Registered |
| `KANO-2025-02211`   | Registered |
| `RIVERS-2026-00871` | Registered |

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

### Admin (Bearer token required)

| Method  | Endpoint                         | Auth           | Description                |
| ------- | -------------------------------- | -------------- | -------------------------- |
| `GET`   | `/api/admin/dashboard/stats`     | Registrar+     | Aggregate title counts     |
| `GET`   | `/api/admin/dashboard/recent`    | Registrar+     | Last 10 audit entries      |
| `GET`   | `/api/admin/dashboard/chart`     | Registrar+     | Registrations last 14 days |
| `GET`   | `/api/admin/titles`              | Registrar+     | Paginated title list       |
| `GET`   | `/api/admin/titles/:ref`         | Registrar+     | Full title record          |
| `POST`  | `/api/admin/titles`              | Registrar+     | Register new title         |
| `PATCH` | `/api/admin/titles/:ref/dispute` | Registrar+     | Flag a dispute             |
| `GET`   | `/api/admin/audit`               | **Admin only** | Paginated audit log        |

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

Tests use Vitest + Supertest. Mongoose models are mocked — no live database connection required. The mock pattern used throughout:

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

### Run both

```bash
cd backend && npm test && cd ../frontend && npm test
```

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

If the container stops between sessions (e.g. after a machine restart), restart it with:

```bash
docker compose up -d
```
