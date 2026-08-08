# Zyron — Multi-Tenant SaaS Platform

> A powerful, modular SaaS platform for businesses (schools, transport companies, and more) to manage their day-to-day operations. Zyron gives each organization its own isolated dashboard while the Super Admin monitors and controls all organizations invisibly from a platform-level admin panel.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Credentials](#credentials)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
  - [1. Start the Database](#1-start-the-database)
  - [2. Setup the Backend](#2-setup-the-backend)
  - [3. Setup the Frontend](#3-setup-the-frontend)
- [Running the Project](#running-the-project)
- [Available API Endpoints](#available-api-endpoints)
- [Environment Variables](#environment-variables)
- [Database Management](#database-management)
- [Modules / App Store](#modules--app-store)
- [Roles & Permissions](#roles--permissions)
- [Roadmap](#roadmap)

---

## Project Overview

Zyron is an **Odoo-like multi-tenant SaaS platform** where:

- **Organizations** (schools, transport companies, etc.) get their own admin dashboard
- **Org Admins** can manage their staff, settings, and activate/deactivate modules they subscribe to
- **Super Admin** (`moiinuddinkhajamd@gmail.com`) has a hidden platform-level dashboard that shows all organizations, their activity, module usage, and can activate or suspend any organization — without organizations knowing they are being monitored

---

## Architecture

```
zyron/
├── frontend/      → Vite + React (runs on port 5173)
├── backend/       → Next.js API Routes (runs on port 3001)
└── docker-compose.yml  → PostgreSQL + pgAdmin
```

**Request flow:**

```
Browser (React) → Backend API (Next.js) → PostgreSQL (via Prisma ORM)
```

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, TypeScript, Vite        |
| Styling   | Vanilla CSS (custom design system) |
| State     | Zustand (with localStorage persist) |
| Routing   | React Router v6                   |
| Icons     | Lucide React                      |
| Backend   | Next.js 14 (API Routes only)      |
| ORM       | Prisma 5                          |
| Database  | PostgreSQL 15                     |
| Auth      | JWT (jsonwebtoken + bcryptjs)     |
| Container | Docker + Docker Compose           |

---

## Project Structure

```
zyron/
├── frontend/
│   ├── src/
│   │   ├── app/             # Router & App entry
│   │   ├── features/        # Feature modules (auth, dashboard, etc.)
│   │   ├── layouts/         # SuperAdminLayout, OrgAdminLayout
│   │   ├── services/        # API client, auth.service.ts
│   │   ├── store/           # Zustand stores (auth.store.ts)
│   │   ├── components/      # Shared UI components
│   │   └── index.css        # Global design tokens & styles
│   ├── .env                 # VITE_API_URL
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── app/api/v1/      # Next.js API routes
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   └── me/route.ts
│   │   │   ├── organizations/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   └── platform/modules/route.ts
│   │   └── core/
│   │       ├── auth/
│   │       │   ├── jwt.ts       # Token sign/verify
│   │       │   ├── password.ts  # bcrypt hash/verify
│   │       │   └── middleware.ts # requireAuth, requireSuperAdmin
│   │       └── database/
│   │           └── prisma.ts    # Prisma singleton client
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Seeds super admin + demo org
│   ├── .env                 # DATABASE_URL, JWT_SECRET
│   └── package.json
│
└── docker-compose.yml       # PostgreSQL + pgAdmin
```

---

## Credentials

> ⚠️ These are stored in the database (hashed with bcrypt). Run the seed to create them.

| Role        | Email                          | Password    |
|-------------|--------------------------------|-------------|
| Super Admin | moiinuddinkhajamd@gmail.com    | 99892@Kha   |
| Org Admin   | moinuddinkhajamd01@gmail.com   | 99892@Kha   |

---

## Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or higher → [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- **PostgreSQL 14+** — either via:
  - **Homebrew (Mac):** `brew install postgresql@14`
  - **Docker Desktop** → [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)

---

## Setup & Installation

### 1. Start the Database

**Option A — Homebrew (already set up on this machine):**
```bash
# Start Postgres if not already running
brew services start postgresql@14

# Create DB user and database (only needed once)
psql -c "CREATE USER zyron_user WITH PASSWORD 'zyron_pass' CREATEDB;" postgres
psql -c "CREATE DATABASE zyron_db OWNER zyron_user;" postgres
psql -c "GRANT ALL PRIVILEGES ON DATABASE zyron_db TO zyron_user;" postgres
```

**Option B — Docker:**
```bash
# From the zyron/ root directory (requires Docker Desktop to be running)
docker compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **pgAdmin** (DB browser UI) on `http://localhost:5050`
  - Email: `admin@zyron.com` / Password: `admin123`

---

### 2. Setup the Backend

```bash
# Go into the backend directory
cd backend

# Install dependencies
npm install

# Run database migrations (creates all tables)
npm run db:migrate

# Seed the database (creates super admin, demo org, modules)
npm run db:seed
```

Expected seed output:
```
🌱 Seeding database...
📦 Creating platform modules...
👑 Creating super admin...
  ✅ Super Admin: moiinuddinkhajamd@gmail.com
🏫 Creating demo organization...
👤 Creating org admin...
  ✅ Org Admin: moinuddinkhajamd01@gmail.com
✅ Seed complete!
```

---

### 3. Setup the Frontend

```bash
# From the zyron/ root, go to frontend
cd frontend

# Install dependencies
npm install
```

---

## Running the Project

You need **3 terminals** to run the full stack:

### Terminal 1 — Database
```bash
# From zyron/ root
docker compose up
```

### Terminal 2 — Backend API
```bash
# From zyron/backend/
npm run dev
```
Backend runs at: **http://localhost:3001**

### Terminal 3 — Frontend
```bash
# From zyron/frontend/
npm run dev
```
Frontend runs at: **http://localhost:5173**

---

### Quick Start (all at once using separate terminals)

```bash
# Terminal 1
docker compose up -d

# Terminal 2
cd backend && npm run dev

# Terminal 3
cd frontend && npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Available API Endpoints

All endpoints are prefixed with `/api/v1`

### Auth
| Method | Endpoint             | Auth Required | Description                  |
|--------|----------------------|---------------|------------------------------|
| POST   | `/auth/login`        | ❌            | Login with email & password   |
| GET    | `/auth/me`           | ✅            | Get current user profile      |

**Login request body:**
```json
{
  "email": "moiinuddinkhajamd@gmail.com",
  "password": "99892@Kha"
}
```

**Login response:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "...",
    "email": "...",
    "firstName": "Moinuddin",
    "lastName": "Khaja",
    "isSuperAdmin": true,
    "organization": null,
    "role": null
  }
}
```

### Organizations (Super Admin only)
| Method | Endpoint                   | Description                        |
|--------|----------------------------|------------------------------------|
| GET    | `/organizations`           | List all organizations             |
| POST   | `/organizations`           | Create new organization            |
| GET    | `/organizations/:id`       | Get single organization            |
| PATCH  | `/organizations/:id`       | Update org (activate/suspend)      |
| DELETE | `/organizations/:id`       | Delete organization                |

### Platform
| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | `/platform/modules`       | List all available SaaS modules    |

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://zyron_user:zyron_pass@localhost:5432/zyron_db"
JWT_SECRET="your_super_secret_jwt_key"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
PORT=3001
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3001/api/v1
```

---

## Database Management

```bash
# From zyron/backend/

# Open Prisma Studio (visual DB editor in browser)
npm run db:studio

# Create a new migration after editing schema.prisma
npm run db:migrate

# Reset DB and re-run all migrations + seed
npm run db:reset

# Re-run the seed only (without reset)
npm run db:seed

# Regenerate Prisma client after schema changes
npm run generate
```

---

## Modules / App Store

Organizations can subscribe to any combination of these modules:

| Module Key    | Name                       | Price (₹/month) |
|---------------|----------------------------|-----------------|
| `attendance`  | Attendance Management      | ₹999            |
| `accounts`    | Accounts & Finance         | ₹1,499          |
| `inventory`   | Book & Inventory           | ₹799            |
| `transport`   | Transport & Fleet          | ₹1,299          |
| `messaging`   | Messaging & Notifications  | ₹599            |
| `examinations`| Examinations & Results     | ₹1,099          |
| `library`     | Library Management         | ₹699            |
| `hostel`      | Hostel Management          | ₹899            |

Organizations are billed based on which modules they activate. The Super Admin can see their module selections and billing details.

---

## Roles & Permissions

| Role          | Dashboard       | Can See All Orgs | Can Suspend Org | Can Manage Staff |
|---------------|-----------------|------------------|-----------------|------------------|
| `SUPER_ADMIN` | `/admin`        | ✅               | ✅              | ❌ (platform level) |
| `ORG_ADMIN`   | `/dashboard`    | ❌               | ❌              | ✅               |
| `STAFF`       | `/dashboard`    | ❌               | ❌              | ❌               |
| `TEACHER`     | `/dashboard`    | ❌               | ❌              | ❌               |

> The Super Admin's existence is **invisible** to organizations. From their perspective, they are the highest authority in their own admin panel.

---

## Roadmap

- [x] Frontend prototype (React + Vite)
- [x] Zustand state management with JWT persistence
- [x] PostgreSQL database with Prisma ORM
- [x] Real authentication API (login, /me)
- [x] Organizations CRUD API
- [x] Platform modules API
- [x] Seed data (super admin + demo org)
- [ ] Email verification on registration
- [ ] Stripe billing integration
- [ ] Staff management within orgs
- [ ] Audit log viewer for Super Admin
- [ ] Module-level feature pages (attendance sheets, etc.)
- [ ] Deployment (Vercel + Supabase / Railway)
