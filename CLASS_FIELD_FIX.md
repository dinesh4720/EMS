# Class Field Auto-Population Fix

## Issue
When editing a student, the class field was not auto-populating in the edit form. The dropdown would be empty even though the student had a class assigned.

## Root Cause
The `AddStudent` component was incorrectly trying to reconstruct the class string by appending the section:
```javascript
class: `${initialData.class}-${initialData.section || 'A'}`
```

However, the backend already returns the `class` field in the correct format (e.g., "10-A"). This caused the class to become malformed (e.g., "10-A-A") and not match any option in the dropdown.

## The Fix

### Modified: `school-dashboard/src/pages/students/AddStudent.jsx`

**Before:**
```javascript
return {
  ...emptyForm,
  ...initialData,
  fullName: initialData.name || "",
  mobile: initialData.phone || "",
  picture: initialData.photo || null,
  parents: initialData.parents?.length > 0 ? initialData.parents : [...],
  class: `${initialData.class}-${initialData.section || 'A'}`, // ❌ Incorrect reconstruction
};
```

**After:**
```javascript
return {
  ...emptyForm,
  ...initialData,
  fullName: initialData.name || "",
  mobile: initialData.phone || "",
  picture: initialData.photo || null,
  rollNumber: initialData.rollNo?.toString() || "", // ✅ Added rollNo mapping
  parents: initialData.parents?.length > 0 ? initialData.parents : [...],
  class: initialData.class || "", // ✅ Use class directly from backend
};
```

## How It Works Now

### Backend Format
The backend returns student data with:
```javascript
{
  id: "...",
  name: "John Doe",
  class: "10-A",        // Already formatted as "name-section"
  classId: "...",       // MongoDB ObjectId
  className: "Class 10 A", // Full display name
  rollNo: 15,
  // ... other fields
}
```

### Frontend Mapping
When editing, the form now:
1. Takes `initialData.class` directly (e.g., "10-A")
2. Matches it against dropdown options (e.g., "10-A", "9-B", etc.)
3. Auto-selects the correct class in the dropdown

### Additional Fix
Also added `rollNumber` mapping:
```javascript
rollNumber: initialData.rollNo?.toString() || ""
```
This ensures the roll number field also auto-populates correctly.

## Testing

After this fix:
- ✅ Open edit drawer for a student with a class
- ✅ Class dropdown shows the correct selected class
- ✅ Roll number field shows the correct roll number
- ✅ All other fields auto-populate correctly
- ✅ Saving preserves the class selection

## Related Files
- `school-dashboard/src/pages/students/AddStudent.jsx` - Form component (FIXED)
- `backend/server.js` - Returns class in "X-A" format
- `school-dashboard/src/pages/students/StudentOverview.jsx` - Passes initialData to AddStudent

## Summary

The fix ensures that when editing a student, the class field auto-populates correctly by using the class string directly from the backend instead of trying to reconstruct it. The backend already formats the class as "name-section" (e.g., "10-A"), so no additional processing is needed.
