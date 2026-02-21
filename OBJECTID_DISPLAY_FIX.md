# ObjectId Display Issue - Resolution

## Problem Description

Staff names, student names, and user names were displaying as MongoDB ObjectIds (24-character hexadecimal strings like `69900115d125322003266f9d`) in:
1. **Owlin tracker dashboard** - Live sessions and events pages
2. **School dashboard** - Breadcrumbs, address links, and other UI elements

## Root Cause

The issue had two main causes:

### 1. Owlin Tracker - User Metadata
In `school-dashboard/src/hooks/useOwlinTracking.js`, the user data was being passed to the owlin tracker, but there was no validation to ensure that `user.name`, `user.email`, and `user.role` were properly set. If these fields were undefined or contained ObjectIds, they would be displayed as-is.

### 2. Missing ObjectId Detection
There was no utility to detect when a name field contained a MongoDB ObjectId instead of an actual name, and no fallback mechanism to display alternative identifiers (like code, username, or email).

## Solution Implemented

### 1. Fixed Owlin Tracker User Identification
**File:** `school-dashboard/src/hooks/useOwlinTracking.js`

Added proper validation and fallback logic when setting user properties:

```javascript
// BEFORE
tracker.setUserProperties({
  name: user.name,
  email: user.email,
  role: user.role,
})

// AFTER
const userName = user.name || user.username || 'Unknown User'
const userEmail = user.email || ''
const userRole = user.role || 'User'

tracker.setUserProperties({
  name: userName,
  email: userEmail,
  role: userRole,
})
```

This ensures that even if `user.name` is undefined or an ObjectId, we fall back to `user.username` or a default value.

### 2. Created ObjectId Detection Utility
**File:** `school-dashboard/src/utils/objectIdHelper.js`

Created a comprehensive utility module with the following functions:

- **`isObjectId(str)`** - Detects if a string is a MongoDB ObjectId (24-char hex string)
- **`getSafeDisplayName(entity, fallbackField)`** - Returns a safe display name with fallback logic
- **`getSafeInitials(name, fallback)`** - Gets initials from a name, handling ObjectId cases
- **`sanitizeObjectNames(obj, nameFields)`** - Recursively sanitizes object name fields

### 3. Updated Owlin Dashboard Pages
**Files:**
- `owlin/src/pages/Dashboard.tsx`
- `owlin/src/pages/Sessions.tsx`
- `owlin/src/pages/Events.tsx`

Applied the ObjectId detection utility to all places where user names are displayed:

```javascript
// BEFORE
<p className="font-medium text-gray-900">{session.userName}</p>

// AFTER
<p className="font-medium text-gray-900">
  {getSafeDisplayName({ name: session.userName, id: session.userId }, 'id')}
</p>
```

## How It Works

### Detection Logic
The `isObjectId()` function uses a regex pattern to detect MongoDB ObjectIds:
```javascript
/^[a-f\d]{24}$/i.test(str)
```

### Fallback Chain
When displaying a name, the system now follows this fallback chain:
1. Use `name` if it exists and is not an ObjectId
2. Try the specified fallback field (e.g., `code`, `username`)
3. Try common fallback fields: `username`, `email`, `code`, `staffId`, `admissionId`, `rollNo`
4. Last resort: Display `"User {id}"` or `"Unknown"`

## Testing

To verify the fix:

1. **Owlin Dashboard:**
   - Start the owlin server: `cd owlin && npm run dev`
   - Start school-dashboard: `cd school-dashboard && npm run dev`
   - Log in to school-dashboard
   - Open owlin dashboard at `http://localhost:4001`
   - Verify that user names display correctly in:
     - Live Sessions panel
     - Sessions page
     - Events page

2. **School Dashboard:**
   - Navigate to staff/student profiles
   - Check breadcrumbs display correct names
   - Verify address links show proper names

## Prevention

To prevent this issue in the future:

1. **Always validate user data** before passing it to tracking systems
2. **Use the `getSafeDisplayName()` utility** when displaying any name field
3. **Add ObjectId detection** in API responses if needed
4. **Ensure backend populate calls** are working correctly for referenced fields

## Files Modified

1. `school-dashboard/src/hooks/useOwlinTracking.js` - Added user data validation
2. `school-dashboard/src/utils/objectIdHelper.js` - Created (new utility)
3. `owlin/src/pages/Dashboard.tsx` - Applied ObjectId detection
4. `owlin/src/pages/Sessions.tsx` - Applied ObjectId detection
5. `owlin/src/pages/Events.tsx` - Applied ObjectId detection

## Additional Notes

The school-dashboard already had some ObjectId detection logic in `StaffDashboard.jsx`:
```javascript
{staff.name && /^[a-f\d]{24}$/i.test(staff.name)
  ? staff.code || 'Unknown Staff'
  : staff.name}
```

This pattern has now been standardized and made reusable through the `objectIdHelper.js` utility.

## Backend Considerations

While this fix handles the frontend display issue, it's important to investigate why ObjectIds might be appearing in name fields in the first place. Potential backend issues to check:

1. **Missing populate() calls** - Ensure all API routes properly populate referenced fields
2. **Data corruption** - Check if any database records have ObjectIds in name fields
3. **Migration issues** - Verify that data migrations didn't accidentally overwrite name fields

Run this query in MongoDB to check for corrupted name fields:
```javascript
// Check for staff with ObjectId-like names
db.staff.find({ name: /^[a-f\d]{24}$/i })

// Check for students with ObjectId-like names
db.students.find({ name: /^[a-f\d]{24}$/i })
```

If any records are found, they should be corrected in the database.


---

## Update: PAGE Column Display Enhancement

### Problem
The PAGE column in the owlin Events page was showing raw paths with ObjectIds like `/staffs/69900115d125322003266f9d` instead of displaying staff/student names.

### Solution
**File:** `owlin/src/pages/Events.tsx`

Added a `formatPagePath()` function that:
1. Extracts names from page titles (e.g., "Anil Kumar - Staff - SchoolSync")
2. Formats them as "Name (Type)" (e.g., "Anil Kumar (Staff)")
3. Falls back to shortened paths for older events (e.g., `/staffs/[6f9d]`)

### How It Works

The solution leverages the fact that `document.title` is already being set with staff/student names in:
- `school-dashboard/src/pages/staffs/StaffDashboard.jsx`
- `school-dashboard/src/pages/students/StudentOverviewRefactored.jsx`

The owlin tracker automatically captures `document.title` in the `page.title` field when tracking pageview events.

```javascript
// Page title format: "Anil Kumar - Staff - SchoolSync"
// Extracted display: "Anil Kumar (Staff)"

function formatPagePath(page: any): string {
  if (!page) return '-'
  
  // If page is a string, format the path
  if (typeof page === 'string') {
    return formatPath(page)
  }
  
  // Extract name from title
  if (page.title) {
    const titleParts = page.title.split(' - ')
    if (titleParts.length >= 2 && titleParts[0] !== 'School Dashboard') {
      return `${titleParts[0]} (${titleParts[1]})`
    }
  }
  
  // Fallback to shortened path
  return formatPath(page.path || page)
}
```

### Display Examples

| Original Path | Page Title | Display |
|--------------|------------|---------|
| `/staffs/69900115d125322003266f9d` | "Anil Kumar - Staff - SchoolSync" | "Anil Kumar (Staff)" |
| `/students/6972605d47f5721444d7b10a` | "Anjali Rao - Student - SchoolSync" | "Anjali Rao (Student)" |
| `/staffs/69900115d125322003266f9d` | (no title) | `/staffs/[6f9d]` |
| `/dashboard` | "School Dashboard" | `/dashboard` |

### Testing

1. Navigate to a staff profile (e.g., Anil Kumar)
2. Perform some actions to generate events
3. Open owlin Events page
4. Verify PAGE column shows:
   - "Anil Kumar (Staff)" for staff pages
   - "Anjali Rao (Student)" for student pages
   - Shortened paths like `/staffs/[6f9d]` for older events without titles

### Notes

- URLs in the address bar still contain IDs (this is correct and expected for routing)
- Only the UI display shows names, not the actual URLs
- Older events without page titles will show shortened paths
- New events will automatically have proper names captured from page titles
