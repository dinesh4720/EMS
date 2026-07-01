# Staff Module — Remaining Issues

Issues identified during audit but **not yet fixed**. Each entry includes the file, line reference, severity, and a description of the problem.

---

## StaffAttendance.jsx

### 2. `getOverallAttendance` falls back to seeded pseudo-random number
**Severity:** Medium
**Lines:** 72–74
**Code:**
```js
const seed = staffId * 13 % 100;
return Math.min(98, Math.max(65, seed + 30));
```
**Problem:** When no attendance data exists for a staff member the function returns a deterministic but fake percentage (65–98%). This fake number appears in the attendance column, misleading admins into thinking attendance has been recorded.
**Fix:** Return `null` or `0` when no data is available and display "No data" in the UI instead.

---

### 3. `fetchStaffAttendanceForDate` has no error handling
**Severity:** Medium
**Lines:** 27–29
**Code:**
```js
useEffect(() => {
    fetchStaffAttendanceForDate(selectedDate);
}, [selectedDate, fetchStaffAttendanceForDate]);
```
**Problem:** If the API call fails (network error, 5xx), the error is silently swallowed. The table shows stale or empty data with no feedback to the user.
**Fix:**
```js
fetchStaffAttendanceForDate(selectedDate).catch(err => {
    console.error('Failed to fetch attendance:', err);
    toast.error('Failed to load attendance for selected date');
});
```

---

### 4. `markBulkAttendance` call has no error handling or loading state
**Severity:** Medium
**Lines:** 198, 210
**Code:**
```js
markBulkAttendance(selectedDate, action, idsToProcess, "", inTime, "-");
```
**Problem:** The bulk mark call is fire-and-forget. If it fails the UI resets selection and shows no error. There is also no loading indicator, so double-submitting is possible.
**Fix:** Await the call in a try/catch block and show a loading state while it runs.

---

### 5. `s.department.toLowerCase()` crash when department is undefined
**Severity:** Low
**Line:** ~116
**Code:**
```js
s.department.toLowerCase().includes(lowerQuery)
```
**Problem:** `department` may be `undefined` for some staff records, causing a runtime TypeError.
**Fix:**
```js
(s.department || '').toLowerCase().includes(lowerQuery)
```

---

## StaffPayroll.jsx

### 6. `emp.code.toLowerCase()` crash when code is undefined
**Severity:** Medium
**Lines:** ~354–358
**Code:**
```js
emp.name.toLowerCase().includes(query) ||
emp.code.toLowerCase().includes(query)
```
**Problem:** `emp.code` may be `undefined` for staff records without a code assigned, causing a TypeError during search.
**Fix:**
```js
(emp.name || '').toLowerCase().includes(query) ||
(emp.code || '').toLowerCase().includes(query)
```

---

### 7. `fetchDashboard` and `fetchPayrollRecords` not re-triggered on manual data changes
**Severity:** Low
**Lines:** 96–102
**Problem:** The `useEffect` depends on `[selectedMonth, selectedYear, appLoading, staff]`. If a payment is recorded via the UI and `payrollRecords` state is updated, `fetchDashboard` is not called again since the dependency array doesn't include a "last action" timestamp. This means dashboard summary cards may be stale after in-page actions.
**Fix:** After each mutation (`confirmPayment`, `confirmBulkPay`, `confirmReversePayment`) already calls `fetchDashboard()` and `fetchPayrollRecords()`, but `fetchDashboard` errors are only logged to console — add `toast.error` on failure.

---

### 8. `handleExportPayroll` uses `toast.loading` without proper ID management
**Severity:** Low
**Lines:** 313–322
**Code:**
```js
toast.loading('Exporting payroll data...');
await payrollApi.exportPayroll(selectedMonth, selectedYear);
toast.dismiss();
toast.success('Payroll export downloaded!');
```
**Problem:** `toast.loading()` returns a toast ID that should be passed to `toast.dismiss(id)`. Calling `toast.dismiss()` without an ID dismisses all active toasts, which can be jarring if other toasts are visible.
**Fix:**
```js
const toastId = toast.loading('Exporting payroll data...');
await payrollApi.exportPayroll(selectedMonth, selectedYear);
toast.success('Payroll export downloaded!', { id: toastId });
```

---

## StaffAssignmentPanel.jsx

### 9. Dual ID property assumption (`staff.id` vs `staff._id`)
**Severity:** Low (already partially handled)
**Line:** 38
**Code:**
```js
return String(cls.classTeacherId) === String(staff.id) || (staff._id && String(cls.classTeacherId) === String(staff._id));
```
**Problem:** The code assumes a staff record will always have `staff.id` as the primary key, falling back to `staff._id`. If `staff.id` is `undefined` (raw MongoDB document without normalisation), `String(undefined) === String(cls.classTeacherId)` evaluates as `"undefined" === "64abc..."` which is always false and silently hides valid class-teacher assignments.
**Fix:** Use `getStaffById` to ensure the normalized `id` is always populated, or guard explicitly:
```js
const staffId = staff._id || staff.id;
return staffId && String(cls.classTeacherId) === String(staffId);
```

---

## StaffAboutTab.jsx

### 10. ObjectID-as-name fallback is a symptom, not a fix
**Severity:** Low (data quality issue)
**Line:** 20
**Code:**
```js
value={staff.name && /^[a-f\d]{24}$/i.test(staff.name) ? (staff.code || '—') : (staff.name || '—')}
```
**Problem:** This check silently substitutes `staff.code` when `staff.name` is a MongoDB ObjectID. This masks an upstream API normalisation bug — the `name` field should never contain an ObjectID. The masking may produce confusing output (e.g. showing an employee code as the name).
**Fix:** Fix the root cause in the API/context normalisation layer so `staff.name` is always a human-readable string. Remove the regex patch once fixed.

---

## StaffDashboard.jsx

### 11. Navigation prev/next uses `s.id === id` without type coercion
**Severity:** Low
**Line:** 132
**Code:**
```js
const currentStaffIndex = allStaffList?.findIndex(s => s.id === id) || 0;
```
**Problem:** `id` from `useParams()` is always a string. If `s.id` is a number or the list uses `_id`, `findIndex` returns `-1` and `|| 0` quietly falls back to index 0 (first staff). Prev/next navigation silently breaks.
**Fix:**
```js
const currentStaffIndex = allStaffList?.findIndex(s => String(s.id) === String(id) || String(s._id) === String(id)) ?? -1;
```

---

### 12. Documents initialised from `staff.idDocuments` use synthetic `id: \`id-${index}\``
**Severity:** Low
**Lines:** 186–199
**Problem:** Documents built from `staff.idDocuments` use a synthetic `id-0`, `id-1`, … as their `_id`. If `onDeleteDocument` sends this synthetic ID to the backend, the DELETE request will fail silently (no record found). This affects the "Delete" button in `StaffDocumentsTab`.
**Fix:** Preserve the real backend `_id` from the document object when it exists. Only fall back to synthetic ID for local-only (not-yet-uploaded) items.

---

## StaffAttendanceTab.jsx

### 13. Regularization modal has no validation on submit
**Severity:** Low
**Problem:** The regularization form allows submitting with an empty reason field. While the backend may enforce this, there is no frontend validation to catch it early or provide inline feedback.
**Fix:** Disable the submit button when `reason.trim() === ''` and show an inline error message.

---

## General / Cross-cutting

### 14. `s.status === "active"` case-sensitive comparison throughout attendance pages
**Severity:** Low
**Files:** `StaffAttendance.jsx` line 89, 102
**Code:**
```js
staff.filter(s => s.status === "active")
```
**Problem:** `StaffPayroll.jsx` already uses a robust `isActiveStaff()` helper that handles case and undefined. The attendance pages do not, so staff with status `"Active"` or `"ACTIVE"` are excluded from the filtered list.
**Fix:** Adopt the same `isActiveStaff` helper or normalise status at the context level.

---

*Generated: 2026-03-11*
*Fixes applied in this session are documented in git history.*
