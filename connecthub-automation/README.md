# ConnectHub Automation — Unified SDET Suite (TestNG + JUnit5)

One module, two layers, same live app:

| Layer | Package | Stack | What it proves |
|---|---|---|---|
| **Unified framework** (flagship) | `com.sdet.framework` | TestNG + Cucumber + Selenium 4 + REST Assured + Allure | UI + API + DB in one flow, JWT/RBAC, parallel Grid-ready runs |
| **Legacy E2E** (green) | `com.vansh.connecthub.automation` | JUnit5 + AssertJ + Selenium Actions | drag-and-drop Kanban, multi-session realtime chat, Neumorphic CSS tokens |

## Suites

| Suite file | Tests | Needs |
|---|---|---|
| `testng-connecthub.xml` (default `mvn test`) | 12: 8 API+DB + 2 UI + 2 BDD | backend + postgres + frontend |
| `testng-connecthub-api.xml` | 8 API+DB only, no browser | backend + postgres |
| `testng.xml` | SauceDemo/ReqRes demo suites incl. Cucumber BDD (portfolio fallback) | internet |
| Legacy JUnit5 (`java -jar junit-console-standalone.jar ...`, see below) | 3: realtime chat, kanban drag-drop, styling | backend + frontend + seeded users |

## Run

```bash
# stack first (from repo root): postgres on host :5434 (local :5432 is taken by system Postgres)
docker compose up -d postgres backend
cd connecthub-frontend && npm run dev   # :5173, only for UI tests

cd connecthub-automation
mvn test                                           # full ConnectHub suite (10 tests)
mvn test -DsuiteXmlFile=testng-connecthub-api.xml  # API+DB only, no browser
```

Config lives in `src/test/resources/config.properties`; any key can be overridden
with `-Dkey=value` (used by CI for the standard `:5432` port):
`mvn test -DsuiteXmlFile=testng-connecthub-api.xml -Ddb.url=jdbc:postgresql://localhost:5432/connecthub_db`

## Coverage highlights

- Auth: signup → login returns JWT → wrong password is 401
- Tasks: create → list contains it → TODO→IN_PROGRESS→DONE → unauthenticated `/tasks/all` is 401/403
- E2E: API-created task renders as Kanban card in a real browser; Postgres row asserted via JDBC; cleanup via API
- Infra: ThreadLocal driver (parallel-safe), 1920x1080 headless viewport (below-fold cards), token-inject login fast-path, Allure + failure screenshots, Selenium Grid compose (`docker-compose.grid.yml`)

## Legacy E2E (JUnit5) prerequisites

- Backend `:8080`, frontend `:5173`, seeded users (`vansh` / `demo_user` / `alice_qa` /
  `bob_qa` / `qa_engineer` / `designer_qa`, all `Password123!` — sign up once via
  `POST /api/auth/signup`)
- Headless by default; visible browser: `-Dheadless=false`; custom URL: `-Dapp.url=...`
- Surefire here is pinned to the TestNG provider, so JUnit5 runs via the console
  launcher (one-time download, then build the test classpath once):

```bash
cd connecthub-automation
Invoke-WebRequest -Uri "https://repo1.maven.org/maven2/org/junit/platform/junit-platform-console-standalone/1.11.3/junit-platform-console-standalone-1.11.3.jar" -OutFile junit-console-standalone.jar
mvn dependency:build-classpath -Dmdep.outputFile=cp.txt -Dmdep.includeScope=test
java -jar junit-console-standalone.jar execute --class-path "target/test-classes;target/classes;src/test/resources;$(Get-Content cp.txt -Raw)" --select-package com.vansh.connecthub.automation
```

## Grid (cross-browser)

```bash
docker compose -f docker-compose.grid.yml up -d selenium-hub chrome-node   # add firefox-node for FF
mvn test -DsuiteXmlFile=testng-connecthub.xml -Dgrid.enabled=true -Dgrid.url=http://localhost:4444/wd/hub
```
