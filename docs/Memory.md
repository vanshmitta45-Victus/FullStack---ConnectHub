# ConnectHub — Memory

## 1. Project Memory
Full-stack workspace (Nexus UI): Spring Boot 4.1.1/Java 21 + React 19/Vite 8 + Postgres 16 + Nginx + Selenium E2E, orchestrated by Docker Compose, CI in `.github/workflows/ci.yml`. Auth is JWT (7d) for REST + STOMP. Frontend uses relative `/api` + `/ws` via proxies; `VITE_API_URL` override optional. DB init via `schema.sql`/`indexes.sql`, runtime migrated by `ddl-auto:update`.

## 2. Current Status (2026-10-01)
- Branch: `fix/runtime-blockers-cors-api-urls-healthcheck` pushed; PR link: `https://github.com/vanshmitta45-Victus/FullStack---ConnectHub/pull/new/fix/runtime-blockers-cors-api-urls-healthcheck`
- Verified: `npm run build` ✓ (588 kB chunk warning only), `./mvnw -q compile` ✓ (silent), `docker compose config` ✓
- Docs added: `docs/{PRD,Architecture,Rules,Design,Tasks,Memory}.md` (this batch, uncommitted until push)

## 3. Complete
- MVP auth, tasks Kanban, realtime chat (public/private/group + reactions/threads/typing/read/sync), teams/users admin, Cloudinary uploads, audit log, app shell + CommandPalette, E2E suites, Docker + CI skeleton.
- Hardening batch: global fix, compose ports, CORS/WS origins (+PATCH), DB password default `password123`, healthcheck `exit 1`, JWT env (`JWT_SECRET`/`JWT_EXPIRATION_MS`), 53 URLs → relative, vite proxy, `.env.example`s, `Bearer null` fix.

## 4. In Progress / Next
1. Unify roles (pick one set; migrate `AuthService` default + UI guards + `UserDetailsService` authorities).
2. Backfill `schema.sql` (`teams`, `blocked_users`, `message_attachments`, `team_id` FK) + align `VARCHAR` vs enum/`LocalDateTime` types; keep `ddl-auto:update` only for dev.
3. Decide `Team.java` fate (implement repo/service/controller or delete + drop table).
4. Remove secrets/PII: rotate Cloudinary keys + JWT default, `git rm --cached uploads/*.pdf`, add `.env` to ignore (already) + secret scan.
5. Write root `README.md` (prereqs, `docker compose up --build`, local dev `5173+8080`, env table, test commands).
6. Make e2e CI actually run services + `mvn test` instead of `test-compile` only.
7. Reduce frontend bundle (dynamic `import()` for Chat/TaskBoard; current 588 kB > 500 kB warning).

## 5. Key Decisions / Notes
- Relative API/WS chosen over absolute to support both Nginx prod and Vite dev without per-env builds.
- CORS explicitly lists `localhost:5173, localhost, localhost:80` (not `*`) because `allowCredentials=true`.
- JWT 7d kept (`604800000`); `AppConstants.JWT_EXPIRATION_MS=24h` is dead — use `app.jwt.expiration-ms`.
- Backend `utils/AppConstants.java` unused — canonical is `constant/AppConstants.java`.
