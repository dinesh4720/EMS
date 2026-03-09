# EMS — Engineering Quality Gaps

Audit conducted: 2026-03-05
Topic: Libraries, patterns, and architecture that are missing or wrong
Audience: You + the developer you hire

This is the layer you wouldn't know to look for — the practices senior engineers
implement as standard on every professional project. Not about UI bugs.
Not about fake data. About how the code is structured and what's missing
architecturally.

---

## FRONTEND

---

### 1. No server state management library — you built one manually and it's worse

**What professional apps use:** TanStack Query (React Query) or SWR.

**What you have instead:** A custom `RequestCache` class in `requestQueue.js`
with a 30-second TTL, a manual request queue, and retry logic — all hand-built.
AppContext then stores API data in `useState` and re-fetches it based on custom
events.

**What this means in practice:**

| Problem | Your custom system | TanStack Query |
|---|---|---|
| Cache invalidation | Manual `clearApiCache()` calls | Automatic after mutations |
| Loading states | Manual `setLoading(true/false)` in every component | `isLoading`, `isFetching` built in |
| Error states | Manual `setError()` calls | `isError`, `error` built in |
| Background refetch | Not implemented | Automatic on window focus |
| Deduplication | Not implemented | Automatic — two components asking for same data = one request |
| Stale-while-revalidate | Not implemented | Built in |
| Pagination | Not implemented (`limit=1000` workaround) | Built in with `useInfiniteQuery` |
| Optimistic updates | Not implemented | Built in |

TanStack Query is not a "nice to have." It's the standard way React apps talk
to APIs in 2025. Every senior React engineer installs it on day one.

**Install:**
```
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**What changes:** Replace `useState` + `useEffect` + manual fetch calls with
`useQuery`. Example — instead of:
```js
const [students, setStudents] = useState([]);
const [loading, setLoading] = useState(false);
useEffect(() => {
  setLoading(true);
  studentsApi.getAll().then(setStudents).finally(() => setLoading(false));
}, []);
```
You write:
```js
const { data: students, isLoading } = useQuery({
  queryKey: ['students'],
  queryFn: studentsApi.getAll
});
```
Caching, deduplication, background refresh, error handling — all handled.

---

### 2. No form management library — every form reinvents validation from scratch

**What professional apps use:** React Hook Form + Zod.

**What you have:** Every form (AddStudent, AddStaff, fee forms) has:
- Its own `useState` for each field
- Its own `errors` state
- Its own `validateStep()` function written from scratch
- Manual `setErrors({...})` calls scattered everywhere

**The evidence:** `AddStudent.jsx` has 12+ `useState` calls just for form
state. The date-of-birth field alone has a custom `validateDOBInRealTime()`
function with 10 branches of manual validation logic (check day, check month,
check year, check future date, check valid calendar date...).

This is all work that React Hook Form + Zod already do for you, better, with
less code that's easier to read.

**What Zod gives you:** A schema file where you define what valid data looks
like, once:
```js
const studentSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  dateOfBirth: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Invalid date format'),
  mobile: z.string().regex(/^[0-9]{10}$/, 'Must be 10 digits'),
  aadhaarNumber: z.string().regex(/^[0-9]{12}$/).optional(),
  parents: z.array(parentSchema).min(1, 'At least one parent required'),
});
```
That schema is then used by the form library to validate automatically — no
manual `validateStep()` function needed.

**What React Hook Form gives you:** No `useState` per field, no manual
re-renders on every keystroke, better performance (uncontrolled inputs), and
built-in error message display.

**Install:**
```
npm install react-hook-form zod @hookform/resolvers
```

**Note:** The backend already uses Joi for validation (well done). The frontend
needs Zod to match — Zod is the modern frontend equivalent of Joi.

---

### 3. No type safety — the whole frontend runs without knowing the shape of its data

**What this is:** The project has no TypeScript. Every API response, every prop
passed between components, every piece of state has no definition of what it
contains.

**Why this matters day to day:**

- You call `student.name` — but the backend field is actually `student.fullName`
  in some places and `student.name` in others (this is already happening in the
  codebase — `AddStudent.jsx` maps `initialData.name` to `fullName`, manually)
- A backend API response changes — adds a field, renames one — and you have no
  warning until something breaks in the UI
- Every new developer has to read 10 files to understand the shape of a
  `student` object

**The fix:** Migrate to TypeScript, or at minimum add JSDoc type annotations to
API response shapes. TypeScript is a large change. JSDoc is zero build cost
and gives you autocomplete in VS Code immediately.

Minimal approach — a `types.js` file:
```js
/**
 * @typedef {Object} Student
 * @property {string} _id
 * @property {string} name
 * @property {string} admissionId
 * @property {string} classId
 * @property {'active'|'inactive'|'graduated'|'transferred'} status
 * @property {Parent[]} parents
 */
```
Add this and VS Code will give you autocomplete and warn you when you access a
field that doesn't exist.

---

### 4. API layer has no central error handling — errors surface differently everywhere

**What you have:** The `request()` function in `api.js` throws errors. Every
call site catches them differently:
- Some use `try/catch` and call `toast.error(err.message)`
- Some ignore errors entirely
- Some log to console only
- The 401 handling (session expired) clears sessionStorage silently in the
  `request()` function — but the user has no idea why they're suddenly logged
  out

**What's missing:**

1. **A single 401 interceptor:** When any request returns 401 (token expired),
   the user should be redirected to login with a message saying "Your session
   has expired, please log in again." Right now, the token is cleared silently
   and the UI shows API errors with no explanation.

2. **Consistent error shapes:** Some errors are `error.message`, some are
   `error.error`, some are `error.details`. The API client should normalize all
   of these to one format before they reach components.

3. **Network-offline detection:** No handling for when the browser goes offline.
   Requests fail silently. The app should detect `navigator.onLine === false`
   and show a banner rather than showing broken pages.

**Pattern fix:**
```js
// In api.js — one place, all 401s handled:
if (response.status === 401) {
  window.dispatchEvent(new Event('session-expired'));
  throw new SessionExpiredError();
}
```
```js
// In App.jsx — one listener:
useEffect(() => {
  const handle = () => navigate('/login', {
    state: { message: 'Your session has expired. Please log in again.' }
  });
  window.addEventListener('session-expired', handle);
  return () => window.removeEventListener('session-expired', handle);
}, []);
```

---

### 5. No environment variable validation at startup

**What you have:** The frontend reads `import.meta.env.VITE_API_URL` in
`api.js`. If this is missing, it silently falls back to `localhost:3001`. In
production, this means every API call silently fails — no warning, no error
on startup.

**What professional apps do:** Validate required env vars at startup and throw
a visible error before the app loads:

```js
// src/config.js
const requiredVars = ['VITE_API_URL'];
for (const key of requiredVars) {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}.
    Add it to your .env file.`);
  }
}
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
};
```

The backend already has this (`validateEnvironment()` in `config/environment.js`
— good). The frontend doesn't. Apply the same pattern.

---

## BACKEND

---

### 6. Joi validation exists but isn't applied to most routes

**What you have:** A professional `validation.js` middleware with Joi schemas
for login, createStaff, createStudent, createFeePayment, and createRefund.
These are well-written. The `validate()` middleware factory is correct.

**The problem:** These schemas are only used on a handful of routes. The vast
majority of `server.js` routes — including all the student CRUD, exam creation,
results, attendance marking — accept raw `req.body` with no validation at all.

**What this means:** A request to `POST /api/results/bulk` with
`{ studentId: "not-an-id", marks: -500, subject: null }` will reach the
database unchanged. MongoDB will reject some of it, but the error response
will be a raw Mongoose validation error — not a clean API error.

**Fix:** Apply `validate(schemas.createStudent)` to every route that mutates
data. This is a 2-line change per route. The Joi schemas already exist — they
just aren't being used.

---

### 7. No Helmet — HTTP security headers are missing

**What Helmet is:** A Node.js package that sets about 15 security-related HTTP
response headers in one line. Every serious Express app uses it.

**Headers you're missing without it:**
- `Content-Security-Policy` — tells browsers what scripts/styles are allowed
  to run (prevents XSS attacks from loading external scripts)
- `X-Frame-Options: DENY` — prevents your app from being embedded in an
  `<iframe>` on an attacker's page (clickjacking)
- `X-Content-Type-Options: nosniff` — prevents browsers from guessing the
  content type of a response
- `Referrer-Policy` — controls how much info is sent in the Referer header
- `Strict-Transport-Security` — forces HTTPS even if someone types HTTP

**Install:**
```
npm install helmet
```
**One line in server.js:**
```js
import helmet from 'helmet';
app.use(helmet());
```

That's it. Instant improvement to your security posture.

---

### 8. No MongoDB query injection protection (express-mongo-sanitize missing)

**What the risk is:** A user could send a request body like:
```json
{ "email": { "$gt": "" }, "password": "anything" }
```
If this reaches a MongoDB `findOne({ email: req.body.email })` query, the
`$gt` operator bypasses the equality check and matches any document. This is
MongoDB query injection — the equivalent of SQL injection for MongoDB.

**Check your login route:** If it does `Staff.findOne({ email: req.body.email })`
without sanitizing, this attack works.

**Fix:**
```
npm install express-mongo-sanitize
```
```js
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize()); // Strips $ and . from req.body, req.params, req.query
```

One line, blocks the entire class of MongoDB injection attacks.

---

### 9. No global Express error handler — each route handles its own errors

**What you have:** Every route has its own `try/catch` that calls
`res.status(500).json({ error: err.message })`. There is no `app.use((err, req, res, next) => {...})` global error handler at the end of `server.js`.

**What this means:**

1. If you forget `try/catch` on a route (which happens easily in a 4,298-line
   file), an unhandled error crashes the async function and Express returns a
   generic 500 with no body.

2. You cannot centrally control error format. Some routes return
   `{ error: err.message }`, some return `{ message: err.message }`,
   some return raw Mongoose errors.

3. You can't centrally redact sensitive information from error messages before
   they reach clients.

**Fix:** Add a global error handler at the very end of server.js:
```js
// Must be after all routes, with 4 parameters
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { err: err.message, path: req.path });

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'  // Never leak stack traces in production
    : err.message;

  res.status(statusCode).json({ error: message });
});
```

---

### 10. JWT is never invalidated on logout — stolen tokens work forever

**The problem:** When a user logs out (`DELETE /api/auth/logout` or equivalent),
the backend simply tells the frontend to delete its token. But the JWT itself
remains cryptographically valid until it expires (8 hours).

If someone steals a teacher's token (via XSS, via network intercept, via
finding it in logs), they can use it for up to 8 hours after the teacher
logged out. There's no way to block it.

**The fix — token blacklist:** Maintain a Redis set (or even a MongoDB
collection) of "revoked tokens." On logout, add the token's JTI (JWT ID) to
the blacklist. In the `authenticate` middleware, check if the JTI is
blacklisted.

```js
// On logout:
const decoded = verifyToken(token);
await RevokedToken.create({ jti: decoded.jti, expiresAt: decoded.exp });

// In authenticate middleware:
const isRevoked = await RevokedToken.exists({ jti: decoded.jti });
if (isRevoked) return res.status(401).json({ error: 'Token has been revoked' });
```

A simpler alternative: shorten the JWT lifetime to 1 hour and use refresh
tokens properly (which the parent auth flow already does — apply the same
pattern to staff auth).

---

### 11. MongoDB transactions not used for multi-document operations

**What transactions are:** When you update two or more MongoDB documents
together and they must both succeed or both fail, you use a transaction.
Without it, if the server crashes between the two writes, your data is
inconsistent.

**Where this is a real risk in your app:**

- **Fee payment:** When a fee payment is created, the student's `feeStatus`
  field is also updated. If the payment document is created but the status
  update fails, the database shows the student as unpaid despite having a
  payment record.

- **Student promotion:** When promoting a student to a new class, their class
  assignment changes and their fee structure resets. If this is two separate
  writes and the server crashes between them, a student ends up in a half-promoted
  state.

- **Timetable creation:** `timetableService.js` even has a comment:
  `// For now, proceed without transactions for compatibility with test environments`
  — meaning they were considered but skipped.

**The fix:** Use MongoDB sessions for any operation that touches 2+ documents:
```js
const session = await mongoose.startSession();
try {
  await session.withTransaction(async () => {
    await FeePayment.create([paymentData], { session });
    await Student.findByIdAndUpdate(studentId,
      { feeStatus: 'paid' }, { session });
  });
} finally {
  await session.endSession();
}
```

**Note:** Transactions require MongoDB to run as a replica set. MongoDB Atlas
(which you're likely using) supports this by default. Your local MongoDB dev
server might not — check `mongo --eval "rs.status()"`.

---

### 12. The custom logger is never used in most of server.js

**What you have:** A proper `logger.js` utility in `backend/utils/logger.js`
that respects `LOG_LEVEL` and formats structured log messages. It was imported
by `config/environment.js`.

**What actually happens:** `server.js` has 58 `console.log` calls that bypass
the logger entirely. The logger exists and is never used in the file that needs
it most.

**Fix:** Replace all `console.log`/`console.warn`/`console.error` in
`server.js` with `logger.info()`/`logger.warn()`/`logger.error()`. Then set
`LOG_LEVEL=INFO` in production `.env` — this automatically silences all debug
logs in production without deleting them from the code.

---

### 13. Database indexes are only on Student and Staff — not on FeePayment, Attendance, or Results

**What indexes do:** MongoDB searches records by scanning everything unless
an index tells it where to look. Without indexes, a query like
"all fee payments for academic year 2024-25" scans every payment record.

**What's indexed (good):**
- Student: `classId + status`, `rollNo + classId + academicYear`, `feeStatus`
- Staff: `teacherAssignments.subject`, `teacherAssignments.classes`
- Class: `name + section + academicYear` (unique)

**What's not indexed (problem):**
- `FeePayment`: no index on `studentId`, `academicYear`, `classId`
  → every fee lookup scans all payments
- `Attendance`: no index on `classId + date`, `studentId + date`
  → every attendance report scans all records
- `Result`: no index on `studentId + examId + academicYear`
  → result lookups are full scans

A school generating 6 months of daily attendance records (40 students × 200
days = 8,000 records) will see attendance reports getting slower every week.

**Fix:** Add these indexes to the FeePayment, Attendance, and Result schemas:
```js
feePaymentSchema.index({ studentId: 1, academicYear: 1 });
feePaymentSchema.index({ classId: 1, academicYear: 1 });
attendanceSchema.index({ classId: 1, date: 1 });
attendanceSchema.index({ 'records.studentId': 1, date: 1 });
resultSchema.index({ studentId: 1, examId: 1 });
```

---

## FULL-STACK / ARCHITECTURE

---

### 14. The validation schemas on the frontend and backend are completely separate and will drift

**What this means:** The backend has a Joi schema that says a phone number must
be exactly 10 digits. The frontend has manual validation in AddStudent.jsx that
checks phone length manually. These are two separate pieces of code.

When a developer changes the backend phone validation (say, to accept +91
prefix), they have to remember to also update the frontend validation. This
will be forgotten. It's already inconsistent in several places.

**The fix — shared validation:** Define validation schemas once, share between
frontend and backend. Zod can run in both Node.js and the browser. A
`packages/validation/` folder with shared Zod schemas eliminates the
duplication:

```
EMS/
├── packages/
│   └── validation/
│       ├── student.schema.js   ← used by both
│       ├── staff.schema.js
│       └── fees.schema.js
├── backend/                    ← imports from packages/validation
└── school-dashboard/           ← imports from packages/validation
```

This is a medium-sized change but eliminates an entire class of bugs.

---

### 15. Socket.IO events have no defined contract — any component can emit anything

**What you have:** `socketServiceEnhanced.js` emits and listens to socket
events. Components emit events with string names like `'fee-payment-created'`,
`'attendance-marked'`, `'student-updated'`. These strings are scattered across
components and the backend socket handler.

**The problem:** When you rename a socket event (say, from `'fee-payment'` to
`'payment-created'`), you have to find and change every place it's referenced
across both frontend and backend. There's no central list of what events exist.

**The fix:** A shared constants file:
```js
// shared/socketEvents.js
export const SOCKET_EVENTS = {
  FEE_PAYMENT_CREATED: 'fee:payment:created',
  ATTENDANCE_MARKED: 'attendance:marked',
  STUDENT_UPDATED: 'student:updated',
  // ...
};
```
Both backend and frontend import from this file. Renaming an event is a
1-line change instead of a grep across 30 files.

---

### 16. No API versioning — breaking changes will break mobile apps instantly

**What you have:** All API routes are at `/api/*` with no version prefix.

**What this means for your mobile apps:** When you make a breaking change to
the parent app API (change a field name, restructure a response), every
installed version of the parent app on every parent's phone breaks immediately.
You cannot push an API change without simultaneously pushing an app update to
every user.

**The fix:** Version your API now, before you have real users:
```
/api/v1/students
/api/v1/fees
/api/v1/attendance
```
When you need to break something, create `/api/v2/students` while keeping
`/api/v1/students` working. Old app versions continue using v1. New versions
use v2. You deprecate v1 six months later.

**Cost to add now:** 15 minutes. Cost to add after you have 500 parents on the
old app: weeks of coordinated releases.

---

### 17. The `uncaughtException` handler suppresses crashes

**File:** `backend/server.js:43-47`
```js
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  // Don't exit the process, just log the error
});
```

**Why this is dangerous:** An uncaught exception means something in your server
went completely wrong — a null reference, a corrupted state, something that
JavaScript couldn't handle. The correct response is to log the error and let
the process exit (so the hosting platform restarts it with a clean state).

Keeping the process alive after an uncaught exception means the server is
running in an unknown, potentially corrupted state. Subsequent requests may
behave incorrectly with no visible error.

**The fix:**
```js
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down', { error: error.message });
  process.exit(1); // Let the platform restart it
});
```
Render and similar hosting platforms automatically restart a crashed process.
Letting it die and restart is safer than keeping a broken server alive.

---

## 📋 Priority Order

### Implement before any developer joins
1. **TanStack Query** — replaces AppContext data fetching entirely. Everything
   gets simpler once this is in.
2. **Helmet** — one line, major security improvement.
3. **express-mongo-sanitize** — one line, blocks injection attacks.
4. **Global Express error handler** — one function, standardizes all errors.
5. **API versioning** — `/api/v1/` prefix everywhere. 15 minutes now, weeks
   later.

### Implement during first development sprint
6. **Zod + React Hook Form** — start with AddStudent and AddStaff, then roll
   out. Removes hundreds of lines of manual validation code.
7. **Enforce Joi validation on all backend routes** — schemas already exist,
   just apply them.
8. **Replace console.log with logger in server.js** — logger already exists,
   just use it.
9. **DB indexes on FeePayment, Attendance, Result** — 5-line change,
   significant performance impact as data grows.
10. **Fix uncaughtException handler** — let it exit. One line change.

### Implement before scaling to multiple schools
11. **JWT token blacklist on logout** — or switch to shorter-lived tokens with
    refresh tokens (parent auth already does this correctly).
12. **MongoDB transactions** — on fee payment and student promotion flows.
13. **Shared validation schemas** — Zod package shared between frontend and
    backend.
14. **Shared Socket event constants** — prevents event name drift.
15. **TypeScript migration** — start with the API layer and shared types.
    Add `strict: false` initially and tighten over time.
