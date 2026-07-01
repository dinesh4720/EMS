# Dashboard Canonical Patterns

One way to do each recurring thing. This document records the **canonical choice**
for the cross-cutting concerns in `school-dashboard/`, plus the known holdouts to
migrate. It was produced during the 2026-06 cleanup sprint and is evidence-based —
every claim below was verified against the source at the time of writing.

> If you are adding a new screen, follow the "Canonical" column. If you are
> touching a "Holdout", migrate it toward canonical in the same change.

---

## 1. Data fetching (reads)

**Canonical:** `request(endpoint, options)` from `services/api/core.js` → a domain
API module (`services/api/{students,staff,academics,classes,fees,…}.js`) →
consumed either through **TanStack Query** (`useQuery` / `lib/usePaginatedQuery.js`)
for cached, shared server state, or through a feature hook that calls the domain
API inside an `AbortController`-guarded `useEffect` for screen-local state.

- `request()` already handles: auth headers, 401 refresh with in-flight dedup,
  concurrent-GET dedup, `Retry-After` backoff, and **rate-limiting/batching**.
- **`utils/requestQueue.js` is NOT a competing fetch/cache layer.** It is the
  rate-limit queue used *internally* by `request()` (its only non-test importer is
  `services/api/core.js`). Do not call it directly from components; call the domain
  API (which goes through `request()`).
- Prefer **TanStack Query** when the same data is read by multiple components or
  benefits from caching/refetch/`keepPreviousData` (16 files do this today, e.g.
  `pages/students/hooks/useStudentsListData.js`). A plain feature hook
  (e.g. `pages/classes/hooks/useAttendance.js`, `pages/settings/hooks/useTrashSettings.js`)
  is acceptable for screen-local, non-shared data.

**Avoid:** raw `fetch()` in components/pages — it bypasses refresh-dedup, retry,
and rate limiting. See Holdouts (§7).

## 2. Mutations (create / update / delete)

**Canonical:** call the domain API method (which wraps `request()` with the right
method/body) from an action handler in a feature hook; surface success/error with
`react-hot-toast`; refresh affected reads (refetch the query, or re-run the hook's
loader). Use `useMutation` when you want optimistic updates / query invalidation.

**Avoid:** mutating context state directly and hoping a re-render reflects the
server; always reconcile against the API response.

## 3. Socket access

**Canonical:** the **enhanced** socket service —
`services/socketServiceEnhanced.js`, obtained via `getSocketService()` (or the
`socketServiceEnhanced` named export from `services/index.js`). Real-time
notification fan-out is centralized in `context/ChatNotificationContext.jsx`.

- ✅ Verified: **zero direct `io()` calls** exist in pages/components — the only
  `io()` call is inside the service itself.
- The legacy `services/socketService.js` was **deleted** in this sprint (it had no
  importers); the barrel re-export was removed. Do not reintroduce a second socket
  service.

## 4. Auth

**Canonical:** `context/AuthContext.jsx` is the **single source of truth** for the
authenticated user; tokens live in httpOnly cookies + `utils/authSession.js`.

- ✅ Verified: the old `app_credentials` localStorage mock (staff email/password
  pairs) is **gone**. The only remaining reference is defensive cleanup in
  `utils/authSession.js` (`localStorage.removeItem('app_credentials')`) that purges
  the stale key from older sessions — keep it.
- Never store passwords or credential maps client-side. Password changes go through
  a backend endpoint, not a local mock.

## 5. Forms & validation

**Canonical:** `react-hook-form` + `zod` via the `useZodForm` hook, with schemas in
`validators/` (e.g. `validators/formSchemas.js`). Zod is the project standard —
**do not use Joi** (see root `CLAUDE.md`).

- ~15 files use RHF/zod today. Some older forms still use ad-hoc `useState` +
  manual validation — these are **holdouts**: migrate opportunistically, don't
  rewrite en masse. Client schema should mirror the backend Zod schema.

## 6. Error handling

**Canonical, layered:**
- **Render-time crashes** → wrap sections in `components/ui/ErrorBoundary` (e.g.
  `SettingsErrorBoundary`, the App-level boundary) so one failure doesn't blank the
  app.
- **Data-fetch failures** → the four-state rule: render `ErrorState` (with retry),
  never a blank screen or bare spinner (see root `CLAUDE.md` / `DESIGN_SYSTEM.md`).
- **Action failures** → `react-hot-toast` for user feedback.
- **Logging** → `utils/logger` (`logger.warn` / `logger.error`), which sanitizes
  secrets and is installed as a console bridge in `utils/bootstrapLogging.js`.
  Prefer `logger.*` over `console.*` in new code (existing `console.*` is already
  routed through the sanitizing bridge, so it is not a security leak).

---

## 7. Known holdouts (flagged, not yet migrated)

These deviate from canonical. They are **documented, not fixed**, to avoid
behavior risk in a refactor-only sprint — migrate them in dedicated changes.

| Area | Files | Note |
|------|-------|------|
| Raw `fetch()` in pages | `pages/Signup.jsx`, `pages/ResetPassword.jsx` | **Pre-auth** endpoints (no token yet) — lowest priority, arguably justified. |
| Raw `fetch()` in pages | `pages/reports/ExportCenter.jsx`, `pages/data-tools/GovtExport.jsx`, `pages/data-tools/BulkImportHistory.jsx`, `pages/data-tools/BulkImportForm.jsx` | Authenticated calls building `${API_URL}` + manual headers — should move to `request()` / a domain API module so they get refresh-dedup, retry, and rate limiting. |
| Ad-hoc form state | Various older forms | Migrate to `useZodForm` + a `validators/` schema when touched. |
| Duplicate `trashApi` | `pages/settings/utils/trashApi.js` vs `services/api/staff.js` | Two near-identical trash API clients. Consolidate into the `services/api` one. |

> Verification commands (re-run to check drift):
> ```bash
> rg -n "[^.]fetch\(" src/pages/        # raw fetch in pages (should trend to 0)
> rg -n "\bio\(" src/                   # direct socket (should stay at service only)
> rg -n "app_credentials" src/          # mock auth (only the cleanup line in authSession.js)
> ```
