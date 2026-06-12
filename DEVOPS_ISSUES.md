# EMS Developer & DevOps Issues

Audit conducted: 2026-03-05
Audience: Developer / DevOps

These are technical problems a developer or DevOps engineer would catch.
They are separate from the security issues (CRITICAL_ISSUES.md) and product gaps (PRODUCT_ISSUES.md).

---

## 🔴 CRITICAL

### 1. Live AI API keys committed directly into the frontend .env file
- **File:** `school-dashboard/.env`
- **What's in it:**
  ```
  VITE_GROQ_API_KEY=gsk_bc9sokensv8AgaZ2ij6TWGdyb3FY...
  VITE_GEMINI_API_KEY=AIzaSyCgOFqLBI8tt4Iz6JRTXnQw...
  ```
- **Why this is catastrophic:** `VITE_*` variables are baked directly into the JavaScript bundle at build time. Anyone who opens the browser DevTools, or downloads the built JS file, can see these keys in plain text. These are **live, billable API keys**. Anyone who finds them can use your Groq and Google Gemini quota — potentially running up hundreds of dollars in charges.
- **Fix:** AI API calls must go through your backend, not directly from the browser. The frontend should call your own server (`/api/ai/chat`), which then calls Groq/Gemini with the key stored server-side in an environment variable that is never exposed to the client.

---

### 2. `JWT_SECRET` is completely missing from the deployment config and `.env.example`
- **Files:** `backend/render.yaml`, `backend/.env.example`
- **What's missing:** `render.yaml` defines `MONGODB_URI`, `PORT`, and Cloudinary keys — but no `JWT_SECRET`. The `.env.example` also has no mention of it.
- **Why this matters:** When someone deploys this to Render following the config file, `JWT_SECRET` will be undefined. The server falls back to `'your-secret-key-change-in-production'` — a publicly known string. Every JWT token becomes forgeable. This will happen silently with no warning.
- **Fix:** Add `JWT_SECRET` to `render.yaml` (with `sync: false` so it's set manually in the dashboard) and to `.env.example` with instructions to generate a proper random secret.

---

## 🟠 HIGH

### 3. The entire student list is fetched at once with `limit=1000`
- **File:** `school-dashboard/src/services/api.js:151`
- **Code:** `request('/students?limit=1000')`
- **Comment in code:** `// FIXED: Increase limit to 1000 to fetch all students (pagination was causing missing students)`
- **What happened:** Pagination was implemented on the backend correctly (limit 50, with pages). When the frontend couldn't display all students, the "fix" was to bypass pagination entirely by requesting 1000 records at once. This is the wrong fix.
- **Why it matters:** A school with 800 students will send 800 full student records (including fee status, parent details, etc.) over the network on every page load. This will make the dashboard slow and expensive to run. At 1200 students it will become noticeably broken.
- **Fix:** Fix the underlying UI to work with paginated data — search, filter server-side, and only load the students the current view actually needs.

---

### 4. N+1 database query on the staff list endpoint
- **File:** `backend/server.js:819-821`
- **Code:**
  ```js
  const staff = await Staff.find()... // 1 query
  const formatted = await Promise.all(staff.map(async s => {
    const assignedClass = await Class.findOne({ classTeacherId: s._id }); // 1 query PER staff member
  }))
  ```
- **What this means:** If the school has 40 staff members, loading the staff list runs 41 database queries (1 for staff + 1 per person to find their class). At 100 staff, it's 101 queries. This is called an N+1 query and it's a classic performance killer.
- **Fix:** Replace with a single aggregation query or a single `Class.find({ classTeacherId: { $in: staffIds } })` lookup, then map the results in memory.

---

### 5. 58 `console.log` statements in `server.js` alone — 43 frontend files with debug logs
- **Backend:** 58+ `console.log` / `console.warn` statements in `server.js`
- **Frontend:** 43 separate files with `console.log` calls
- **Why this matters:**
  - Every request to the backend logs auth tokens (partially), user IDs, and internal state to stdout. On a hosted server like Render, these logs are stored and visible to anyone with dashboard access.
  - The auth middleware logs: `🔐 Auth middleware - Header: Bearer [token prefix]...` on every single API call. This is thousands of log entries per day.
  - In the browser, every user's console shows internal state, API responses, and debugging info — useful for an attacker trying to understand the system.
  - Log storage costs money on paid logging platforms.
- **Fix:** Replace `console.log` with a proper logging library (e.g., `winston` or `pino`) that respects log levels. Debug logs should only appear when `LOG_LEVEL=DEBUG`. Production should only log warnings and errors.

---

### 6. The staff attendance route has two completely separate implementations
- **File 1:** `backend/routes/staffAttendance.js` — a full route file with all attendance endpoints
- **File 2:** `backend/server.js:1936-2040` — duplicate staff attendance routes (`/api/staff-attendance/:staffId`, `/api/staff-attendance/date/:date`, `POST /api/staff-attendance`, `GET /api/staff-attendance`)
- **Why this matters:** Both sets of routes are mounted and active simultaneously. Changes made to one don't affect the other. Bugs fixed in one will still exist in the other. It's impossible to know which endpoint the frontend is actually hitting.
- **Fix:** Remove the duplicate routes from `server.js` entirely. Keep only the route file.

---

### 7. Frontend loads ALL staff, students, and attendance data on every login
- **File:** `school-dashboard/src/context/AppContext.jsx:99-103`
- **Code:** On mount, it simultaneously fetches all staff, all students (1000 limit), all classes, and all staff attendance records
- **Why this matters:** A teacher logging in to mark attendance for their one class is downloading the entire school's data — every student, every staff member, all attendance history. This is slow, wastes bandwidth, and exposes data to users who don't need it (a teacher shouldn't receive all student records for classes they don't teach).
- **Fix:** Fetch only what the current user's role and view needs. A teacher should only load their own timetable and their assigned classes. Admin gets broader access but still paginated.

---

### 8. Only timetable features have tests — everything else has zero test coverage
- **Tests that exist:** `backend/tests/timetable/` — 9 test files, all for timetable logic
- **Tests that don't exist:** Student CRUD, fee payments, attendance, authentication, payroll, results, staff management, parent portal — none
- **Why this matters:** Every time a change is made to the codebase — by you, by an AI, by a contractor — there is no safety net to catch if something breaks. Fee calculation logic, attendance marking, and result entry are all running without any verification. A subtle bug could corrupt student records for weeks before anyone notices.
- **Fix:** At minimum, write tests for: login flow, fee payment creation, student CRUD, and attendance marking. These are the core operations the school depends on daily.

---

## 🟡 MEDIUM

### 9. The `render.yaml` deployment config is incomplete — multiple services are missing
- **File:** `backend/render.yaml`
- **What's defined:** Only the backend Node.js server
- **What's missing:** No config for the school dashboard frontend deployment, no config for the parent app, no database backup jobs, no health check endpoint definition, no environment variable for `JWT_SECRET` or `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` (payment gateway)
- **Why this matters:** Deploying the full system requires manual steps that aren't documented. A new developer (or you six months from now) won't know how to set it up correctly.
- **Fix:** Complete `render.yaml` with all services. Add all required environment variables with `sync: false`. Add a static site service for the frontend.

---

### 10. The project has 5 separate applications with no orchestration
- **Applications:** `backend`, `school-dashboard`, `parent-app`, `staff-app`, `owlin`
- **Problem:** There is no `docker-compose.yml`, no root-level script to start all services, no `Procfile`, no monorepo tooling (Turborepo, Nx, etc.). To run the full system locally, a developer needs to manually start 5 separate processes in 5 separate terminals.
- **Why this matters:** Onboarding a new developer is painful. Setting up a CI/CD pipeline that tests all apps together is nearly impossible. The apps can drift out of sync with each other (e.g., the parent app uses a different React version than the dashboard).
- **Fix:** Add a root `package.json` with workspace scripts (`npm run dev` starts everything). Consider a `docker-compose.yml` for local development.

---

### 11. The `owlin` sub-project appears to be a separate analytics/tracking tool inside the same repo
- **Directory:** `/owlin/` — contains its own frontend, server, and SDK
- **What it is:** A click/user behavior tracker with its own Express server, database (`data.json`), and React frontend
- **Why this matters:** It's an entirely separate product embedded inside your school ERP repo. It has its own `node_modules`, its own server, and stores data in a flat JSON file (`owlin/server/data.json`). It's unclear if it's integrated with the EMS or just living alongside it. This creates confusion about what the repo actually is.
- **Fix:** Documented the ownership and repository boundary in `owlin/OWNERSHIP.md`. Owlin remains a bounded subsystem inside the EMS monorepo for now; extraction to its own repository is deferred until `school-dashboard/owlin-sdk/` is consolidated onto `owlin/sdk/` and a publishing/deployment path is defined.

---

### 12. The AI assistant calls external AI APIs directly from the browser with hardcoded model names
- **File:** `school-dashboard/src/services/aiService.js`
- **Issues:**
  - Calls Groq and Gemini directly from the client (API keys exposed — see Issue #1)
  - Uses hardcoded model names: `llama-3.3-70b-versatile`, `whisper-large-v3-turbo`, `gemini-2.5-pro`
  - The footer says "ChatGPT can make mistakes" — copy-pasted from a different product, wrong AI vendor
  - No content filtering — users can ask the AI anything using the school's API quota
- **Fix:** Proxy all AI calls through the backend. Add a system prompt that constrains the AI to school-related questions. Fix the branding. Store model names in config, not hardcoded strings.

---

### 13. `school.db` SQLite file is not in `.gitignore` properly
- **The root `.gitignore` has `*.db`** — which should exclude it
- **But the file exists in the repo** at `backend/school.db` and is being tracked
- **Why:** The file was likely committed before the `*.db` rule was added, so git continues to track it
- **Fix:** `git rm --cached backend/school.db` to stop tracking it, then commit that removal. The `*.db` rule in `.gitignore` will then prevent it from coming back.

---

### 14. No health check endpoint is defined
- **What's missing:** There is no `/health` or `/api/health` endpoint that returns the database connection status, uptime, and version
- **Why this matters:** Render (and most hosting platforms) use health checks to decide if your app is running. Without one, Render uses the root path (`/`), which for an API server returns a 404 — potentially causing unnecessary restarts. You also have no way to programmatically verify the system is alive and the database is connected.
- **Fix:** Add a `GET /health` endpoint that returns `{ status: 'ok', db: 'connected', uptime: process.uptime() }`.

---

## 📋 Fix Priority Order

### Fix before going live
1. [ ] Move AI API calls to the backend — remove `VITE_GROQ_API_KEY` and `VITE_GEMINI_API_KEY` from the frontend entirely
2. [ ] Add `JWT_SECRET` to `render.yaml` and `.env.example`
3. [ ] Remove duplicate staff attendance routes from `server.js`
4. [ ] Add a `/health` endpoint for hosting platform checks

### Fix in first month
5. [ ] Fix the `limit=1000` student fetch — restore proper pagination in the UI
6. [ ] Fix the N+1 query on the staff list endpoint
7. [ ] Replace `console.log` with a proper logging library with log levels
8. [ ] Write tests for: login, fee payment, attendance marking, student CRUD

### Fix before scaling
9. [ ] Stop loading all data on login — fetch per-role, per-view
10. [ ] Complete `render.yaml` with all services and environment variables
11. [ ] Add a root orchestration script or `docker-compose.yml`
12. [x] Decide what `owlin` is and document its ownership/boundary (`owlin/OWNERSHIP.md`); extraction to its own repo is deferred until SDK consolidation is complete
13. [ ] Add content filtering and proper backend proxying to the AI assistant
14. [ ] Remove `backend/school.db` from git tracking
