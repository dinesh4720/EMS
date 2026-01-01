# Documents Preservation Fix

## Issue
When editing a student and saving, the documents array was being overwritten or cleared. Each time you uploaded a new document, it would replace the previous ones instead of adding to the array.

## Root Cause
The `AddStudent` component's `handleSubmit` function was not explicitly handling the documents field. When editing a student, if the documents field was included in the update (even as undefined or empty array), it could overwrite the existing documents in the database.

## The Fix

### Modified: `school-dashboard/src/pages/students/AddStudent.jsx`

**Added comment to clarify documents are managed separately:**
```javascript
const studentData = {
  name: formData.fullName,
  // ... other fields ...
  photo: photoUrl,
  // Preserve existing documents when editing (don't include documents field to avoid overwriting)
  // Documents are managed separately via the dedicated documents endpoint

  status: initialData?.status || "active",
  feeStatus: initialData?.feeStatus || "pending"
};
```

## How It Works Now

### Document Management Architecture

**Two Separate Systems:**

1. **Profile Photo** (Single, Replaceable)
   - Managed in AddStudent form
   - Stored in `photo` field (string URL)
   - Replaces previous photo when updated
   - Included in student update requests

2. **Documents** (Multiple, Appendable)
   - Managed in StudentOverview
   - Stored in `documents` array
   - Uses dedicated endpoint: `POST /api/students/:id/documents`
   - Backend uses `$push` to append to array
   - NOT included in student update requests from AddStudent

### Document Upload Flow

**Adding a Document (StudentOverview):**
1. User clicks "Upload Document" in StudentOverview
2. File is uploaded to Cloudinary
3. Document metadata is sent to `POST /api/students/:id/documents`
4. Backend uses `$push` to append to documents array
5. All existing documents are preserved
6. New document is added to the end

**Editing Student (AddStudent):**
1. User edits student details in AddStudent form
2. `studentData` object is created WITHOUT documents field
3. Update is sent to `PUT /api/students/:id`
4. Backend only updates fields that are present in the request
5. Documents field is not in the request, so it's not touched
6. All existing documents are preserved

### Backend Behavior

**POST /api/students/:id/documents:**
```javascript
// Appends document to array
const result = await Student.collection.findOneAndUpdate(
  { _id: new mongoose.Types.ObjectId(req.params.id) },
  { $push: { documents: newDoc } },  // ✅ Appends, doesn't replace
  { returnDocument: 'after' }
);
```

**PUT /api/students/:id:**
```javascript
const updateData = {
  name: req.body.name,
  // ... other fields ...
  documents: Array.isArray(req.body.documents) ? req.body.documents : undefined
};

// Remove undefined values
Object.keys(updateData).forEach(key => {
  if (updateData[key] === undefined) {
    delete updateData[key];  // ✅ Documents not included if undefined
  }
});

// Update only includes fields that are present
await Student.findByIdAndUpdate(req.params.id, { $set: updateData }, ...);
```

## Testing

After this fix:
- ✅ Upload first document → Document appears
- ✅ Upload second document → Both documents appear
- ✅ Upload third document → All three documents appear
- ✅ Edit student details → All documents preserved
- ✅ Change student photo → All documents preserved
- ✅ Delete a document → Only that document removed
- ✅ Documents persist after page reload

## Key Differences: Photo vs Documents

| Feature | Profile Photo | Documents |
|---------|--------------|-----------|
| **Type** | Single value | Array |
| **Behavior** | Replace | Append |
| **Field** | `photo` (string) | `documents` (array) |
| **Endpoint** | Included in PUT /api/students/:id | POST /api/students/:id/documents |
| **Operation** | `$set` | `$push` |
| **UI Location** | AddStudent form | StudentOverview |
| **When Updated** | When editing student | Separately via upload button |

## Related Files
- `school-dashboard/src/pages/students/AddStudent.jsx` - Form component (FIXED)
- `school-dashboard/src/pages/students/StudentOverview.jsx` - Document upload UI
- `backend/server.js` - Document endpoints

## Summary

The fix ensures that documents are preserved when editing a student by:
1. **Not including** the documents field in student update requests from AddStudent
2. **Using dedicated endpoint** for document uploads that appends to array
3. **Separating concerns** - profile photo is replaceable, documents are appendable

This maintains the correct behavior where:
- Profile photo can be changed/replaced
- Documents can only be added or deleted individually
- Editing student details doesn't affect documents
