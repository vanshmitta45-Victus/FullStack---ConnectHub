# ConnectHub Automated E2E Testing Suite (Selenium)

This module provides automated browser End-to-End (E2E) testing for the ConnectHub workspace platform using Selenium 4, JUnit 5 Jupiter, AssertJ, and WebDriverManager.

## Test Capabilities

1. **Kanban Drag-and-Drop Mechanics (`KanbanDragAndDropE2ETest`)**:
   - Automates Selenium `Actions` to drag task cards across standard sprint columns (TODO -> IN_PROGRESS -> DONE).
   - Validates drop target activation and state persistence.

2. **Multi-Session Real-Time WebSocket Chat (`MultiSessionRealtimeChatE2ETest`)**:
   - Launches two isolated browser sessions concurrently (Alice and Bob).
   - Verifies that messages sent from Alice's session appear instantaneously in Bob's session via STOMP/WebSocket without a page reload.

3. **Neumorphic Design System Validation (`NeumorphicStylingE2ETest`)**:
   - Evaluates computed CSS properties (`box-shadow`, `border-radius`, background tokens).
   - Ensures visual compliance with Neumorphic UI design tokens (`.neu-panel`, `.neu-btn`, `.neu-input`).

## Running Tests

### Prerequisites
- Java 21 JDK
- Google Chrome installed
- Frontend running at `http://localhost:5173` (or configured via `-Dapp.url=...`)
- Backend running at `http://localhost:8080`

### Execution
Run tests in headless mode (default, suitable for CI/CD):
```bash
mvn test
```

Run tests with visible browser window:
```bash
mvn test -Dheadless=false
```

Specify custom application URL:
```bash
mvn test -Dapp.url=http://staging.connecthub.internal
```
