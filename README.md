# CLIS-Nigeria

This is a repository for my MSIT Capstone Project

# CLIS Nigeria — Setup Guide

Cloud-Based Centralized Land Information System. Public verification portal + restricted admin portal for Nigerian land registries.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally

---

## 1. Database

```bash
# Create the database
createdb clis_nigeria

# Apply schema
cd backend
cp .env.example .env
npm install
npm run db:migrate

# Seed demo data (outputs credentials + TOTP secrets)
npm run db:seed
```

The seed script prints everything you need:

- **Registrar** — `a.bello@lagosstate.gov.ng` / `Password123!`
- **Admin** — `o.adeyemi@clis.gov.ng` / `Password123!`
- TOTP secrets and OTP URIs to add to your authenticator app (Google Authenticator, Authy, etc.)

> **Note:** scan the printed OTP URI with your authenticator app, or manually enter the secret.

---

## 2. Backend

```bash
cd backend
# Edit .env if your Postgres URL differs from the default
npm run dev      # starts on http://localhost:3001
```

### Environment variables (`backend/.env`)

| Variable          | Default                                                      | Description                      |
| ----------------- | ------------------------------------------------------------ | -------------------------------- |
| `DATABASE_URL`    | `postgresql://postgres:postgres@localhost:5432/clis_nigeria` | Postgres connection string       |
| `JWT_SECRET`      | `dev-secret`                                                 | Long random string in production |
| `JWT_TEMP_SECRET` | `dev-temp-secret`                                            | Secret for MFA temp tokens       |
| `PORT`            | `3001`                                                       | API port                         |
| `FRONTEND_URL`    | `http://localhost:5173`                                      | CORS origin                      |

---

## 3. Frontend

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173
```

The Vite dev server proxies all `/api/*` requests to `:3001` — no extra config needed.

---

## Pages

| URL                | Description                                     |
| ------------------ | ----------------------------------------------- |
| `/`                | Public title verification (no login)            |
| `/admin/login`     | Admin login (credentials + TOTP MFA)            |
| `/admin/dashboard` | KPI stats, recent activity, registrations chart |
| `/admin/register`  | 3-step form to register a new land title        |
| `/admin/lookup`    | Internal admin lookup (full metadata)           |
| `/admin/audit`     | Immutable audit log (admin-only)                |

---

## API endpoints

### Public

- `GET /api/titles/:ref` — verify a title reference (e.g. `LAGOS-2024-00142`)

### Auth

- `POST /api/auth/login` — step 1: `{ email, password }` → `{ tempToken }`
- `POST /api/auth/mfa` — step 2: `{ tempToken, code }` → `{ accessToken, user }`

### Admin (Bearer token required)

- `GET /api/admin/dashboard/stats`
- `GET /api/admin/dashboard/recent`
- `GET /api/admin/titles/:ref` — full metadata
- `POST /api/admin/titles` — register new title
- `PATCH /api/admin/titles/:ref/dispute` — flag dispute
- `GET /api/admin/audit` — audit log (admin role only)

---

## Design system

Colors, typography, and components follow the CLIS Nigeria design system in `frontend/src/styles/globals.css`. The palette uses warm earth tones on top of government blue and gold — tuned for Nigerian civic context.

| Token          | Value         | Use                     |
| -------------- | ------------- | ----------------------- |
| `--c-blue-700` | `#1F4E79`     | Primary brand           |
| `--c-gold-500` | `#C9A84C`     | Civic accent            |
| `--c-paper`    | `#FBF8EE`     | Warm ivory background   |
| `--f-sans`     | Public Sans   | Body text               |
| `--f-mono`     | IBM Plex Mono | Title references, codes |
