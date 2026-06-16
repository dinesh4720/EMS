# Owlin — Ownership & Repository Boundary

> Issue reference: `DEVOPS_ISSUES.md` #11 — "The `owlin` sub-project appears to be a separate analytics/tracking tool inside the same repo."
> Status: **Documented / Bounded in place** (not extracted to a separate repository).

## 1. What Owlin is

Owlin is the **internal product-analytics subsystem** for EMS. It is not a separate product or a third-party service; it ships inside the EMS monorepo so that dashboard analytics can evolve in lock-step with the apps that consume it.

It has three parts:

| Part | Location | Purpose |
|------|----------|---------|
| Tracking SDK | `owlin/sdk/` | Browser SDK that collects clicks, inputs, navigation, API calls, errors, and sessions. |
| Collector server | `owlin/server/` | Express + Socket.IO service that receives events and persists them. |
| Analytics dashboard | `owlin/src/` | React dashboard for inspecting events, users, sessions, and errors. |

## 2. Repository boundary

Owlin lives under the `owlin/` directory and is treated as a **logical workspace package** of the EMS monorepo.

```text
EMS monorepo
├── school-dashboard/     ← currently the only app integrated with Owlin
├── parent-app/           ← not integrated
├── staff-app/            ← not integrated
├── owlin/
│   ├── sdk/              ← workspace package: @owlin/tracker-sdk
│   ├── server/           ← standalone collector (run independently)
│   └── src/              ← analytics dashboard (run independently)
└── package.json          ← lists "owlin" in npm workspaces
```

### What belongs to Owlin

Anything under `owlin/` is owned by the Owlin subsystem:

- Event schema, collectors, and masking rules in `owlin/sdk/`
- Collector server routes, storage, and WebSocket events in `owlin/server/`
- Analytics UI pages, hooks, and services in `owlin/src/`
- Owlin-specific documentation (`owlin/README.md`, this file, etc.)

### What does **not** belong to Owlin

- Application-specific tracking setup code, e.g. `school-dashboard/src/hooks/useOwlinTracking.js`
- Application-specific `.env` variables such as `VITE_OWLIN_ENDPOINT` and `VITE_OWLIN_API_KEY`
- The duplicate SDK copy at `school-dashboard/owlin-sdk/` (see "Known duplication" below)

## 3. Current integration status

| App | Status | Notes |
|-----|--------|-------|
| `school-dashboard` | **Integrated** | Uses `@owlin/tracker-sdk` via `file:owlin-sdk`; initialization and user/session identify logic live in `school-dashboard/src/hooks/useOwlinTracking.js`. |
| `parent-app` | Not integrated | Planned for future expansion if product analytics are needed there. |
| `staff-app` | Not integrated | Planned for future expansion if product analytics are needed there. |

The collector server is **not** part of the main EMS-backend deployment; it is started separately (`npm run dev:owlin:server` or `cd owlin/server && npm run dev`).

## 4. Known duplication

There are currently two copies of the Owlin tracking SDK in the repo:

1. **`owlin/sdk/`** — the canonical workspace package (named `@owlin/tracker-sdk`).
2. **`school-dashboard/owlin-sdk/`** — the copy that `school-dashboard` actually consumes today (`@owlin/tracker-sdk: "file:owlin-sdk"`).

This duplication is a known boundary issue. The short-term fix documented here makes the situation explicit. The longer-term path is to consolidate on `owlin/sdk/` as the single source of truth and remove `school-dashboard/owlin-sdk/` once the dashboard's integration has been migrated and tested.

## 5. Ownership

| Area | Owner | Escalation |
|------|-------|------------|
| `owlin/sdk/` collectors, schema, masking | `@frontend-dev` (with `@devops` for packaging) | `@tech-lead` |
| `owlin/server/` deployment, env vars, scaling | `@devops` | `@tech-lead` |
| `owlin/src/` analytics dashboard UI/UX | `@frontend-dev` | `@ui-ux-lead` |
| Integration wiring in `school-dashboard` | `@frontend-dev` | `@tech-lead` |
| Decision to extract Owlin to its own repo | `@tech-lead` + `@devops` | — |

## 6. Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-12 | Keep Owlin in the EMS monorepo and document its boundary. | Extraction to a separate repository would require CI/CD, package publishing, and coordinated migration of `school-dashboard/owlin-sdk/`. That work is deferred until product prioritizes it. |

## 7. Operational notes

### Local development

```bash
# Install all workspace dependencies (includes owlin)
npm run bootstrap

# Start the collector server
npm run dev:owlin:server

# Start the analytics dashboard
npm run dev:owlin
```

### Environment variables

The collector server uses variables from `owlin/server/.env.example`. The dashboard client uses variables from `owlin/.env.example`. `school-dashboard` uses `VITE_OWLIN_ENDPOINT` and `VITE_OWLIN_API_KEY` to point at a running collector.

### Data storage

`owlin/server/` currently stores events in a local JSON file (`data.json`) for development. A production deployment must replace this with a persistent database (e.g. SQLite/LibSQL, PostgreSQL, or MongoDB).

## 8. Future extraction criteria

Owlin should be moved to its own repository only when **all** of the following are true:

1. `school-dashboard/owlin-sdk/` has been removed and `school-dashboard` consumes `owlin/sdk/` directly.
2. `@owlin/tracker-sdk` is published to a private or public package registry.
3. `owlin/server/` has a documented production deployment path independent of EMS-backend.
4. A decision has been made on whether `parent-app` and `staff-app` will integrate with Owlin.

Until then, Owlin remains a bounded but co-located subsystem of the EMS monorepo.
