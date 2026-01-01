# Multi-Document Upload Fix

## Issues Fixed

1. **Documents being overwritten**: Each new document upload was replacing all previous documents
2. **No multi-file support**: Could only upload one document at a time

## Root Causes

### Issue 1: Documents Overwriting
The `handleDocumentUpload` function was calling `/fix-documents` endpoint before each upload, which reset the documents array to empty:
```javascript
// ❌ This was resetting documents to empty array
await fetch(`${...}/students/${id}/fix-documents`, { method: 'POST' });
```

### Issue 2: Single File Only
The input element and handler only supported single file uploads:
```javascript
// ❌ Only handled first file
const file = e.target.files[0];
```

## The Fixes

### Modified: `school-dashboard/src/pages/students/StudentOverview.jsx`

**1. Removed the fix-documents call:**
```javascript
// ❌ REMOVED - This was resetting documents
// await fetch(`${...}/students/${id}/fix-documents`, { method: 'POST' });
```

**2. Added multiple file support:**
```javascript
// ✅ Handle all selected files
const files = e.target.files;
if (files && files.length > 0) {
  const loadingToast = toast.loading(`Uploading ${files.length} document(s)...`);
  
  let successCount = 0;
  let failCount = 0;

  // Upload each file
  for (const file of files) {
    try {
      // Upload to Cloudinary
      const response = await uploadApi.uploadFile(file);
      
      // Create document metadata
      const newDoc = {
        name: file.name,
        type: file.type,
        url: response.url,
        uploadDate: new Date().toISOString()
      };

      // Append to documents array using dedicated endpoint
      const response2 = await fetch(`${...}/students/${id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });

      const result = await response2.json();
      setDocuments(result.documents || []);
      successCount++;
    } catch (error) {
      console.error(`Upload error for ${file.name}:`, error);
      failCount++;
    }
  }

  // Show appropriate message
  if (successCount > 0 && failCount === 0) {
    toast.success(`${successCount} document(s) uploaded successfully`);
  } else if (successCount > 0 && failCount > 0) {
    toast.success(`${successCount} uploaded, ${failCount} failed`);
  } else {
    toast.error("All uploads failed");
  }
}
```

**3. Added multiple attribute to input:**
```javascript
<input
  type="file"
  ref={documentInputRef}
  className="hidden"
  multiple                                    // ✅ Allow multiple file selection
  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"  // ✅ Restrict file types
  onChange={handleDocumentUpload}
/>
```

## How It Works Now

### Single File Upload
1. User clicks "Upload New" or "Browse Files"
2. File picker opens
3. User selects ONE file
4. File uploads to Cloudinary
5. Document metadata is sent to `POST /api/students/:id/documents`
6. Backend uses `$push` to append to documents array
7. All existing documents are preserved
8. Toast shows "1 document(s) uploaded successfully"

### Multiple File Upload
1. User clicks "Upload New" or "Browse Files"
2. File picker opens
3. User selects MULTIPLE files (Ctrl+Click or Shift+Click)
4. Each file uploads to Cloudinary sequentially
5. Each document metadata is sent to `POST /api/students/:id/documents`
6. Backend uses `$push` to append each to documents array
7. All existing documents are preserved
8. Toast shows "X document(s) uploaded successfully"

### Error Handling
- If some files succeed and some fail: "X uploaded, Y failed"
- If all files fail: "All uploads failed"
- Individual file errors are logged to console

## Backend Endpoint

The backend endpoint correctly appends documents:
```javascript
// POST /api/students/:id/documents
const result = await Student.collection.findOneAndUpdate(
  { _id: new mongoose.Types.ObjectId(req.params.id) },
  { $push: { documents: newDoc } },  // ✅ Appends to array
  { returnDocument: 'after' }
);
```

## Testing

After this fix:
- ✅ Upload 1 document → Document appears
- ✅ Upload another document → Both documents appear
- ✅ Upload 3 documents at once → All 3 are added
- ✅ Upload 5 more documents → All 8 documents appear
- ✅ Existing documents are never overwritten
- ✅ Each upload appends to the array
- ✅ Documents persist after page reload
- ✅ Edit student → Documents preserved
- ✅ Change photo → Documents preserved

## Supported File Types

The input now accepts:
- PDF documents (`.pdf`)
- Word documents (`.doc`, `.docx`)
- Images (`.jpg`, `.jpeg`, `.png`)

## User Experience

**Before:**
- Could only upload one file at a time
- Each upload replaced all previous documents
- Had to upload files one by one

**After:**
- Can select multiple files at once (Ctrl+Click)
- Each upload adds to existing documents
- Can upload 10 files in one go
- Progress shown for batch uploads

## Related Files
- `school-dashboard/src/pages/students/StudentOverview.jsx` - Document upload UI (FIXED)
- `backend/server.js` - Document append endpoint (already correct)

## Summary

The fix ensures documents are properly appended by:
1. **Removing the fix-documents call** that was resetting the array
2. **Adding multi-file support** to upload multiple documents at once
3. **Using the dedicated endpoint** that appends with `$push`
4. **Providing better feedback** with success/fail counts

Now you can upload multiple documents and they'll all be preserved!
