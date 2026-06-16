# Student Module — Remaining Issues

> Issues that were **not fixed** in the initial bug-fix pass.
> Ordered by severity. Last updated: 2026-06-12.

---

## Critical

### 1. `PromoteStudentModal` uses `api.patch` — no PATCH route exists on the backend ✅ RESOLVED
- **File:** `src/pages/students/components/modals/PromoteStudentModal.jsx`
- **Detail:** The modal previously called `api.patch('/students/:id', ...)` but the backend only defined `PUT /:id`, causing promotion to fail with a 404/405.
- **Fix:** The modal now calls `studentsApi.promote(id, data)`, which performs a `POST /students/:id/promote` request to the dedicated promotion endpoint. The backend already has a matching `POST /students/:id/promote` route in `routes/students/promotions.js` that handles class promotion and graduation with fee/attendance checks. Unit tests for `studentsApi.promote` and `studentsApi.bulkPromote` were added in `src/services/api/staff.test.js`.

---

### 2. Document delete sends array index but backend expects document string ID
- **Files:** `src/pages/students/hooks/useStudentDocuments.js:159`, `EMS-backend/routes/students.js:237`
- **Detail:** The frontend resolves a numeric `docIndex` and sends it in the URL (`/documents/0`, `/documents/1`, …). The backend does `$pull: { documents: { id: req.params.docId } }`, which matches by the document's string `id` field — a numeric index will never match a string ID, so deletions always silently fail (the backend returns a 200 with the unchanged documents array).
- **Fix:** The frontend should send the document's `.id` string (e.g. `doc.id`), not its array index. Fall back to the index-based approach only when `doc.id` is absent.

---

### 3. Fee payment has no database transaction
- **File:** `EMS-backend/routes/studentFees.js:275–287`
- **Detail:** `StudentFeeStructure.save()` and the subsequent `Student.findByIdAndUpdate(...)` are two separate writes with no atomicity. If the second write fails (network error, validation failure, etc.) the fee structure shows the payment but the student record still shows the old fee status.
- **Fix:** Wrap both writes in a MongoDB session/transaction (requires a replica set), or at minimum log the inconsistency and add a reconciliation job.

---

### 4. No payment idempotency — duplicate requests create duplicate payment records
- **File:** `EMS-backend/routes/studentFees.js:229`
- **Detail:** The payment endpoint has no guard against retried or double-submitted requests (e.g. user clicking "Record Payment" before the response arrives, or a network retry). Each call creates a new payment record.
- **Fix:** Accept a client-generated idempotency key (UUID) in the request body, store it on the payment document, and reject duplicates with 409.

---

### 5. Student is created even when fee structure or parent account initialization fails
- **File:** `EMS-backend/routes/students.js:735–745`
- **Detail:** Errors from `createOrUpdateParentAccount` and `initializeFeeStructure` are caught and silently swallowed. The student document is persisted but without a linked fee structure or parent account, leaving the record in an inconsistent state. The API response gives no indication anything went wrong.
- **Fix:** Return a `warnings` array in the 201 response listing which linked operations failed, so the client can prompt the user to retry initialization manually.

---

### 6. Unpaid fees silently erased when a student changes class — no warning returned to client
- **File:** `EMS-backend/routes/students.js` (class-change branch)
- **Detail:** When a student's class or academic year changes, `StudentFeeStructure.deleteMany(...)` is called. A `console.warn` was added in the previous fix pass, but the API response still contains no indication that unpaid fees were wiped. The UI shows "Student updated" with no mention of the deleted balance.
- **Fix:** Include a `warning` field in the PUT response (e.g. `{ warning: "Unpaid balance of ₹4200 was cleared due to class change." }`) so the frontend can display it to the admin.

---

## High

### 7. `ProfileSection` "Add Photo / Change Photo" button does nothing
- **File:** `src/pages/students/StudentForm/steps/PersonalInfoStep.jsx:186–188`
- **Detail:** The button's `onClick` is `() => {/* Open camera modal */}` — an empty stub. Clicking "Add Photo" or "Change Photo" during student creation has no effect; the photo field is never populated from the form.
- **Fix:** Wire this button to open the `PhotoEditorModal` / `CameraCaptureModal` (already used in the student overview) and call `updateField("picture", ...)` on save.

---

### 8. Race condition in PIN code lookup — no request cancellation
- **File:** `src/pages/students/StudentForm/steps/PersonalInfoStep.jsx:46–68`
- **Detail:** A 500 ms debounce is in place, but there is no `AbortController`. If the user types a valid 6-digit PIN, waits for the lookup to start, then changes the value, the in-flight request for the old PIN can resolve after the new PIN lookup and overwrite the city/state with stale data.
- **Fix:** Create an `AbortController` ref and abort the previous request before starting a new one.

---

### 9. No rollback on partial student deletion
- **File:** `EMS-backend/services/studentDataErasureService.js:39–140`
- **Detail:** The erasure service deletes records from ~12 collections in sequence with no transaction. If any step throws (e.g. a timeout on message deletion), later steps are skipped and the student document may be left intact while some linked records are already gone — or vice versa.
- **Fix:** Use a MongoDB session transaction (requires replica set), or implement a compensating-operation log so a retry can resume from the point of failure.

---

## Medium

### 10. No cap on number of siblings
- **File:** `src/pages/students/StudentForm/steps/ParentsStep.jsx` / `src/pages/students/hooks/useStudentForm.js`
- **Detail:** The "Add Sibling" button has no limit. Users can add dozens of sibling entries, bloating the form and the submitted payload.
- **Fix:** Limit siblings to a reasonable maximum (e.g. 5) and disable the button once reached.

---

### 11. Unsaved-changes warning does not fire when closing the form drawer in-app
- **File:** `src/pages/students/hooks/useStudentForm.js:41–51`
- **Detail:** `hasUnsavedChanges` is tracked and a `beforeunload` listener warns on browser close/refresh. However, closing the slide-over drawer or dismissing the modal that hosts the form skips this check entirely — all entered data is lost without any prompt.
- **Fix:** The parent drawer/sheet that renders `StudentForm` should accept a `canClose` or `onBeforeClose` callback that checks `hasUnsavedChanges` and shows a confirmation alert before dismissing.

---

## Low

### 12. `useStudentDocuments.handleDelete` uses a fragile `Date.now() + Math.random()` ID for upload tracking
- **File:** `src/pages/students/hooks/useStudentDocuments.js:53`
- **Detail:** Upload progress entries use `Date.now() + Math.random()` as a key. While unlikely, two near-simultaneous uploads could produce the same ID, causing the wrong upload's progress indicator to be updated.
- **Fix:** Use `crypto.randomUUID()` (available in all modern browsers) instead.

---

*Total remaining: 11 issues (3 critical, 3 high, 2 medium, 3 low)*
