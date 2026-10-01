# ConnectHub — Design (Nexus Workspace UI)

Source of truth: `connecthub-frontend/src/index.css` + `App.css`. Dark futuristic glassmorphism (code calls it neumorphic `neu-*`).

## 1. Design Principles
1. Dark-first canvas with glowing orbs + scanline grid; glass panels float above it.
2. One accent language: cyan primary, violet secondary; semantic red/green/amber only for status.
3. Raised vs pressed: cards raise on hover (glow), inputs/buttons press inward.
4. Dense but breathable: 12–24 px gaps, pill buttons, 18–24 px radii.
5. Never blank-screen: `ErrorBoundary` + `UnauthorizedFallback` + skeletons/empty states.

## 2. UI Components (actual)
- `neu-panel` / `neu-card` — glass surface (`--neu-surface`), 1px glass border, 20–30px blur, raised shadow.
- `neu-btn`, `neu-btn-pill`, `neu-btn-primary` (cyan gradient + glow), danger/ghost variants.
- `NavigationSidebar` + `TopBar` + `AppLayout` shell; `Sidebar.jsx` legacy.
- `TaskBoard` Kanban columns + `TaskDrawer` detail + status drag-drop; `MyWork` assignee filter; `Dashboard` stats (tasks/users/audit).
- `Chat` — channel list, message thread, reactions, typing indicator, file upload button, search, `CommandPalette` (Ctrl+K over tasks/users/audit).
- `UserManagement` table (role/status/delete/invite), `AdminDashboard`, `AuditLog`/`AuditHistory` tables.
- Tests enforce styling: `NeumorphicUI.test.jsx`, `TaskDrawer.test.jsx`, `CommandPalette.test.jsx`, `NeumorphicStylingE2ETest`.

## 3. Typography
- Family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif`; antialiased.
- Scale: `.neu-title` 18 px (600), `.neu-subtitle` 13 px muted, body 13–14 px, headings 22 px in dialogs.
- `color-scheme: dark`; text `#f8fafc`, secondary `#cbd5e1`, muted `#94a3b8/#64748b`.

## 4. Color Palette (from `:root`)
| Token | Value | Use |
|---|---|---|
| `--neu-bg` | `#07090e` | page canvas |
| `--neu-bg-elevated` | `#0b101c` | shell |
| `--neu-surface` | `rgba(13,19,34,.65)` | cards |
| `--neu-surface-hover` | `rgba(19,28,50,.78)` | hover |
| `--neu-surface-inset` | `rgba(6,10,19,.75)` | inputs/wells |
| `--neu-glass-border` | `rgba(255,255,255,.08)` | borders |
| `--neu-glass-border-light` | `rgba(255,255,255,.14)` | emphasis |
| `--neu-accent` | `#00f2fe` | primary / glow |
| `--neu-accent-secondary` | `#a855f7` | secondary |
| `--neu-accent-gradient` | `linear-gradient(135deg,#00f2fe,#38bdf8,#818cf8)` | primary btn |
| `--neu-success` | `#00f5a0` | success |
| `--neu-danger` | `#ff0055` | danger |
| `--neu-warning-border` | `#fbbf24` | warning |
| Shadows | `--neu-shadow-raised/hover/pressed/glow`, `--glass-blur: blur(20px) saturate(180%)` | depth |

Background: 48px grid + 4 radial orbs (cyan 11%, violet 13%, blue 9%, emerald 7%), `background-attachment: fixed`.
