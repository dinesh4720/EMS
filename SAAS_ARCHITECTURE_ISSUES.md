# EMS — Additional Problems (SaaS & Architecture)

Audit conducted: 2026-03-05
Context: No users yet. Goal is to sell as a SaaS product to multiple schools.

These are problems not covered in the three previous MD files.
They are specific to: (1) things that are broken or fake right now, and
(2) what it actually takes to run this as a real SaaS product for schools.

---

## 🔴 CRITICAL — Broken or fake right now

### 1. The main Dashboard runs entirely on fake data
- **File:** `school-dashboard/src/pages/Dashboard.jsx:3`
- **Code:** `import { dashboardData } from "../data/mockData";`
- The dashboard — the first thing any admin sees when they log in — shows:
  - Fake fee collections (₹1,25,000 today)
  - Fake student names in "recent payments" (Rahul Sharma, Priya Patel, etc.)
  - Fake attendance numbers (92% staff, 88% students)
  - Fake announcements
- **None of this is connected to real data.** A school admin logging in will see numbers that have nothing to do with their school.
- **Fix:** Replace every `dashboardData.*` reference with real API calls. The data already exists in the backend — it just isn't being wired up to the dashboard.

---

### 2. The Analytics page uses fabricated math for attendance
- **File:** `school-dashboard/src/pages/Analytics.jsx:78`
- **Code:** `const avgAttendance = students.reduce((acc, s) => acc + (75 + ((s.id * 7) % 25)), 0)`
- This literally takes the student's database ID number, multiplies it by 7, calculates the remainder when divided by 25, and adds 75. That's attendance. It's completely made up and will show different fake numbers every time the student list changes.
- **Fix:** Calculate attendance from the actual attendance records in the database.

---

### 3. The Accounts module (Invoices & Expenses) is entirely hardcoded fake data
- **Files:** `school-dashboard/src/pages/accounts/Invoices.jsx`, `Expenses.jsx`
- Both pages define `mockInvoices` and `mockExpenses` arrays directly in the component. There is no backend for this. No API. No database model.
- For a school ERP, the accounts module is a core financial feature. Schools need to track real expenses and invoices.
- **Fix:** Either build the backend for this module or remove it from the sidebar so schools don't click on it and see fake data.

---

### 4. Communication Logs shows fake data
- **File:** `school-dashboard/src/pages/messaging/CommunicationLogs.jsx:15`
- **Code:** `import { communicationLogs } from "../../data/mockData";`
- The communication log — which should show real SMS/WhatsApp/email history with parents — is showing hardcoded dummy entries.
- **Fix:** Wire this to real communication history, or remove it until it's built.

---

### 5. Firebase is disabled — OTP/phone login for parents is completely broken
- **File:** `backend/config/firebase.js` — entirely commented out
- The parent app login supports OTP via Firebase Phone Auth. Firebase Admin SDK is commented out with `// FIREBASE TEMPORARILY DISABLED`.
- **What this means:** `POST /api/parent/auth/send-otp` exists as a route but Firebase is off. OTP-based parent login cannot work.
- The Firebase service account key is committed to the repo (covered in CRITICAL_ISSUES.md) but the actual SDK is disabled. Parents cannot log in with OTP.
- **Fix:** Either properly configure Firebase Admin SDK using environment variables (not the committed JSON file), or implement a different OTP provider (e.g., MSG91).

---

### 6. The school self-signup page has no backend endpoint
- **File:** `school-dashboard/src/pages/Signup.jsx:78`
- **Code:** `fetch('/auth/signup', { method: 'POST', body: { schoolName, ... } })`
- There is a signup page for new schools to register. There is **no `/auth/signup` endpoint** anywhere in `server.js` or any route file.
- **What happens:** A new school tries to sign up, clicks the button, and gets a 404 error.
- **Fix:** Build the signup endpoint, or remove the signup page until it's ready.

---

### 7. Two completely separate and incompatible parent data systems
- **System 1:** The `Student` schema has an embedded `parents[]` array (name, phone, email, occupation, isWhatsapp) — stored directly inside each student document. This is what the school dashboard uses.
- **System 2:** The `Parent` model is a separate collection with its own login, password, FCM tokens, and a `children[]` array referencing student IDs. This is what the parent app uses.
- **The collision:** A parent added through the school dashboard (System 1) does not automatically get a Parent account (System 2). The parent app has no visibility into the parents array stored in student records. There's no sync between them.
- **Real consequence:** A school adds parent contact info when enrolling a student. That parent tries to log into the parent app — and cannot, because no Parent account was ever created for them.
- **Fix:** When a student is created or updated with parent contact info, automatically create or link a Parent account. Or consolidate into one system. Right now they're two parallel systems that don't talk to each other.

---

## 🟠 HIGH — Will block you from selling this as SaaS

### 8. Zero multi-tenancy — this is the biggest architectural blocker for SaaS
- **Current state:** There is no `schoolId` field on any model. Not on Student, Staff, Class, Attendance, FeePayment, or any other collection. Zero.
- **What this means:** Every school's data lives in the same collections with no separation. If you onboard School A and School B:
  - School A's admin can potentially see School B's students
  - Fee payments from both schools are in the same collection
  - You cannot run a query like "give me all students for School A" because there's no School A concept in the data
- **This is not a small fix.** Adding multi-tenancy means adding a `schoolId` to every schema, every query, every route, and every middleware check. It's a fundamental architectural change.
- **Fix:** Before onboarding a second school, add a `School` model and a `schoolId` field to every data model. Add middleware that sets `schoolId` from the authenticated user's context on every query. This is weeks of careful work.

---

### 9. Mobile apps have the backend URL hardcoded to `localhost`
- **Parent app:** `parent-app/src/config/index.js` — `API_BASE_URL: 'http://localhost:3001'`
- **Staff app:** `staff-app/src/config/index.js` — resolves to `http://localhost:3001`
- **What this means:** Both mobile apps, as they currently exist, will only work when the phone is on the same machine as the development server. They will not connect to any production server.
- Before publishing to the App Store or Play Store, the URL must be changed to the production backend URL — and there's no environment-based config to make this easy to switch.
- **Fix:** Use Expo's `app.config.js` with environment variables to set the API URL per environment (dev/staging/prod) without hardcoding.

---

### 10. App Store bundle IDs are generic placeholders — they will be rejected
- **Parent app:** `bundleIdentifier: "com.ems.parentapp"` / `package: "com.ems.parentapp"`
- **Staff app:** `bundleIdentifier: "com.ems.staffapp"` / `package: "com.ems.staffapp"`
- App Store (Apple) and Play Store (Google) require unique, company-specific bundle IDs in reverse-domain format (e.g., `com.yourbrandname.parentapp`). Generic IDs like `com.ems.*` are almost certainly already taken.
- Both apps are also version `1.0.0` with no build number, which is required for app store submissions.
- **Fix:** Choose your brand name, register it, and update all bundle IDs before attempting any store submission.

---

### 11. No subscription/billing infrastructure — no way to charge schools
- There is zero subscription or billing infrastructure in this codebase. No plan tiers, no payment for the SaaS itself (different from parents paying fees), no school account management, no trial periods, no usage limits per plan.
- **What this means for SaaS:** You have no mechanism to charge schools for using the product. You also have no way to limit what features a school on a free trial can access vs. a paying school.
- **Fix:** This needs to be designed before you onboard real schools. Decide on pricing tiers (e.g., up to 200 students free, paid plans for larger schools), integrate a billing system (Razorpay Subscriptions or Stripe), and build school account management.

---

### 12. No school onboarding flow — getting a new school set up requires manual developer work
- Currently, to add a new school you would need to:
  1. Manually create an admin staff member in the database
  2. Manually set up school settings
  3. Deploy a new instance (since there's no multi-tenancy)
  4. Configure the frontend to point at that instance
- There is no self-service school onboarding, no admin panel to manage schools, no automated provisioning.
- **Fix:** Build a super-admin dashboard (separate from the school admin dashboard) where you can onboard new schools, set their plan, and trigger automated setup.

---

### 13. Razorpay payment keys are missing from deployment config and `.env.example`
- **File:** `backend/render.yaml` — no `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET`
- **File:** `backend/.env.example` — no Razorpay section
- Parents can attempt to pay fees through the app. The payment flow calls Razorpay. If keys aren't configured, the error message says "Payment gateway not configured" — but this will only be discovered when a parent tries to pay, not during setup.
- **Fix:** Add Razorpay keys to `render.yaml` and `env.example`. Add startup validation that warns if payment keys are missing.

---

## 🟡 MEDIUM — Quality and completeness issues

### 14. The school dashboard Signup page exists but isn't protected — anyone can create an admin account
- The Signup page is linked from the Login page. Even if the backend endpoint is built, there's no invitation system, no approval flow, and no way to verify the person signing up is actually from a real school.
- For SaaS, open self-registration without verification leads to spam accounts and abuse.
- **Fix:** Implement either (a) invite-only signup where you send a link to the school, or (b) a signup-with-approval flow where new registrations are reviewed before being activated.

---

### 15. The `StyleGuide` page is accessible in production
- **File:** `school-dashboard/src/App.jsx:25`
- There's a `StyleGuide` page routed and accessible in the running app. This is a developer reference page showing UI components. Real school admins should never see this.
- **Fix:** Remove the StyleGuide route from production builds, or restrict it to dev-only.

---

### 16. The parent app and staff app have no version update mechanism
- Both apps use `expo-updates` (`expo-updates: "~0.27.5"` in parent-app) but there's no configuration for which update channel to use or how OTA updates are delivered.
- For a SaaS product on real devices, being able to push bug fixes without forcing a full App Store/Play Store release cycle is essential.
- **Fix:** Configure Expo EAS Update channels (development, staging, production) so you can push OTA fixes to deployed apps.

---

### 17. No data privacy or GDPR/PDPA compliance design
- The system stores: student names, dates of birth, parent phone numbers, parent emails, biometric-adjacent data (attendance times), financial records, and medical/health fields on student profiles.
- In India, the **Digital Personal Data Protection Act (DPDPA) 2023** applies. Schools collecting and processing children's data have specific obligations.
- There is no: consent tracking, data retention policy, right-to-deletion implementation, or privacy policy document anywhere in the codebase.
- **Fix:** This needs a legal review. At minimum: add a privacy policy, implement data deletion (proper, not soft-delete), and document what data is collected and why.

---

## 📋 Fix Priority Order

### Before showing to any potential school customer
1. [ ] Replace Dashboard mock data with real API data
2. [ ] Hide or clearly label the Accounts (Invoices/Expenses) module as "coming soon"
3. [ ] Fix the Analytics attendance calculation — remove the `(s.id * 7) % 25` math
4. [ ] Fix or remove the Communication Logs mock data

### Before onboarding even one school
5. [ ] Design and implement multi-tenancy (schoolId on all models) — this is the biggest item
6. [ ] Fix the two parent data systems — unify them
7. [ ] Build the school signup/onboarding backend endpoint
8. [ ] Fix Firebase OTP or replace with a working alternative
9. [ ] Add Razorpay keys to deployment config and env.example
10. [ ] Build a super-admin panel to manage schools

### Before App Store submission
11. [ ] Change mobile app bundle IDs from `com.ems.*` to your real brand
12. [ ] Replace `localhost` with environment-variable-based production URLs in both mobile apps
13. [ ] Configure Expo EAS Update channels
14. [ ] Add proper version/build numbers

### Before taking money from schools
15. [ ] Build subscription/billing infrastructure
16. [ ] Implement invite-only or approval-based signup
17. [ ] Get legal review for DPDPA compliance
18. [ ] Remove StyleGuide page from production routing
