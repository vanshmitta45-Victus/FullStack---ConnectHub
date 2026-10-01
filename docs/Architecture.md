# ConnectHub — Architecture

## 1. High-Level Architecture

```
Browser (:80 Nginx SPA / :5173 Vite dev)
  |-- /api/*  --> Nginx proxy / Vite proxy --> Spring Boot :8080 --> PostgreSQL :5432
  |-- /ws/* (SockJS+STOMP) --> Spring Boot :8080 (WebSocket broker /topic)
  |-- static  --> Nginx /usr/share/nginx/html
Backend :8080 --> Cloudinary (file uploads)
Selenium E2E --> http://localhost:5173 + http://localhost:8080
```

- Auth: JWT Bearer in `Authorization` header (REST) and STOMP `CONNECT` native header. `JwtAuthFilter` secures REST; `WebSocketConfig.configureClientInboundChannel` authenticates `CONNECT` and authorizes `SUBSCRIBE` (`/topic/user.*` self-or-admin, `/topic/group.*` member/creator/admin).
- REST base: `/api/auth`, `/api/tasks`, `/api/users`, `/api/chat/*`, `/api/files`, `/api/audit`.
- WS: endpoint `/ws` (SockJS), app prefix `/app` (`chat.sendMessage`, `sendPrivateMessage`, `sendGroupMessage`, `typing`, `read`, `react`), broker `/topic`.
- Frontend API access: relative `/api` + `/ws` (works via `nginx.conf` prod proxy and `vite.config.js` dev proxy). `VITE_API_URL` optional override (empty = relative). See `frontend/.env.example`.

## 2. Technology Stack
| Layer | Tech (pinned) |
|---|---|
| Frontend | React 19.2.8, react-router-dom 7.18.4, axios 1.20.0, @stomp/stompjs 7.3.0, sockjs-client 1.6.1, Vite 8.3.0, vitest 5.0.2, oxlint 1.81.0, Nginx alpine |
| Backend | Java 21, Spring Boot 4.1.1 (webmvc, security, data-jpa, websocket), JJWT 0.11.5, Cloudinary http44 1.36.0, Lombok, Maven wrapper |
| DB | postgres:16-alpine, `schema.sql` (users, tasks, chat_groups, members, messages, reactions, audit_logs) + `indexes.sql` (13 indexes), `ddl-auto:update` |
| Automation | Selenium 4.26.0, WebDriverManager 5.9.2, JUnit 5.11.3, AssertJ |
| DevOps | Docker Compose (postgres/backend/frontend), GitHub Actions 4 jobs |

## 3. Folder Structure (actual)
```
docker-compose.yml, README.md, .gitignore
docs/PRD.md, Architecture.md, Rules.md, Design.md, Tasks.md, Memory.md
.github/workflows/ci.yml
connecthub-backend/Dockerfile, pom.xml, mvnw*
  src/main/java/com/vansh/connecthub/
    ConnecthubBackendApplication.java
    config/ CloudinaryConfig, WebConfig, WebSocketConfig, WebSocketEventListener
    security/ JwtUtils, JwtAuthFilter, SecurityConfig, UserDetailsServiceImpl
    controller/ Auth, User, Task, Chat, ChatGroup, FileUpload, AuditLog
    service/ Auth, User, Task, ChatGroup, FileUpload
    model/ User, Task, Team*, ChatMessage, ChatGroup, MessageReaction, MessageAttachment, BlockedUser, AuditLog
    repository/ * (no TeamRepository)
    enums/ UserRole, TaskStatus, TaskPriority
    constant/AppConstants + utils/AppConstants (duplicate, latter unused)
  src/main/resources/application.properties
  src/test/ (AuthServiceTest, UserServiceTest, TaskServiceTest, UserControllerIntegrationTest)
connecthub-frontend/Dockerfile, nginx.conf, vite.config.js, index.html, package.json
  src/main.jsx, App.jsx, index.css, App.css, setupTests.js
  src/services/ authService, chatService, websocketService
  src/components/ Login, Signup, Chat, TaskBoard, Dashboard, MyWork, Projects, Teams, Profile, AdminDashboard, AuditLog, AuditHistory, Sidebar, TopBar, UnauthorizedFallback, layout/AppLayout, NavigationSidebar, CommandPalette, users/UserManagement
connecthub-db/schema.sql, indexes.sql
connecthub-automation/pom.xml, src/test/.../ BaseE2ETest, KanbanDragAndDropE2ETest, MultiSessionRealtimeChatE2ETest, NeumorphicStylingE2ETest
```

## 4. Workflows
1. **Boot:** `docker compose up --build` → postgres healthy → backend `:8080` → frontend `:80`.
2. **Signup/Login:** `POST /api/auth/signup|register|login` → JWT stored in `localStorage` (+ username/role) → axios `Authorization: Bearer`.
3. **Tasks:** `GET /api/tasks/all`, `POST /create`, `PUT /{id}`, `PUT /{id}/status`, `DELETE /{id}`.
4. **Chat realtime:** SockJS `/ws` → STOMP connect with token → subscribe `/topic/public`, `/topic/user.{me}`, `/topic/group.{g}` → publish `/app/chat.*`.
5. **Files:** `POST /api/chat/files/upload` (multipart) → Cloudinary URL persisted.
6. **CI:** backend `mvn clean test package` (postgres service `password123`) → frontend `npm ci && lint && test && build` → `mvn test-compile` (e2e) → `docker compose config+build`.
