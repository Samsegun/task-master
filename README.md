# Task-Master API

A REST API for a collaborative project management tool — handling user authentication, project management, task assignments, team roles, and transactional email.

**Live API:** [https://task-master-f3ot.onrender.com/api](https://task-master-f3ot.onrender.com/api)  
**Interactive Docs:** [https://task-master-f3ot.onrender.com/api/docs](https://task-master-f3ot.onrender.com/api/docs)  
**Frontend:** [https://task-master.space](https://task-master.space)

---

## Features

- JWT authentication with access/refresh token rotation via HTTP-only cookies
- Project CRUD with role-based access control (Owner, Member)
- Task CRUD with status, priority, and member assignment
- Project invitations with dual-token flow (new vs. existing users)
- Transactional email (verification, password reset, invitations)
- Rate limiting on register, login and reset-password routes
- Interactive API docs via Swagger

---

## Tech Stack

Layer Technology

---

Runtime: Node.js, Express, TypeScript  
 Database: PostgreSQL via Supabase  
 ORM: Prisma  
 Auth: JWT (access + refresh tokens, HTTP-only cookies)
Email: Resend (via custom domain)  
 Validation: Zod  
 Testing: Jest, Supertest  
 Containerization: Docker  
 Hosting: Render (Frankfurt region)  
 Error Monitoring: Sentry

---

## Architecture

```
Client (task-master.space)
        ↓
Cloudflare Pages (React frontend)
        ↓ HTTPS API calls
Render — Frankfurt (Dockerized Express API)
        ↓                    ↓
Supabase — Ireland      Resend
(PostgreSQL)            (transactional email)
```

The backend runs as a Docker container on Render. On every deploy, Prisma migrations run automatically via an `entrypoint.sh` script before the server starts.

---

## Local Development

### Prerequisites

- Node.js v18+
- pnpm
- Docker (optional — for containerized local dev)

### 1. Clone the repo

```bash
git clone https://github.com/Samsegun/task-master.git
cd task-master
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp .env.sample .env.development
```

Fill in `.env.development` with your values. At minimum you need:

```dotenv
DATABASE_URL="postgresql://username:password@host:5432/dbname"
DIRECT_URL="postgresql://username:password@host:5432/dbname"
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_INVITATION_SECRET=
```

See `.env.sample` for the full list of required variables.

### 4. Run migrations

```bash
pnpm run migrate:dev
```

### 5. Seed the database (optional)

```bash
pnpm run seed:dev
```

### 6. Start the dev server

```bash
pnpm run dev
```

Server runs at `http://localhost:7000`. API docs at `http://localhost:7000/api/docs`.

---

## Running with Docker

Requires Docker Desktop or Docker Engine.
Note: I used Docker for production builds only so it uses .env variables

```bash

# build and start
docker compose up --build
```

The `database` service in `docker-compose.yml` is for local development only. In production, the app connects to Supabase directly via `DATABASE_URL`.

---

## Testing

```bash
# run all tests
pnpm run test

# run with coverage
pnpm run test:coverage
```

Tests use a separate `.env.test` file with an isolated test database. Test suites cover Auth, Project, ProjectMember, and Task services.

---

## Key Engineering Notes

**Docker image size** — The production image uses a multi-stage build (`base → builder → production`) that reduced the final image from ~1.46GB to ~153MB (content size) by installing only production dependencies and regenerating the Prisma client per stage to avoid pnpm symlink issues across build stages.

**Prisma + pnpm in Docker** — Copying `node_modules/.prisma` across Docker stages is unreliable with pnpm due to its symlink-based module structure. The fix is running `prisma generate` independently in each stage that needs the client.

**Rate limiting** — Auth routes (`/login`, `/register`, `/reset-password`) are rate-limited using `express-rate-limit` with `trust proxy` configured for Render's reverse proxy. Failed login attempts are counted separately from successful ones.

**Project invitation Token strategy** — Invitations use a dual-token architecture: existing users receive a direct invitation token, new users receive a combined verification + invitation token so both email verification and project membership are resolved in a single flow.
