# EMS Product Issues — Non-Security Concerns

Audit conducted: 2026-03-05
Audience: Designer/Product Owner

These are issues that will hurt you operationally, with users, or as a business.
None of these are code bugs — they are gaps in how the product is designed and run.

---

## 🔴 CRITICAL — Will cause real damage when the school goes live

### 1. No backup strategy for the database
- **What it means:** All school data — student records, fee payments, attendance, results, payroll — lives in one MongoDB database. If the server crashes, the hosting provider has an outage, or someone accidentally deletes data, everything is gone permanently.
- **Why it matters for a school:** Fee payment records are financial documents. Attendance records are legal records. Losing them mid-year means the school cannot prove what happened. Parents will dispute fees. Teachers will have no attendance history. This is a legal and financial liability.
- **What needs to happen:** Set up automated daily database backups that save to a completely separate location (e.g., an S3 bucket or a second cloud provider). Backups should be tested periodically to confirm they can actually be restored.

---

### 2. No error monitoring — you find out when someone calls you
- **What it means:** If a feature breaks in production right now, there is no alert, no notification, no visibility. You will only find out when a teacher or admin contacts you to say something isn't working.
- **Why it matters for a school:** Schools run on strict schedules. If attendance marking breaks at 8am during morning roll call, 30 teachers are stuck. If fee payment fails during fee collection week, the admin office grinds to a halt. Every minute of downtime costs you trust.
- **What needs to happen:** Set up an error monitoring service (e.g., Sentry — has a free tier). It will automatically capture every crash or error in the system and alert you immediately, before users even notice.

---

### 3. No plan for the academic year transition
- **What it means:** The system is built around the current academic year (`2024-25`). When April comes and the new year starts (`2025-26`), there is no workflow to handle the transition. Students need to be promoted to the next class, fee structures need to reset, new roll numbers need to be assigned, and old data needs to remain accessible for reference.
- **Why it matters for a school:** This is one of the busiest and most stressful times for school administration. If the system doesn't support year-end rollover, staff will have to do everything manually or the system becomes unusable until it's fixed.
- **What needs to happen:** Design and build an academic year rollover workflow. This includes: bulk student promotion, carrying forward relevant data, archiving the old year's records, and resetting year-specific counters (roll numbers, fee cycles, etc.).

---

## 🟠 HIGH — Will cause significant problems within the first few months

### 4. No deployment process — no way to safely update the system
- **What it means:** There is no documented or automated process for pushing updates from your development machine to the live server. No staging environment, no CI/CD pipeline, no rollback plan if an update breaks something.
- **Why it matters:** When you fix a bug or add a feature, deploying it to a live school system is currently a manual, risky process. If a deployment breaks something, you have no fast way to undo it. The school suffers downtime while you debug.
- **What needs to happen:** Set up a proper deployment pipeline. At minimum: a staging environment where you test changes before they go live, and a documented process for deploying updates with a rollback procedure.

---

### 5. No offline support for attendance marking
- **What it means:** Teachers mark attendance using the app, usually from a classroom. If the internet connection drops mid-session — which happens constantly in schools — the attendance data is either lost or the teacher gets an error and has no idea what to do.
- **Why it matters:** Attendance is a critical daily operation. A teacher cannot re-mark 30 students from memory if the app fails. Missing attendance data causes issues for reports, parent communication, and compliance.
- **What needs to happen:** The attendance feature needs to work offline and sync when the connection is restored. The app should clearly indicate to the teacher whether it's online or offline, and confirm when data has been successfully saved to the server.

---

### 6. Fee receipts and official documents have not been legally reviewed
- **What it means:** The system generates fee receipts, payslips, and likely report cards. These are official financial and academic documents. In India, fee receipts need specific information to be valid — school name, registration number, authorized signatory, receipt number, tax details if applicable. If any of these are missing or wrong, the documents are not legally compliant.
- **Why it matters:** Parents may challenge receipts. The school may face issues during audits or inspections. A parent could argue a fee was paid if the receipt format is non-standard.
- **What needs to happen:** Have someone with knowledge of Indian school compliance review all generated documents. Confirm the fee receipt format, payslip format, and report card format meet the requirements of the relevant board (CBSE, State Board, etc.).

---

### 7. No fee payment audit trail
- **What it means:** The payroll module has an audit log (who did what and when). The fee payment system does not. If a fee payment is recorded, modified, or deleted, there is no record of who did it.
- **Why it matters:** Fee disputes are common in schools. A parent says they paid. An admin says the record shows otherwise. Without an immutable audit trail, there is no way to resolve this. The school is also exposed to internal fraud — a staff member could modify payment records with no trace.
- **What needs to happen:** Every fee payment creation, modification, and deletion should be logged with the staff member's ID, timestamp, and what changed. This log should not be editable by anyone.

---

## 🟡 MEDIUM — Will cause friction and trust issues with users

### 8. No onboarding for teachers, admins, or parents
- **What it means:** The system has a school dashboard, a parent app, and a staff app. All three are complex tools with many features. There are no tooltips, no guided first-run flows, no help text, no user documentation.
- **Why it matters:** Your users are teachers and school admins — not tech-savvy people. They will get confused, make mistakes, and call you for support. At scale, this becomes unmanageable. First impressions matter — if the app feels confusing on day one, they will resist using it.
- **What needs to happen:** At minimum, add contextual help text to complex workflows (fee assignment, timetable creation, result entry). Ideally, create short video walkthroughs for each user type. Consider a first-run checklist that guides admins through setup.

---

### 9. No multi-school support — the architecture locks you into one school
- **What it means:** The entire system is built as a single-school tool. There is one database, one set of settings, one school name. If you want to offer this to other schools, you would need to run a completely separate instance of the entire system for each school.
- **Why it matters as a business:** Running separate infrastructure per school is expensive and hard to maintain. If you have 10 schools, you have 10 servers, 10 databases, 10 deployments to manage. The correct architecture for a SaaS product is multi-tenancy — one system, multiple schools, completely isolated from each other.
- **What needs to happen:** Decide now whether this is a single-school tool or a product you plan to sell to multiple schools. If it's the latter, multi-tenancy needs to be designed into the architecture before the codebase grows further. The longer you wait, the more expensive it becomes to add.

---

### 10. Uncontrolled server costs due to missing rate limiting
- **What it means:** The API rate limiting is currently disabled for development. When this goes to production with those same settings, there is nothing stopping a bot, a buggy client, or a malicious actor from sending thousands of requests per second to your server. This consumes CPU, memory, and database connections.
- **Why it matters:** Cloud servers and MongoDB Atlas charge by usage. A single runaway process could generate a bill far beyond your budget. For a school project running on a tight budget, an unexpected $200-500 cloud bill is a serious problem.
- **What needs to happen:** Enable proper rate limiting before going live. The current limits (3,000 requests per 15 minutes) should be reduced to something reasonable (300-500 per 15 minutes for general API, 5-10 per 15 minutes for login attempts).

---

## 📋 Fix Priority Order

### Do before any real school uses this system
1. [ ] Set up automated daily database backups to a separate location
2. [ ] Set up error monitoring (Sentry or equivalent)
3. [ ] Enable rate limiting properly — remove the dev bypass before deploying
4. [ ] Get fee receipts and payslips reviewed for legal compliance

### Do within the first month of live use
5. [ ] Design and build the academic year rollover workflow
6. [ ] Add offline support for the attendance marking flow
7. [ ] Add a fee payment audit trail (who created/changed/deleted each payment)
8. [ ] Document and automate the deployment process

### Do before expanding to more schools
9. [ ] Build user onboarding — tooltips, guided flows, or video walkthroughs
10. [ ] Decide on single-school vs. multi-tenant and plan architecture accordingly
