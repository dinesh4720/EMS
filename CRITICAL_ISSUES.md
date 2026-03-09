# EMS Critical Issues

Audit conducted: 2026-03-05

---

## 🔴 CRITICAL — Fix immediately

### 1. Firebase Service Account Key committed to git
- **File:** `emss-4fd81-firebase-adminsdk-fbsvc-6b0da3db14.json` (tracked in git history)
- **Risk:** Contains a private RSA key granting full Firebase admin access. Anyone with repo access can compromise the entire Firebase project.
- **Fix:**
  1. Revoke and regenerate the key in Firebase Console immediately
  2. Add the file to `.gitignore`
  3. Remove it from git history: `git filter-repo --path emss-4fd81-firebase-adminsdk-fbsvc-6b0da3db14.json --invert-paths`

---

### 2. ~35 of 86 routes have no authentication

In `backend/server.js` alone, the following sensitive routes have **zero auth middleware**:

| Route | Line | Risk |
|---|---|---|
| `PUT /api/school-settings` | 1721 | Anyone can modify school configuration |
| `POST /api/fee-structure` | 1814 | Anyone can create fee structures |
| `POST /api/fee-structure/apply-to-students` | 1845 | Anyone can assign fees to any student |
| `POST /api/results/bulk` | 2703 | **Anyone can modify student exam results** |
| `POST /api/exams` | 2574 | Anyone can create exams |
| `PUT /api/exams/:id` | 2611 | Anyone can edit exams |
| `DELETE /api/exams/:id` | 2645 | Anyone can delete exams |
| `PUT /api/staff-id-config` | 1663 | Anyone can change ID number config |
| `POST /api/staff-attendance` | 1982 | Anyone can mark staff attendance |
| `POST /api/students/:id/fix-documents` | 778 | Anyone can modify student documents |
| `GET /api/staff/:id/classes` | 903 | Staff class data exposed without auth |

**Route files missing `authenticate` entirely:**
- `backend/routes/studentFees.js` — all fee payment/discount/init endpoints
- `backend/routes/staffAttendance.js` — all staff attendance endpoints
- `backend/routes/feeHeads.js` — fee head management
- `backend/routes/feeSettings.js` — fee settings management
- `backend/routes/notifications.js` — notification data
- `backend/routes/calendarEvents.js` — calendar data

- **Fix:** Add `authenticate` middleware to all non-public mutation routes.

---

### 3. Fee payment creation endpoint has no authentication
- **File:** `backend/routes/fees.js:35`
- **Route:** `POST /api/payments`
- **Risk:** Anyone can record a fake fee payment. The payment is then broadcast via Socket.IO as a real event to all connected clients.
- **Fix:** Add `authenticate` (and ideally `checkPermission('fees', 'create')`) to this route.

---

### 4. Hardcoded fallback JWT secret
- **File:** `backend/middleware/auth.js:4`
- **Code:** `const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';`
- **Risk:** If `JWT_SECRET` is not set in `.env`, the fallback string is publicly known. An attacker can forge valid JWT tokens and impersonate any user including admins.
- **Fix:** Remove the fallback entirely. Throw an error on startup if `JWT_SECRET` is missing. Use a cryptographically random 256-bit secret.

---

## 🟠 HIGH — Fix before going to production

### 5. Academic year '2024-25' hardcoded in ~320 places
- **Backend occurrences:** 263
- **Frontend occurrences:** 56
- **Affected files include:** `backend/routes/fees.js`, `backend/routes/studentFees.js`, and many more
- **Risk:** When the academic year changes to `2025-26`, fee lookups, attendance records, and student data queries will silently return empty or wrong results. The constant `CURRENT_ACADEMIC_YEAR` exists in `backend/utils/constants.js` but is being bypassed everywhere.
- **Fix:** Replace all `|| '2024-25'` and `'2024-25'` literals with the imported `CURRENT_ACADEMIC_YEAR` constant. Add a school settings endpoint to make it configurable from the UI.

---

### 6. `server.js` is 4,298 lines — monolithic and unmaintainable
- **File:** `backend/server.js`
- **Risk:** Auth middleware is being forgotten on new routes because the file is too large to review. Student CRUD, attendance, fees, exams, results, classes, and staff logic all live in a single file despite separate route files existing.
- **Fix:** Extract all route handlers into their own files in `backend/routes/`. `server.js` should only mount routers and configure middleware.

---

### 7. `node_modules` committed to git
- **Commits:** `cc255276`, `2dcab315`, `7c6a4405`
- **Risk:** Bloats the repo, makes `git clone` extremely slow, masks supply-chain risks, and creates merge conflicts on dependency updates. The `.gitignore` correctly excludes `node_modules/` but they were force-added anyway.
- **Fix:**
  1. Remove `node_modules` from tracking: `git rm -r --cached node_modules`
  2. Ensure `.gitignore` entries are correct
  3. Commit the removal

---

### 8. Rate limiting is effectively disabled
- **File:** `backend/server.js:175-179`
- **Code:**
  ```js
  skip: (req) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    return isDevelopment || isLocalhost || ...
  }
  ```
- **Also:** General rate limit is 3,000 req/15min (was increased 10× from 300 "for development")
- **Risk:** Rate limiting will be bypassed in dev and on localhost. These dev-mode settings will likely ship to production unchanged, leaving login and API endpoints open to brute force.
- **Fix:** Remove the `isDevelopment` and `isLocalhost` skip conditions. Restore the auth limiter to a sane limit (e.g., 10 login attempts per 15 min). Keep the general limit reasonable (300–500 req/15min).

---

### 9. SQLite `school.db` sitting in the backend folder
- **File:** `backend/school.db`
- **Risk:** The project uses MongoDB. This is a leftover SQLite file from early development. It is not in `.gitignore` and may contain real school data. It's confusing and a data leak risk.
- **Fix:** Delete the file. Add `*.db` to `.gitignore`.

---

## 🟡 MEDIUM — Address before launch

### 10. `strict: false` on the Staff schema
- **File:** `backend/database.js:135`
- **Code:** `}, { timestamps: true, strict: false });`
- **Risk:** Any arbitrary field in a request body will be saved to the Staff document. This allows data pollution and could be used to inject unexpected fields (e.g., `isAdmin: true`).
- **Fix:** Remove `strict: false`. Define all expected fields explicitly in the schema.

---

### 11. JWT token stored in `sessionStorage`
- **File:** `school-dashboard/src/services/api.js:35`
- **Risk:** `sessionStorage` is accessible to any JavaScript running on the page. An XSS vulnerability anywhere in the dashboard would allow an attacker to steal the token and impersonate the logged-in user.
- **Fix:** Move to `httpOnly` cookies, which are not accessible to JavaScript. This requires corresponding backend changes to set/read the cookie.

---

### 12. Permission middleware reads `userId` from request body/query as fallback
- **File:** `backend/middleware/permissions.js:11`
- **Code:** `const userId = req.user?.id || req.body.userId || req.query.userId;`
- **Risk:** On routes where `authenticate` was skipped, a caller can pass their own `userId` in the query string or body. The permission check then uses that attacker-supplied ID, completely bypassing authentication for permission resolution.
- **Fix:** Remove the `req.body.userId` and `req.query.userId` fallbacks. `userId` should only ever come from the verified JWT via `req.user.id`.

---

### 13. Parent data routes lack authentication at mount point
- **File:** `backend/server.js:344`
- **Code:** `app.use('/api/parent', parentDataRoutes);` — no `authenticate`
- **Risk:** Parent portal data (student info, fee records, attendance visible to parents) may be accessible without a valid parent session depending on what `parentDataRoutes` guards internally.
- **Fix:** Add `authenticate` at the mount point or verify every route in `parentDataRoutes` has its own auth guard.

---

## 📋 Fix Priority Order

1. [ ] Revoke Firebase service account key (do in Firebase Console)
2. [ ] Remove Firebase JSON from git history
3. [ ] Add `authenticate` to all unprotected mutation routes in `server.js`
4. [ ] Add `authenticate` to `studentFees.js`, `staffAttendance.js`, `feeHeads.js`, `feeSettings.js`
5. [ ] Remove JWT secret fallback string — throw on missing env var
6. [ ] Remove `node_modules` from git tracking
7. [ ] Delete `backend/school.db` and add `*.db` to `.gitignore`
8. [ ] Fix rate limiting — remove dev/localhost skip, restore sane limits
9. [ ] Replace all hardcoded `'2024-25'` with `CURRENT_ACADEMIC_YEAR` constant
10. [ ] Remove `strict: false` from Staff schema
11. [ ] Remove `userId` body/query fallback from permissions middleware
12. [ ] Audit `parentDataRoutes` auth coverage
13. [ ] Break up `server.js` into route files
14. [ ] Migrate token storage from `sessionStorage` to `httpOnly` cookies
