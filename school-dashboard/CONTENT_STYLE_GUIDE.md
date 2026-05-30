# Content Style Guide — School Dashboard

> Last updated: 2026-05-30  
> Owner: Content / UX Writer  
> Scope: All UI copy in `school-dashboard` (labels, buttons, CTAs, placeholders, tooltips, error messages, success messages, empty states, loading states, onboarding, confirmations)

---

## 1. Voice & Tone

| Principle | Rule |
|-----------|------|
| **Clear over clever** | Never sacrifice clarity for personality. |
| **First-time user** | Write for someone who has never used the product. No jargon, no acronyms without explanation. |
| **Action-oriented** | Every message should move the user forward. |
| **Reassuring, not apologetic** | "Add your first student" not "No students found." |
| **Consistent** | Use established patterns before inventing new ones. |

### Tone by state
- **Default / neutral:** Direct, calm, helpful.
- **Success:** Brief, positive, no exclamation marks.
- **Error:** Human, specific, always says what to do next.
- **Empty state:** Instructional, never apologetic.
- **Loading:** Reassuring context: "Saving your changes…" not just "Saving…"

---

## 2. Capitalization

### Sentence case for almost everything
Use sentence case (capitalize first word + proper nouns only) for:
- Button labels
- Page titles
- Modal headers
- Drawer titles
- Form labels
- Input placeholders
- Empty-state headings
- Toast messages
- Error messages
- Menu items
- Tab labels

**Examples:**
- ✅ "Save changes"
- ✅ "Add student"
- ✅ "Fee collection settings"
- ❌ "Save Changes"
- ❌ "Add Student"
- ❌ "Fee Collection Settings"

### Title case exceptions
Title case is reserved for:
- Product names: "SchoolSync", "Owlin Tracker"
- Proper nouns: "WhatsApp", "Google", "Aadhaar"
- Table column headers that are ALL-CAPS by design system convention (e.g. `STUDENT NAME`, `ACTIONS`) — these are visual tokens, not sentences.

### All-caps
Avoid all-caps in body copy or labels. All-caps is permitted only for:
- Design-system table headers (see above)
- Abbreviated status badges where space is extremely constrained

---

## 3. Punctuation

| Rule | Example |
|------|---------|
| **No exclamation marks in UI copy** | ✅ "Payment recorded"  
❌ "Payment recorded!" |
| **Oxford comma** | Use it in lists of three or more: "Students, staff, and parents" |
| **Ellipsis** | Use only in loading states and progressive-disclosure labels: "Loading your dashboard…", "Show more…" |
| **Periods** | Omit in single-sentence labels, headings, button text, and toast messages. Use in multi-sentence descriptions and body copy. |
| **Colon in labels** | Omit trailing colons on form labels; the visual layout already implies association. Exception: static profile readouts (`Name:`, `Class:`) where the colon serves as a separator. |

---

## 4. Button Copy

### Verb-first, always
Buttons must start with a verb that describes the action.

- ✅ "Save changes"
- ✅ "Add student"
- ✅ "Send reminder"
- ✅ "Delete permanently"
- ❌ "Changes saved" (this is a status, not an action)
- ❌ "Click here"
- ❌ "OK"

### Primary vs secondary CTAs
- **Primary:** Strong verb + object — "Save changes", "Create exam", "Assign teacher"
- **Secondary / destructive:** Same pattern, no weakening — "Discard changes", "Delete student", "Remove assignment"

### Modal confirmation buttons
Use parallel construction for modal action buttons:

| Context | Primary | Secondary |
|---------|---------|-----------|
| Create / add | "Add student" | "Cancel" |
| Edit / update | "Save changes" | "Cancel" |
| Delete / remove | "Delete permanently" | "Cancel" |

**Do not** mix "Create", "Add", "Save", and "Submit" for the same semantic action. Standardize per module and document deviations.

---

## 5. Error Message Formula

Every error message must answer two questions:
1. **What went wrong?**
2. **What should the user do next?**

### Formula
```
[What happened] + [What to do]
```

**Examples:**
- ✅ "Failed to save exam. Check your connection and try again."
- ✅ "This roll number is already taken. Choose a different one or contact your administrator."
- ❌ "Failed to save exam"
- ❌ "An unexpected error occurred"
- ❌ "Something went wrong"

### Generic fallbacks (use only when server provides no detail)
- Network: "Connection interrupted. Check your network and try again."
- Timeout: "Request timed out. Please try again."
- Unknown: "Something went wrong. Refresh the page or try again later."
- Permission: "You don't have permission to do this. Contact your administrator if you need access."

### Error message style
- Sentence case.
- No exclamation marks.
- No blame on the user.
- Include a concrete next step.

---

## 6. Empty State Copy

### Formula
```
Heading: [Action-oriented instruction]
Body (optional): [Brief context or how to start]
CTA (optional): [Verb-first button]
```

**Examples:**
- ✅ "Add your first subject"  
  "Subjects help you organize classes and timetables."  
  CTA: "Add subject"
- ✅ "No exams scheduled yet"  
  "Create an exam to start tracking results."  
  CTA: "Create exam"
- ❌ "No data available"
- ❌ "Nothing here"
- ❌ "No students found"

---

## 7. Loading State Copy

Give the user context about *what* is loading.

- ✅ "Loading your dashboard…"
- ✅ "Saving exam details…"
- ✅ "Generating timetable…"
- ❌ "Loading…"
- ❌ "Please wait…"

For inline / skeleton states, no text is needed — the skeleton pattern is sufficient.

---

## 8. Success & Confirmation Messages

### Toast success messages
- Keep to 3–5 words.
- Sentence case.
- No exclamation marks.
- No period.

**Examples:**
- ✅ "Exam created"
- ✅ "Attendance saved"
- ✅ "Payment recorded"
- ❌ "Exam created successfully!"
- ❌ "The exam has been created."

### Confirmation dialogs
State the consequence clearly and briefly.

- ✅ "Delete this student? Their attendance, fee, and health records will also be removed."
- ✅ "Apply this fee structure to all 32 students in Class 5-A?"
- ❌ "Are you sure?"
- ❌ "This action cannot be undone." (alone, without stating what is being undone)

---

## 9. Form Placeholders

Placeholders should show an example or restate the field's purpose — never repeat the label exactly.

- ✅ "e.g., Staff Meeting, Annual Day…"
- ✅ "e.g., B.Ed, M.Sc"
- ✅ "Enter 10-digit mobile number"
- ❌ "Event Title" (repeats label)
- ❌ "Enter event title here" (redundant)

---

## 10. Forbidden Words & Phrases

| Avoid | Use Instead | Why |
|-------|-------------|-----|
| "Click here" | Verb-first CTA | Accessible, action-oriented |
| "OK" | Specific verb ("Save", "Confirm", "Got it") | Vague |
| "Oops" / "Uh oh" | Direct statement | Professional tone |
| "Something went wrong" (alone) | Specific error + next step | Unhelpful |
| "Please" (in errors / CTAs) | Direct instruction | Overly apologetic |
| "Successfully" | Omit | Implied by success state |
| "Just" / "Simply" / "Easily" | Omit | Condescending |
| "Invalid input" | State what is invalid and why | Specificity |

---

## 11. Terminology

Use the same term for the same concept everywhere.

| Concept | Preferred Term | Avoid |
|---------|---------------|-------|
| Academic year | "Academic year" / "Session" (pick one per module) | "Year", "Term" (unless distinct) |
| Student identification | "Admission ID" | "Student ID" (inconsistent) |
| Staff identification | "Staff ID" | "Employee ID", "Emp ID" |
| Fee line item | "Fee head" | "Fee type", "Fee component" |
| Fee structure template | "Fee template" | "Fee structure" (when template is meant) |
| Class groupings | "Class" and "Section" | "Grade", "Division" |
| Parent app | "Parent App" | "Parent app", "Parent portal" |
| Marking presence | "Mark attendance" | "Take attendance" |
| Adding a record | "Add" (creation) / "Save" (editing) | "Create", "Submit", "New" (inconsistent) |

---

## 12. i18n & Hardcoded Strings

All user-facing copy must live in `src/i18n/locales/en.json` (or the active locale). Hardcoded strings in JSX are a bug.

**Exception:** Debug-only routes (e.g., `/style-guide`), aria-labels that describe the *function* of an icon button (e.g., `aria-label="Edit student"`), and SCIM tokens / generated passwords.

---

## 13. Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-30 | Initial version — voice & tone, capitalization, punctuation, button rules, error formula, empty-state formula, loading states, forbidden words, terminology glossary, i18n rule | Content / UX Writer |
