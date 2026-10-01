# ConnectHub — Development Rules

## 1. General Principles
1. Evidence before change: read the file, reproduce, then edit minimal scope.
2. Prefer editing existing files over creating new ones. No new deps without need.
3. Verify every fix: `npm run build` / `vitest run` (frontend), `./mvnw -q compile` / `clean test` (backend), `docker compose config`.
4. Never commit secrets (`.env`, Cloudinary keys, JWT secret, PDFs in `uploads/`). Use `.env.example`.
5. Keep Docker + local + CI in sync (ports, passwords, env names).

## 2. Technology & Coding Standards
### Backend (Java 21 / Spring Boot 4.1.1)
- Package `com.vansh.connecthub.*`; constructor injection preferred; Lombok for models.
- Security: all new REST endpoints authenticated by default; add to `SecurityConfig` allowlist only for public (`/api/auth/**`, `/ws/**`, health). No `System.out/err` in filters — use logger.
- JWT: read from `app.jwt.secret` / `app.jwt.expiration-ms` (`JWT_SECRET` env), never hardcode. See `JwtUtils`.
- CORS: update `SecurityConfig.corsConfigurationSource`, `WebSocketConfig.setAllowedOrigins`, and controller `@CrossOrigin` together. Allowed: `http://localhost:5173`, `http://localhost`, `http://localhost:80`.
- JPA: entities in `model/`, repos in `repository/`; keep `schema.sql` + entity mappings in sync (don't rely solely on `ddl-auto:update`). Add index to `indexes.sql` for new FK/search columns.
- File upload limits in `application.properties` (50 MB). Validate content-type/size in service.

### Frontend (React 19 / Vite 8)
- No hardcoded `http://localhost:8080`. Use relative `/api` + `/ws`; optional `import.meta.env.VITE_API_URL` prefix (strip trailing `/`). Proxies already handle both envs (`nginx.conf`, `vite.config.js`).
- Axios: attach `Authorization: Bearer <token>`; handle 401/403 via `main.jsx` interceptor (logout + redirect).
- STOMP: `websocketService.connect(username, cb)`; omit `Authorization` header when no token; resubscribe groups on reconnect; unsubscribe on leave.
- Fix pattern for `global is not defined` (sockjs): `if (typeof global === 'undefined') { var global = window; }` in `index.html`.
- Lint: `npm run lint` (oxlint) clean; tests: `vitest run` + `setupTests.js` (jsdom).
- Styling: use CSS vars from `index.css` (`--neu-*`); no inline hex outside vars.

### DB / Docker / CI
- `connecthub-db/*.sql` mounted to `/docker-entrypoint-initdb.d/` — must be idempotent (`IF NOT EXISTS`).
- `docker-compose.yml`: backend needs `SPRING_DATASOURCE_*` + `depends_on postgres healthy`; frontend only `80:80`.
- Backend `HEALTHCHECK` must `exit 1` on failure, never `exit 0`.
- CI (`.github/workflows/ci.yml`): keep Node 22 / JDK 21, postgres password `password123` — matches compose default.

## 3. Project Structure Rules
- Backend: `controller → service → repository → model`. No business logic in controllers. `Team.java` is currently orphan (no repo/service/controller) — either wire it or delete it; don't add more orphans.
- Frontend: `services/` = API/WS only; `components/` = UI; `config` via env. Don't duplicate `AppConstants` (backend has `constant/` + `utils/` duplicate — use `constant/` only).
- Docs: update `docs/Tasks.md` + `docs/Memory.md` on every feature/fix.

## 4. Git / PR Rules
- Branch from `main`: `feat/*`, `fix/*`, `docs/*`. One logical change per PR.
- Commit message: `feat|fix|docs|chore(scope): imperative summary`.
- PR must list: files changed, verification commands + output, breaking/env changes. Require green CI before merge.
