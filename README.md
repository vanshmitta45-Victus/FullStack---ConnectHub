# FullStack ConnectHub — Nexus Workspace

> Solo full-stack project by **Vansh Mittal** (`vanshmitta45-Victus`).
> A single-workspace B2B app: Kanban tasks + realtime chat + teams + file sharing + audit log — one login, one deploy.

**Stack:** React 19 · Vite 8 · Nginx · Spring Boot 4.1.1 (Java 21) · PostgreSQL 16 · STOMP/SockJS · JWT · Cloudinary · Selenium E2E · Docker Compose · GitHub Actions

## About this project

Distributed teams lose context switching between a task board, a chat app, a file drive, and an audit spreadsheet. ConnectHub puts them in one workspace:

- One JWT login unlocks tasks, DMs + channels, uploads, and admin — no per-tool accounts.
- Work and talk stay linked: create a task from chat context, discuss it in a channel, attach a file, and every admin action lands in the audit trail.
- Realtime by default: public feed, private `user.{name}` inbox, and members-only `group.{channel}` rooms with typing, read receipts, reactions, threads, and missed-message sync on reconnect.
- Deployable as a unit: `docker compose up --build` brings up Postgres → Spring Boot → Nginx SPA.

I built this end-to-end: data model + SQL + indexes, Spring Security/JWT + STOMP auth, REST + WebSocket APIs, React UI (dark glassmorphism system), Nginx/Vite proxying, Selenium E2E, and CI + Docker delivery.

## What I built (highlights)

- **Secure auth + realtime auth:** BCrypt + JWT (7-day) for REST (`JwtAuthFilter`) and STOMP (`CONNECT` token + `SUBSCRIBE` rules — private inbox is self-or-admin, channels are member/creator/admin only).
- **Kanban that survives real use:** task CRUD, drag-to-change-status, assignee filter (`My Work`), priorities, drawer detail, dashboard aggregates — covered by `KanbanDragAndDropE2ETest`.
- **Chat with presence semantics:** paged history, search, thread counts, batch reactions, typing/read/reaction events, group lifecycle (create/add-member/toggle-disable/remove-member), private/group clear.
- **Ops-minded frontend networking:** relative `/api` + `/ws` everywhere (53 hardcoded hosts removed) so the same build works behind Nginx prod proxy and Vite dev proxy; `VITE_API_URL` override optional. Fixed SockJS `global is not defined` and `Bearer null` bugs.
- **Hardening batch:** unified CORS/WS origins (`:5173` + `:80`), DB password default aligned with Compose/CI (`password123`), real `HEALTHCHECK` (`exit 1`), JWT secret via `JWT_SECRET` env, `.env.example`s.
- **Design system:** dark futuristic glassmorphism (`--neu-*` tokens in `index.css`): glass panels, pill buttons, cyan `#00f2fe` / violet `#a855f7` accents, `ErrorBoundary` + empty states so the app never blank-screens.

## Architecture (brief)

```
Browser (:80 Nginx / :5173 Vite)
 |-- /api/* → proxy → Spring Boot :8080 → PostgreSQL :5432
 |-- /ws/* (SockJS+STOMP) → Spring Boot :8080 (/app/* → /topic/*)
Backend :8080 → Cloudinary (uploads)
```

Full diagram, stack pins, folder tree, workflows: [`docs/Architecture.md`](docs/Architecture.md).
Product scope: [`docs/PRD.md`](docs/PRD.md) · Rules: [`docs/Rules.md`](docs/Rules.md) · Design tokens: [`docs/Design.md`](docs/Design.md) · Task tracker: [`docs/Tasks.md`](docs/Tasks.md) · Status: [`docs/Memory.md`](docs/Memory.md)

## Quickstart (Docker)

Prereqs: Docker + Compose.

```bash
docker compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost (80)|
| Backend  | http://localhost:8080 |
| Postgres | localhost:5432        |

## Local development

Prereqs: Node 22, JDK 21, Postgres 16 (`connecthub_db`).

```bash
# backend (:8080)
cd connecthub-backend
# see .env.example: SPRING_DATASOURCE_* / JWT_SECRET / CLOUDINARY_*
./mvnw spring-boot:run   # Windows: ./mvnw.cmd spring-boot:run

# frontend (:5173, proxies /api + /ws → :8080)
cd connecthub-frontend
npm ci
npm run dev
```

## Verify

```bash
cd connecthub-frontend && npm ci && npm run lint && npm run test && npm run build
cd connecthub-backend && ./mvnw clean test
docker compose config && docker compose build
```

CI (`.github/workflows/ci.yml`) runs backend-test-build, frontend-test-build, e2e-compile, docker-build.

## API cheat-sheet

```
POST /api/auth/signup|register|login
GET  /api/tasks/all  POST /api/tasks/create  PUT /api/tasks/{id}  PUT /api/tasks/{id}/status
GET  /api/users/directory  POST /api/users/invite
GET  /api/chat/groups/my-groups  POST /api/chat/groups/create
GET  /api/chat/history/paged  POST /api/chat/files/upload
GET  /api/audit/all
WS   /ws → /app/chat.* → /topic/*
```

## Outcomes & next

- Working Docker + CI delivery, E2E-covered Kanban + multi-session chat.
- Known follow-ups (see `docs/Memory.md`): unify role strings, backfill `schema.sql` (`teams`/`blocked_users`/`attachments`), decide `Team.java` fate, rotate committed Cloudinary defaults, code-split 588 kB bundle.

— Vansh
