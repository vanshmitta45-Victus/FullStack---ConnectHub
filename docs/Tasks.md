# ConnectHub — Tasks

Legend: `[x]` done (code exists), `[~]` partial/known gap, `[ ]` todo.

## 1. Project Setup
- [x] Monorepo layout (backend/frontend/db/automation) + root `docker-compose.yml`
- [x] Backend Maven wrapper, Java 21, Spring Boot 4.1.1 build (`./mvnw clean package`)
- [x] Frontend Vite 8 (`npm ci`, `lint`, `test`, `build`), `.env.example` (`VITE_API_URL`)
- [x] Postgres 16 compose service + healthcheck + volumes
- [x] Nginx prod image + `nginx.conf` (`/api/`, `/ws/` proxy, SPA fallback, gzip)
- [x] CI 4 jobs (backend-test-build, frontend-test-build, e2e-compile, docker-build)
- [ ] Root `README.md` is 1 line — write run instructions

## 2. Authentication
- [x] `POST /api/auth/signup|register|login`, BCrypt, JWT 7d (`JwtUtils`, `app.jwt.*`)
- [x] `JwtAuthFilter` + `SecurityConfig` (stateless, 401 JSON, CORS for :5173 + :80)
- [x] Frontend token/username/role storage, 401/403 interceptor, Protected/Role routes
- [~] Unify role strings (`MEMBER` vs `EMPLOYEE` vs `PROJECT_MANAGER` vs `ROLE_USER`)

## 3. Task Management (Kanban)
- [x] Entity `Task` (status/priority enums), CRUD + `/status` + `PUT /{id}`
- [x] `TaskBoard.jsx` (all + directory, drag status, create/edit/delete drawer)
- [x] `MyWork.jsx` (`?assignee=` filter), `Dashboard.jsx` aggregates, `Projects.jsx` list
- [x] `KanbanDragAndDropE2ETest`
- [ ] Server-side assignee/pagination filter (currently client-filtered)

## 4. Realtime Chat
- [x] SockJS `/ws`, STOMP `/app/chat.*`, broker `/topic` + auth on CONNECT/SUBSCRIBE
- [x] Public + `/topic/user.*` + `/topic/group.*` (member/creator/admin check)
- [x] History paged, search, thread + thread-counts, reactions batch, read/sync-missed, clear private/group
- [x] Group CRUD: create/add-member/toggle-disable/remove-member + `my-groups`
- [x] `websocketService` (auto-reconnect 4s, heartbeat 10s, resubscribe, `Bearer` only if token)
- [x] `MultiSessionRealtimeChatE2ETest`
- [ ] Unauthenticated `/topic/public` subscribe currently throws — decide public vs auth-only

## 5. Teams / Users / Admin
- [x] `GET /users/all|directory|list`, `POST /users/create|invite`, role/status update, delete
- [x] `Teams.jsx` workload rebalance, `UserManagement.jsx`, `AdminDashboard.jsx`, `Profile.jsx`
- [~] `Team.java` orphan (no repository/service/controller) — wire or remove
- [ ] Remove committed PII `uploads/*.pdf`; ensure `uploads/` ignored

## 6. Files & Audit
- [x] `POST /api/chat/files/upload` (multipart 50 MB) → Cloudinary + DB
- [x] `audit_logs` + 13 indexes, `GET /api/audit/all`, `AuditLog.jsx`/`AuditHistory.jsx`
- [~] `schema.sql` missing `teams`, `blocked_users`, `message_attachments`; mismatched types rely on `ddl-auto:update` — backfill SQL
- [ ] Rotate hardcoded Cloudinary defaults to env-only

## 7. Hardening (fixed 2026-10-01, branch `fix/runtime-blockers-*`)
- [x] `index.html` `typeof global` fix, compose single `80:80`, CORS/WS origins, DB password default, HEALTHCHECK `exit 1`, JWT env, relative `/api|/ws`, vite proxy, `.env.example`s
