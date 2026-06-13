# School Dashboard — Deep Technical Audit

Audit conducted: 2026-03-05
Scope: `school-dashboard/` only
Audience: You (designer) + any developer you hire
Standard: World-class production SaaS frontend

---

## The 5-Second Summary

The school dashboard is a large, well-designed app that does a lot of things —
but it's been built the way most vibe-coded apps are built: features added on
top of features, experiments left in, nothing cleaned up. The UI looks good.
The architecture underneath is brittle and getting more expensive to maintain
with every new page added.

This document covers what a senior Apple/Google-level frontend engineer would
flag after spending an afternoon reading the code.

---

## 🔴 CRITICAL — Broken or a serious liability right now

### 1. The Login page loads Three.js to show a 3D school building

- **File:** `school-dashboard/src/pages/Login.jsx:5`
- **Code:** `import SchoolBuilding3D from "../components/SchoolBuilding3D";`
- **What it does:** The login page — the first thing any user sees, before
  authentication — loads Three.js + `@react-three/drei` just to render a 3D
  animated school building on the left half of the screen.
- **Why this is a problem:**
  - Three.js is approximately 600KB of JavaScript. This is downloaded before
    anyone can log in.
  - Every user on a slower connection (mobile data, rural internet) waits for a
    3D library before they can even type their password.
  - The 3D school is a decoration. It adds nothing to the login flow.
- **What it should be:** A static image, a simple CSS illustration, or just a
  clean login form. Three.js does not belong on the login page of a school ERP.

---

### 2. AuthContext stores password credentials in localStorage

- **File:** `school-dashboard/src/context/AuthContext.jsx:18-49`
- **Code:**
  ```js
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem("app_credentials");
    if (saved) return JSON.parse(saved);
    // ...
    staffData.forEach(staff => {
      creds[staff.email] = { password: "password123", ... };
    });
  });

  useEffect(() => {
    localStorage.setItem("app_credentials", JSON.stringify(credentials));
  }, [credentials]);
  ```
- **What this is:** A mock authentication system — staff email + password pairs
  stored in `localStorage`. This is from early development and was never
  removed.
- **The actual login calls the backend:** Lines 91-130 show the real login does
  call `POST /api/auth/login`. But the credentials object (with everyone's
  passwords as `"password123"`) is still being written to `localStorage` on
  every session start.
- **Why this matters:**
  - Anyone who opens DevTools → Application → Local Storage sees every staff
    member's email and their stored password.
  - It makes the real auth system confusing — there are now two systems running
    simultaneously.
- **Fix:** Delete the `credentials` state, the `updatePassword` function, and
  all `localStorage.setItem("app_credentials")` calls entirely. The backend JWT
  system is the real one.

---

### 3. console.log fires on every scroll event — 345 total across 45 files

- **What it is:** There are 345 `console.log` calls spread across 45 source
  files. These are not error logs — they are debugging statements that were
  never removed.
- **The worst offender:** `useScrollVisibility.js` — a hook that fires
  `console.log('[useScrollVisibility] Scroll event detected')` on literally
  every scroll event. A user scrolling a list of 100 students will generate
  hundreds of log lines per second in the browser console.
- **Other examples:**
  - `AuthContext.jsx`: logs `'🔑 Login successful, token received'` and
    `'📢 Dispatching user-logged-in event'` on every login
  - `StudentOverview.jsx`: 39 console.log calls
  - `ChatFull.jsx`: 38 console.log calls (2,238 line file)
  - `AddStudent.jsx`: 25 console.log calls
- **Why this matters:**
  - In the browser, any XSS exploit or malicious browser extension can read the
    console output, which includes user tokens, staff data, and system state.
  - It tells anyone watching DevTools exactly how the system works internally.
  - The scroll logger fires hundreds of times per scroll — this is measurable
    performance overhead.
- **Fix:** Delete all `console.log` calls from production code. Keep
  `console.error` for genuine error conditions only.

---

### 4. No error boundaries — one crash kills the entire app

- **What it means:** React apps can be split into sections called "error
  boundaries." If one section crashes (throws an error), only that section
  shows an error message — the rest of the app keeps working.
- **Current state:** There are zero `ErrorBoundary` components anywhere in the
  codebase (a search for "ErrorBoundary" returned no results).
- **What happens today:** If a student's data fails to load, or a component
  throws on a bad API response, the entire dashboard crashes to a blank white
  screen. The admin loses their session context and has to reload the whole
  app.
- **Fix:** Wrap each major section (sidebar, main content area, each page) in
  an ErrorBoundary component. Show a "Something went wrong" message with a
  retry button instead of a blank screen.

---

### 5. The Chat feature has 6 versions, only 1 is used

- **Files in `/pages/messaging/`:**
  - `Chat.jsx` (206 lines) — original version
  - `ChatFull.jsx` (2,238 lines) — the version actually mounted in `index.jsx`
  - `ChatRealtime.jsx` (442 lines) — experiment
  - `ChatSimple.jsx` — experiment
  - `ChatWithPermissions.jsx` — experiment
  - `ChatWithFileUpload.jsx` — experiment
- **What this is:** The chat feature was built, then rebuilt, then rebuilt
  again. Five versions are dead code sitting in the codebase.
- **Why this matters:**
  - `ChatFull.jsx` alone is 2,238 lines — the longest component in the project.
    This is a god component doing everything: messages, socket connection,
    file upload, reactions, voice messages, video calls via PeerJS, search,
    pinning, forwarding, replies. All in one file.
  - Dead chat files inflate the bundle even if they're not actively imported —
    the build tool may still process them.
  - A developer maintaining this cannot know which chat is real.
- **Fix:** Delete `Chat.jsx`, `ChatRealtime.jsx`, `ChatSimple.jsx`,
  `ChatWithPermissions.jsx`, `ChatWithFileUpload.jsx`. Keep only `ChatFull.jsx`
  and break it into smaller components.
- **Status:** Resolved. The five unused variants were removed and `ChatFull.jsx`
  was refactored into `components/`, `hooks/`, and `utils/` subdirectories.

---

## 🟠 HIGH — Will hurt performance, reliability, or trust

### 6. AppContext.jsx is 1,445 lines with hardcoded fake data still inside

- **File:** `school-dashboard/src/context/AppContext.jsx`
- **The two problems:**

  **Problem A — Architecture:** All application state lives in a single React
  context with 20+ `useState` calls. Every time anything changes — a single
  student's data updates, a socket message arrives, a modal opens — every
  component that reads from `useApp()` re-renders. This is the React equivalent
  of rebuilding your whole house every time you open a window.

  **Problem B — Hardcoded data still in production code:**
  - `staffSalaries` state has hardcoded rupee amounts for staff IDs 1–15:
    `{ id: 1, baseSalary: 45000, hra: 4500 }`, etc.
  - `feeHeads` state has hardcoded fee types: `{ name: "Tuition Fee",
    amount: 15000 }`, `{ name: "Transport Fee", amount: 3000 }` etc.
  - `leaveTypes`, `lessonPlans`, `parentRemarks` contain hardcoded fake entries.
  - `payrollHistory` has hardcoded months: `{ month: "November 2025",
    totalPayout: 485000 }`.

  This means even staff who are paying attention will sometimes see fake numbers
  mixed with real data.

- **Fix:**
  - Split AppContext into smaller, purpose-specific contexts:
    `StudentsContext`, `StaffContext`, `FeesContext`, `AttendanceContext`.
    (StudentsContext.jsx and StaffContext.jsx already exist but aren't being
    used — AppContext is doing everything instead.)
  - Remove all hardcoded salary, fee, and payroll data. These must come from
    the API.

---

### 7. Three.js + @react-three/fiber shipped but only used for decorations

- **Status:** Resolved — decorative 3D components and dependencies removed.
- **Files removed:**
  - `AiBlob3D.jsx`
  - `SchoolBuilding3D.jsx`
- **Dependencies removed from `package.json`:**
  - `three`
  - `@react-three/fiber`
  - `@react-three/drei`
- **Resolution:** Both decorative 3D components were deleted and the associated
  libraries were removed from production dependencies, reducing bundle size by
  ~600KB+.

---

### 8. The AI assistant has 7 duplicate components + wrong vendor branding

- **Status:** Resolved — duplicate components removed; branding fixed.
- **Files (removed):**
  - `AiAssistant.jsx`
  - `AiBlob3D.jsx`
  - `AiDockablePanel.jsx`
  - `AiModal.jsx`
  - `AiOrb.jsx`
  - `AiPanelLayout.jsx`
- **Files (retained):**
  - `AiAssistant/AiAssistantPanel.jsx` — overlay panel shell (mounted in `App.jsx`)
  - `pages/AiAssistantPage.jsx` — full chat page route
- **Resolution:**
  - Removed the six duplicate/experimental AI components.
  - Updated footer copy from "ChatGPT can make mistakes" to "School AI assistant can make mistakes. Verify important information." across all i18n locales.

---

### 9. peerjs (video calling library) is a production dependency — for a school admin tool

- **Package:** `peerjs: ^1.5.5` in `dependencies`
- **Where it's used:** `ChatFull.jsx` and `videoCallService.js` — peer-to-peer
  video calling between school staff
- **Why this is unusual:** PeerJS enables browser-to-browser WebRTC video
  calls without a server. This is a complex, high-maintenance feature that
  requires STUN/TURN server infrastructure to work reliably. Building and
  supporting this in a school ERP (when Google Meet and WhatsApp exist) is
  adding significant complexity for a feature that likely won't be used.
- **The reliability problem:** PeerJS's free STUN server (which this app likely
  uses by default) is not reliable for production. Calls will fail on corporate
  networks, behind firewalls, and on mobile data.
- **Fix decision needed:** Either invest properly in WebRTC infrastructure
  (TURN server, ICE candidates, connection state handling) or remove it and
  tell users to use WhatsApp/Meet for video calls.

---

### 10. `index.css` has `chunkSizeWarningLimit: 1000` — warning suppression, not a fix

- **File:** `school-dashboard/vite.config.js`
- **Code:** `chunkSizeWarningLimit: 1000`
- **What happened:** Vite warns when any JS chunk exceeds 500KB. The app's
  chunks were too large (because of Three.js, framer-motion, etc.), so instead
  of reducing the bundle size, the warning threshold was doubled to 1000KB.
- **Why this matters:** The warning exists to tell you something is wrong.
  Hiding the warning doesn't fix the problem. Users on slow connections are
  still downloading 1MB+ of JavaScript.
- **Fix:** Restore `chunkSizeWarningLimit` to 500 (the default). Then
  actually reduce the bundle: remove Three.js, move AI calls to the backend,
  and lazy-load heavy chart components.

---

### 11. Hardcoded Cloudflare tunnel URL in the build config

- **File:** `school-dashboard/vite.config.js`
- **Code:** `allowedHosts: ['duration-speaks-kingdom-jul.trycloudflare.com']`
- **What this is:** Cloudflare Tunnel generates temporary URLs for local
  development access from phones. This URL was added to the build config so
  a mobile device could access the local dev server during testing.
- **Why it matters:** This URL is now permanently hardcoded in the config. The
  tunnel itself has likely expired. The hostname is a meaningless random string
  from a development session. It does nothing in production and confuses any
  developer who reads the config.
- **Fix:** Remove it. If you need mobile dev testing, use your machine's local
  IP address (`192.168.x.x`) instead, which is dynamic and shouldn't be
  committed.

---

### 12. `key={index}` used in lists across 58 files — broken list rendering

- **What it is:** When React renders a list (`array.map()`), each item needs a
  stable `key` prop so React knows which item changed. Using the array index as
  the key (`key={index}`) breaks this when items are added, removed, or
  reordered — React sees the wrong item as having changed and renders
  incorrectly.
- **How many files:** 58 files across the dashboard use `key={index}`.
- **Where it matters most:** Student lists, attendance tables, fee payment
  lists — any list that changes dynamically. If a student is deleted from the
  middle of a list, items after it may briefly show wrong data.
- **Fix:** Use a stable, unique identifier: `key={student._id}`,
  `key={payment._id}`, etc. Every MongoDB document has an `_id` field — use it.

---

### 13. framer-motion used in 16 files for animations that don't need a 340KB library

- **Package size:** framer-motion adds ~340KB to the bundle.
- **Where it's used:** Sidebar, calendars, photo modals, filters panels,
  timetable, onboarding flow, AI components.
- **What it's used for:** Mostly simple transitions — fading in/out, sliding
  panels, basic list animations.
- **The truth:** About 80% of these animations can be done with CSS transitions
  and `@keyframes` at zero bundle cost. CSS transitions are also
  hardware-accelerated by default and don't require JavaScript to run.
- **Fix (partial, not all-or-nothing):** Replace simple fade/slide animations
  with CSS transitions. Keep framer-motion only for the complex gesture-based
  animations that genuinely need it (if any).

---

## 🟡 MEDIUM — Quality and polish issues

### 14. AiAssistantPage is mounted twice in App.jsx

- **File:** `school-dashboard/src/App.jsx`
- **What happens:** `AiAssistantPage` appears once inside the main layout
  routes and once outside them, at the bottom of `App.jsx`. Both are rendered
  simultaneously.
- **Effect:** The AI assistant panel is present in the DOM twice. This means
  two socket connections, two state trees, and any AI response may appear in
  both panels.
- **Fix:** Remove one of the two mounts. Pick where the AI assistant should
  live (floating overlay vs. dedicated page) and commit to one.

---

### 15. AuthContext has a legacy password management system that contradicts real auth

- **File:** `school-dashboard/src/context/AuthContext.jsx`
- **Code:**
  - `updatePassword(email, newPassword)` — updates passwords stored in
    `localStorage`
  - `updateStaffCredentials(staffEmail, newPassword)` — calls `updatePassword`
  - These functions have no effect on the backend — they only update the local
    mock credentials object.
- **Why this is a problem:** If a school admin "resets" a staff member's
  password using any UI connected to these functions, the backend password is
  unchanged. The new password only exists on that one browser, in localStorage.
- **Fix:** Delete `updatePassword` and `updateStaffCredentials`. Password
  changes must go through a backend API endpoint.

---

### 16. The StyleGuide page is routed and accessible in production

- **File:** `school-dashboard/src/App.jsx`
- **Route:** `<Route path="/style-guide" element={<StyleGuide />} />`
- **What it is:** A developer reference page showing all UI components, colors,
  and design tokens. Real school admins should never see this.
- **Why it matters:** Any admin who stumbles onto `/style-guide` sees a page
  that makes no sense. It also reveals your design system internals.
- **Fix:** Remove the route from production routing. If you want to keep it for
  development, guard it with `if (import.meta.env.DEV)`.

---

### 17. StaffListRefactored.jsx and StudentOverviewRefactored.jsx exist alongside the originals

- **Files:**
  - `pages/staffs/StaffList.jsx` (original, used)
  - `pages/staffs/StaffListRefactored.jsx` (newer version, not routed)
  - `pages/students/StudentOverview.jsx` (original, used)
  - `pages/students/StudentOverviewRefactored.jsx` (unused)
- **What happened:** New versions of these pages were started but never finished
  or swapped in. The old versions are still the ones served to users.
- **Fix:** Either finish and deploy the refactored versions, or delete them.
  Having two versions of the same page creates confusion about which is
  authoritative.

---

### 18. Markdown documentation files inside the component folder

- **Files found inside `src/components/` and `src/pages/students/`:**
  - `CAMERA_CAPTURE_README.md`
  - `CAMERA_QUICK_START.md`
  - `PhotoModal.README.md`
  - `PhotoAvatar.DESIGN.md`
  - `StudentRatingSystem.DESIGN.md`
  - `StudentRatingSystem.README.md`
  - `StudentRatingSystem.quickstart.md`
- **Why this is wrong:** Documentation files have no place inside a `src/`
  folder that gets processed by a bundler. They create noise in the component
  directory. Documentation belongs in a `docs/` folder or a wiki — not mixed
  with source code.
- **Fix:** Delete them or move them to a `docs/` folder. These are AI-generated
  session notes masquerading as documentation.

---

### 19. Example and test files shipping in the component folder

- **Files:**
  - `components/PhotoAvatar.example.jsx` — a usage example
  - `components/CameraCaptureExample.jsx` — another example
  - `components/ConflictIndicator.test.jsx` — a single test file
  - `pages/students/components/StudentRatingSystem.example.jsx`
- **Why this is wrong:** Example files and test files should not be in the same
  directory as production components. The build tool may include them in the
  bundle. They create confusion about what's a real component vs. a demo.
- **Fix:** Delete example files. Move test files to a `tests/` folder or
  colocate as `.test.jsx` only if a test runner is configured.

---

### 20. `lottie-react` and `canvas-confetti` are installed but unused

- **Packages:** `lottie-react` and `canvas-confetti` appear in `package.json`
  but no import of either was found in any source file.
- **Why this matters:** Every unused package in `dependencies` is downloaded
  during `npm install`, increases the attack surface for supply-chain
  vulnerabilities, and confuses developers reading the dependencies list.
- **Fix:** `npm uninstall lottie-react canvas-confetti`

---

### 21. The Signup page references a product name that may not be your brand

- **File:** `school-dashboard/src/pages/Login.jsx:51,56`
- **Code:**
  ```
  <span>SchoolSync</span>
  <h1>Welcome to SchoolSync</h1>
  ```
- **What this is:** The login page (and presumably the signup page) calls the
  product "SchoolSync" — not whatever your actual brand name is.
- This may be intentional (if SchoolSync is your brand), but it's worth
  confirming that the brand name is consistent everywhere: login, emails,
  receipts, app store listings.

---

### 22. `express`, `cors`, `body-parser`, and `fs-extra` are in the frontend's package.json

- **File:** `school-dashboard/package.json`
- **Packages in `dependencies`:**
  - `express: ^5.2.1`
  - `cors: ^2.8.5`
  - `body-parser: ^2.2.2`
  - `fs-extra: ^11.3.3`
- **What these are:** Backend/Node.js libraries. They have absolutely no place
  in a Vite/React frontend project. Express is a web server. CORS is a server
  middleware. `fs-extra` is a file system library (the browser has no file
  system access from JS).
- **Why they're there:** Vite bundles them, or tries to — and then either tree-
  shakes them (wastes time) or partially includes them in the browser bundle.
- **Fix:** `npm uninstall express cors body-parser fs-extra` from the
  school-dashboard package.json. These belong only in the backend.

---

### 23. No z-index scale — hardcoded values up to 999999

- **Files:** `PhotoEditorModal.jsx`, `PhotoModal.jsx`, `OnboardingFlow.jsx`,
  `ChatNotificationContext.jsx`, `CookieConsentBanner.jsx` and others
- **What it is:** 18 components use arbitrary Tailwind `z-[*]` values ranging
  from `z-[60]` to `z-[999999]` with no documented layer system. When any two
  stacking contexts conflict, fixing it requires hunting every z-index in the
  codebase.
- **Fix:** A z-index scale is now defined in `index.css @theme` as CSS custom
  properties (`--z-dropdown: 60`, `--z-fixed: 100`, `--z-modal: 300`, etc.).
  Replace `z-[9999]` with `z-[var(--z-modal)]` and so on.

---

### 24. Two button systems coexist — MinimalButton and HeroUI Button

- **Files:** `components/ui/MinimalButton.jsx` + any file importing
  `Button` from `@heroui/react`
- **What it is:** MinimalButton is used in admin pages, HeroUI Button is used
  in modals and drawers. They have different hover/focus/size behaviour so
  the same action looks different on different pages.
- **Fix:** MinimalButton has been updated to use CSS design tokens (no more
  hardcoded `bg-gray-900`). Progressively migrate HeroUI Button usages in
  modals to MinimalButton so one system is canonical.

---

### 25. Sidebar width hardcoded as arbitrary values in 3+ places

- **Files:** `App.jsx:185`, `Topbar.jsx:159`, any place with `ml-[240px]`
  or `ml-[64px]`
- **What it is:** Changing the sidebar width requires editing 3+ files.
  A single change breaks the topbar and content layout independently.
- **Fix:** `--sidebar-width: 240px` and `--sidebar-width-collapsed: 64px`
  are now defined in `index.css @theme`. `App.jsx` and `Topbar.jsx` now
  reference `var(--sidebar-width)`. One edit, everywhere updates.

---

### 26. Recharts components use 11 different hardcoded hex colors

- **Files:** `DashboardCharts.jsx`, `ChartSection.jsx`, `Analytics.jsx`,
  `ClassPerformance.jsx`, `PerformanceDashboard.jsx`, `StudentDashboard.jsx`,
  `StudentOverview.jsx`, `StaffOverviewTab.jsx`, `StudentAcademics.jsx`,
  `OverviewTab.jsx`
- **What it is:** Chart fill and stroke colors like `#8b5cf6`, `#ec4899`,
  `#6b7280` are scattered across 10 component files. Changing the chart color
  palette requires finding and editing each file individually.
- **Fix:** `CHART_COLORS` palette exported from `utils/chartTheme.js`.
  All chart files now import and use `CHART_COLORS.chart1`, `.neutral`, etc.
  Chart colors also mirrored in `index.css @theme` as `--color-chart-*`.

---

### 27. styles/print.css existed but was never imported

- **File:** `src/styles/print.css`
- **What it is:** A print utilities file was written but never imported
  anywhere, making it dead code. The same utilities were duplicated in
  `index.css` (with `!important` added). This meant the canonical version
  silently did nothing.
- **Fix:** `index.css` now imports `styles/print.css` at the top. Duplicate
  rules removed from the global `@media print` block in `index.css`.

---

## 📋 Fix Priority for the Dashboard

### Do before showing to any school
1. [ ] Remove all 345 `console.log` calls — especially the scroll event logger
2. [ ] Remove the `credentials` / `localStorage.setItem("app_credentials")`
       system from AuthContext
3. [ ] Remove Three.js (SchoolBuilding3D, AiBlob3D) from Login page and bundle
4. [ ] Uninstall backend packages from frontend: `express`, `cors`,
       `body-parser`, `fs-extra`
5. [ ] Uninstall unused packages: `lottie-react`, `canvas-confetti`
6. [ ] Remove the `/style-guide` route from production

### Do in first development sprint
7. [ ] Add error boundaries around the main layout and each major page
8. [x] Delete 5 of 6 chat components — keep only `ChatFull.jsx`
9. [ ] Delete 6 of 7 AI components — keep one
10. [ ] Delete StaffListRefactored.jsx and StudentOverviewRefactored.jsx
11. [ ] Delete all `.example.jsx`, `.DESIGN.md`, `.README.md`, `.quickstart.md`
        files from inside `src/`
12. [ ] Remove the duplicate AiAssistantPage mount from App.jsx
13. [ ] Remove the Cloudflare tunnel hostname from vite.config.js
14. [ ] Fix `key={index}` → `key={item._id}` in lists (58 files, highest-risk
        ones: StudentsList, Payments, AttendanceTable)
15. [ ] Fix the wrong vendor branding copy in the AI assistant ("ChatGPT can
        make mistakes")

### Do before scaling
16. [ ] Split AppContext.jsx into domain-specific contexts — remove all
        hardcoded salary/fee/payroll data from it
17. [ ] Replace framer-motion with CSS transitions where possible — reduce
        bundle size
18. [ ] Restore `chunkSizeWarningLimit` to 500 and fix the actual bundle size
19. [ ] Decide on video calling (invest in infrastructure or remove peerjs)
