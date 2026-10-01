# ConnectHub — Product Requirements Document (PRD)

## 1. Project Overview
ConnectHub (branded in UI as "Nexus Workspace") is a full-stack B2B team workspace combining task management, realtime chat, team directory, file sharing, and audit logging in one app.

Monorepo: `C:\Users\vansh\OneDrive\Desktop\FullStack-ConnectHub`
- `connecthub-frontend/` — React 19 + Vite 8 SPA, Nginx prod image
- `connecthub-backend/` — Spring Boot 4.1.1, Java 21, REST + STOMP WebSocket + JWT
- `connecthub-db/` — PostgreSQL 16, `schema.sql` + `indexes.sql`
- `connecthub-automation/` — Selenium 4 + JUnit 5 E2E
- `docker-compose.yml` — postgres + backend + frontend
- `.github/workflows/ci.yml` — backend / frontend / e2e-compile / docker-build

## 2. Problem Statement
Distributed teams juggle separate tools for tasks (Kanban), chat (DMs + channels), files, and compliance (audit trail). This causes context switching, lost history, weak access control, and no single deployable unit.

## 3. Goals
1. Single login (JWT) for tasks + chat + files + admin.
2. Kanban workflow: create → assign → drag status → track.
3. Realtime messaging: public, private (`/topic/user.{u}`), group (`/topic/group.{g}`) with typing, read receipts, reactions, threads, missed-message sync.
4. Secure file upload (50 MB limit) via Cloudinary + DB record.
5. Admin: user CRUD, roles, block, audit log view.
6. One-command deploy: `docker compose up --build`.

Non-goals (current): mobile native app, email invites, video calls, multi-tenant billing.

## 4. Target Users
- **Employee / Member** — My Work, TaskBoard, Chat, Profile.
- **Team Lead / Manager** — create tasks, rebalance workload (Teams.jsx), manage channels.
- **Admin (`ADMIN`, `PROJECT_MANAGER`)** — UserManagement, AdminDashboard, AuditLog/AuditHistory.
- **Auditor / Viewer** — read-only audit trail.

> Known gap: role strings are inconsistent (`MEMBER` default in `AuthService`, `EMPLOYEE` in `AppConstants`, `ADMIN|PROJECT_MANAGER` checks in UI/API). See `docs/Memory.md`.

## 5. Core Features (MVP)
| Area | MVP scope | Key files |
|---|---|---|
| Auth | signup/register, login (JWT 7d), 401/403 interceptor, ProtectedRoute/RoleRoute, ErrorBoundary | `AuthController.java`, `AuthService.java`, `JwtUtils.java`, `JwtAuthFilter.java`, `Login.jsx`, `Signup.jsx`, `authService.js`, `App.jsx` |
| Tasks | CRUD, status drag-drop, assignee filter, priorities, TaskDrawer | `TaskController.java`, `TaskService.java`, `Task.java`, `TaskBoard.jsx`, `MyWork.jsx`, `Dashboard.jsx` |
| Chat | SockJS `/ws` + STOMP `/app/*`, `/topic/*`, history paged, search, thread counts, reactions batch, typing/read/react events, group create/add-member/toggle-disable/remove-member, clear private/group | `WebSocketConfig.java`, `ChatController.java`, `ChatGroupController.java`, `Chat.jsx`, `websocketService.js`, `chatService.js` |
| Teams/Users | directory, invite, role change, status toggle, delete | `UserController.java`, `UserService.java`, `Teams.jsx`, `UserManagement.jsx` |
| Files | multipart upload → Cloudinary + `chat_messages`/`message_attachments` | `FileUploadController.java`, `FileUploadService.java`, `CloudinaryConfig.java` |
| Audit | `audit_logs` + indexes, `/api/audit/all` UI | `AuditLogController.java`, `AuditLog.java`, `AuditLog.jsx`, `AuditHistory.jsx` |
| Shell | Sidebar, TopBar, CommandPalette (`/api/tasks|users|audit` search), Projects, Profile, UnauthorizedFallback | `AppLayout.jsx`, `NavigationSidebar.jsx`, `CommandPalette.jsx` |

## 6. Success Criteria
- `npm run build` (Vite) passes, `./mvnw clean test package` passes.
- `docker compose config` + `build` passes; `http://localhost` serves SPA, `/api/` + `/ws/` proxy to `backend:8080`.
- E2E: Kanban drag-drop, multi-session chat, styling tests green.
