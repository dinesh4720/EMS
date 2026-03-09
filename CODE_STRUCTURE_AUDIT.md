# EMS — Code Structure Audit

Audit conducted: 2026-03-05
Written for: Designer/Product Owner (no dev knowledge assumed)

Think of your codebase like a building. This report describes what the building
actually looks like right now vs. what a clean, professional building looks like.

---

## What the project is supposed to be

```
EMS/
├── backend/          ← The server. The brain. Handles all data and logic.
├── school-dashboard/ ← Web app for school admins and staff
├── parent-app/       ← Mobile app for parents (React Native / Expo)
├── staff-app/        ← Mobile app for teachers/staff (React Native / Expo)
└── owlin/            ← Your internal analytics tracker
```

Five separate apps, one backend serving all of them. Clean idea.

---

## What it actually looks like right now

```
EMS/
├── backend/
│   ├── server.js              ← 4,298 lines. Should be ~100 lines.
│   ├── server_complete.js     ← A second, mystery server file. What is this?
│   ├── database.js            ← All 40+ database schemas crammed into one file
│   ├── school.db              ← A SQLite database that shouldn't exist
│   │
│   ├── add-staff.js           ← One-off debug script
│   ├── check-sooraj-attendance.js  ← Debug script named after a real person
│   ├── create-sooraj.js            ← Debug script named after a real person
│   ├── delete-sooraj-today-attendance.js ← Same
│   ├── reset-sooraj-attendance.js        ← Same
│   ├── dinesh_summary.mjs              ← Debug script named after a real person
│   ├── test_create_dinesh.mjs          ← Same
│   ├── test_dinesh_api.mjs             ← Same
│   ├── test_dinesh_login.mjs           ← Same
│   ├── verify_dinesh.mjs               ← Same
│   ├── verify-assignments.js           ← More debug scripts
│   ├── verify-timetables.js            ← More debug scripts
│   ├── fix-student-post.js             ← More debug scripts
│   ├── fix-timetables-year.js          ← More debug scripts
│   │   ... (22 loose JS files in root, only 3 should be here)
│   │
│   ├── scripts/               ← 56 debug/fix/check scripts
│   │   ├── check-anil-all-fields.js        ← Named after a real person
│   │   ├── check-anil-class-assignments.js ← Named after a real person
│   │   ├── check-anil-detailed.js          ← Named after a real person
│   │   ├── check-anil-full-data.js         ← Named after a real person
│   │   ├── debug-anil-ids.js               ← Named after a real person
│   │   ├── identify-anil-classes.js        ← Named after a real person
│   │   ├── test-anil-api-endpoint.js       ← Named after a real person
│   │   ... (49 more scripts like this)
│   │
│   ├── models/                ← 40 model files ✓ (this part is fine)
│   ├── routes/                ← 38 route files ✓ (structure is good)
│   ├── services/              ← 14 service files ✓
│   ├── middleware/            ← 7 middleware files ✓
│   └── tests/timetable/       ← 9 test files (only timetable is tested)
│
├── school-dashboard/src/
│   ├── components/            ← 75 component files
│   │   ├── AiAssistant.jsx       ← AI component #1
│   │   ├── AiAssistant/          ← AI component #2 (folder with same name)
│   │   ├── AiBlob3D.jsx          ← 3D animated AI blob
│   │   ├── AiDockablePanel.jsx   ← AI component #3
│   │   ├── AiModal.jsx           ← AI component #4
│   │   ├── AiOrb.jsx             ← AI component #5
│   │   ├── AiPanelLayout.jsx     ← AI component #6
│   │   ├── Antigravity.jsx       ← What is this?
│   │   ├── SchoolBuilding3D.jsx  ← 3D school building (uses Three.js)
│   │   └── ...68 more components
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx         ← Shows fake data from mockData.js
│   │   ├── Analytics.jsx         ← Shows fabricated attendance math
│   │   ├── StyleGuide.jsx        ← Developer reference page (in production!)
│   │   ├── accounts/
│   │   │   ├── Invoices.jsx      ← Hardcoded fake invoices, no backend
│   │   │   └── Expenses.jsx      ← Hardcoded fake expenses, no backend
│   │   └── messaging/
│   │       └── CommunicationLogs.jsx ← Fake data from mockData.js
│   │
│   └── data/
│       └── mockData.js           ← Fake school data powering real UI
│
├── parent-app/
│   └── src/config/index.js       ← API URL hardcoded to http://localhost:3001
│                                    (won't work on any real phone)
│
├── staff-app/
│   └── src/config/index.js       ← Same problem, localhost hardcoded
│
└── owlin/
    ├── server/
    │   ├── index.js              ← Tracker server
    │   └── data.json             ← ALL tracking data stored in one JSON file
    ├── sdk/                      ← The tracker code injected into the dashboard
    └── src/                      ← The Owlin dashboard UI
```

---

## The Problems, Explained Simply

### Problem 1: The backend is a single massive file doing everything

**What it is:** `server.js` is 4,298 lines long. That is the equivalent of a 140-page document where every chapter — chapters on students, fees, attendance, payroll, exams, classes, staff, authentication — is mashed together into one continuous stream with no separation.

**Why it matters:** When something breaks, finding it is like searching a 140-page document with no index. When you add a new feature, it gets dropped somewhere in the middle. When you hire a developer, they quit when they open this file.

**What it should look like:**
```
server.js         ← ~100 lines. Just connects routes together.
routes/
  students.js     ← Everything about students
  fees.js         ← Everything about fees
  attendance.js   ← Everything about attendance
  payroll.js      ← Everything about payroll
  exams.js        ← Everything about exams
```

The routes folder already exists and has 38 files — but the most important student, exam, attendance, and fee logic is still living in `server.js` instead.

---

### Problem 2: All database schemas are in one file

**What it is:** `database.js` contains every single database schema — staff, students, classes, attendance, results, timetables, fees, notifications, intake forms, and more. All in one file.

**Why it matters:** Every time any schema needs to change, a developer has to work inside a file that contains 40 other unrelated schemas. It's like keeping your entire company's filing system in one giant folder.

**What it should look like:** Each schema in its own file in the `models/` folder (which already exists and has some models — but the core ones are still in `database.js`).

---

### Problem 3: 56 debug scripts and 22 loose files in the backend root

**What it is:** While building the system, scripts were created to check specific problems — `check-sooraj-attendance.js`, `create-sooraj.js`, `check-anil-all-fields.js`, `test_dinesh_login.mjs`, etc. These are named after real people (presumably real teachers or staff used for testing).

**Why it matters for SaaS:**
- These contain real people's names baked into the codebase
- Anyone who sees the codebase can see these names
- There are 56 of them cluttering the backend. A new developer cannot tell what is important and what is throwaway
- If `data.json` in Owlin or the real database contains real test data from real people, that is a data privacy issue

**What should happen:** All debug scripts should be deleted. The backend root should contain only: `server.js`, `database.js`, `package.json`, and config files. Nothing else.

---

### Problem 4: 7 AI components doing overlapping things

**What it is:** There are 7 separate AI-related components in the dashboard:
- `AiAssistant.jsx`
- `AiAssistant/AiAssistantPanel.jsx` (a folder with the same name as a file)
- `AiBlob3D.jsx` (a 3D animated blob)
- `AiDockablePanel.jsx`
- `AiModal.jsx`
- `AiOrb.jsx`
- `AiPanelLayout.jsx`

**Why it matters:** This is 7 different attempts at the same feature. The AI assistant was built, then rebuilt, then rebuilt again. All versions are still in the codebase. The bundle of the school dashboard (the file users download) is larger than it needs to be because all 7 are included. A developer maintaining this doesn't know which one is real.

**What should happen:** Pick one AI assistant implementation. Delete the other 6. Remove `Three.js` and the 3D blob — shipping a 3D WebGL rendering library for an AI animation in a school admin tool adds significant load time for no functional benefit.

---

### Problem 5: Owlin stores all data in a single JSON file

**What it is:** Owlin's server stores every click, every page visit, every user action in a file called `data.json`. It loads this entire file into memory when the server starts, and rewrites the whole file every time a new event comes in.

**Why it matters:**
- If a school has 50 staff using the dashboard daily, this file will grow very fast
- The bigger the file gets, the slower every write becomes (it rewrites the whole thing every time)
- If the server crashes mid-write, the entire file can become corrupt and all tracking data is lost
- Owlin currently has no authentication — anyone who finds the Owlin server URL can read all your tracking data

**What it should use instead:** A proper database — either MongoDB (which you already have) or a lightweight option like SQLite (for analytics, this is actually fine). Store the data in structured records, not one growing JSON blob.

---

### Problem 6: Owlin only tracks the school dashboard — not the parent or staff apps

**What it is:** Owlin is integrated into the school dashboard via `useOwlinTracking`. The parent app and staff app have zero Owlin integration.

**Why it matters for your goal (tracking UX to improve it):** The people who will use this most frequently are parents (checking fees, attendance) and teachers (marking attendance, checking timetable). If you can't see how they use the app, you can't improve it. The dashboard is used by a handful of admins. The mobile apps will be used by hundreds of parents and teachers.

**What should happen:** Owlin's SDK needs a React Native version that works in the Expo apps. This is a separate piece of work from the web SDK.

---

### Problem 7: 57 markdown documentation files scattered everywhere

**What it is:** There are 57 `.md` files across the project — in the root, in the backend, in a `MDs/` folder, and as `pendingmd/`. These have names like:
- `CLASS_TEACHER_BUGS_FIXED.md`
- `TIMETABLE_FIXES_SUMMARY.md`
- `SOCKET_AUTH_TIMEOUT_FIX.md`
- `FEE_UX_REWORK_PROGRESS.md`
- `BROWSER_FIX_GUIDE.md`
- `STUDENT_MODULE_IMPACT_ANALYSIS.md`
- etc.

These are AI-generated session notes from vibe-coding sessions. They document what was changed during each conversation.

**Why it matters:**
- They create noise — a new developer can't tell what's current vs. historical
- They sometimes contradict each other (things marked "fixed" in one file are broken in another)
- They are not real documentation — they document *what changed* not *how the system works*
- They will confuse any developer you hire

**What should happen:** Delete all of them. Replace with one `README.md` per app that explains what the app is, how to run it, and how it's structured. That is the only documentation that matters.

---

### Problem 8: A second server file exists doing nothing

**What it is:** `backend/server_complete.js` — a 32-line file that appears to be an orphaned backup or draft of the server entry point. It's not used anywhere.

**Why it matters:** Small thing, but it signals the broader pattern — things get created and never cleaned up. A developer opening the backend folder for the first time now has to figure out which server file is the real one.

---

## What a Clean Version Looks Like

```
EMS/
├── backend/
│   ├── server.js              ← ~100 lines, just mounts routes
│   ├── database.js            ← Just the connection logic
│   ├── package.json
│   ├── .env.example
│   ├── models/                ← One file per model (already exists, move the rest in)
│   ├── routes/                ← One file per feature (already exists, move the rest in)
│   ├── services/              ← Background services (already exists ✓)
│   ├── middleware/            ← Auth, permissions, validation (already exists ✓)
│   ├── config/                ← Environment config (already exists ✓)
│   └── tests/                 ← Tests for every feature (needs to be expanded)
│
├── school-dashboard/src/
│   ├── components/            ← Shared, reusable UI pieces only
│   ├── pages/                 ← One folder per module, all real data
│   ├── services/api.js        ← API calls (already exists ✓)
│   ├── context/               ← App state (already exists ✓)
│   └── hooks/                 ← Custom logic hooks (already exists ✓)
│
├── parent-app/src/            ← Same clean structure
├── staff-app/src/             ← Same clean structure
│
└── owlin/
    ├── server/                ← Use MongoDB not data.json
    ├── sdk/                   ← Web SDK ✓ + React Native SDK (needs building)
    └── src/                   ← Dashboard UI ✓
```

---

## Summary — What This Means for You as a Designer

You have built a lot of the right things. The features are there. The apps are there. Owlin is a genuinely smart idea for a SaaS product. But the code is structured the way a building looks mid-construction — scaffolding everywhere, materials left in corridors, rooms half-built.

**The good news:** The structure problems are fixable without touching how anything looks or works from the user's perspective. Cleaning up the code structure does not change a single pixel of the UI.

**The sequence that makes sense:**
1. Fix the security issues (protect the building)
2. Clean up the structure (organize the building)
3. Replace mock data with real data (make the building functional)
4. Add multi-tenancy (make the building able to house multiple tenants)
5. Deploy properly (open the building to the public)

The structure cleanup (step 2) is something a developer can do while you're working on designs for step 3 onwards — they don't block each other.
