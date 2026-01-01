# Photo Upload Testing Guide

## Quick Test Steps

### Test 1: Upload Photo for New Student
1. Go to Students page
2. Click "Add Student"
3. Fill in required fields (name, admission ID, class, etc.)
4. Click "Upload Photo"
5. Select an image file
6. Crop/edit the photo in the editor
7. Click "Save Photo"
8. Complete the form and save the student
9. **Expected**: Photo should appear in student list and profile page

### Test 2: Edit Student Without Changing Photo
1. Go to a student's profile page (one with a photo)
2. Click "Edit Profile" or the edit icon
3. Change some other field (e.g., phone number)
4. Click "Save" without touching the photo
5. Wait for page reload
6. **Expected**: Photo should still be visible everywhere

### Test 3: Change Existing Photo
1. Go to a student's profile page (one with a photo)
2. Click "Edit Profile"
3. Click "Change Photo"
4. Select a new image
5. Crop/edit the new photo
6. Click "Save Photo"
7. Save the form
8. Wait for page reload
9. **Expected**: New photo should replace the old one everywhere

### Test 4: Remove Photo
1. Go to a student's profile page (one with a photo)
2. Click "Edit Profile"
3. Click "Delete" next to the photo
4. Save the form
5. Wait for page reload
6. **Expected**: Photo should be removed, showing default avatar

## What to Check

### Frontend Console Logs
When saving a student with photo changes, you should see:
```
💾 Starting save - Current photo: [URL or null]
💾 editForm.picture: [File object or base64 string or URL]
🔄 Converting base64 to File... (if base64)
🔄 Uploading to Cloudinary... (if new photo)
✅ Photo uploaded (base64): [Cloudinary URL]
💾 Saving student with photo: [URL]
💾 Full update data: {...}
```

### Backend Console Logs
When updating a student, you should see:
```
📝 PUT /api/students/:id - Request body: {...}
📝 Update data after cleanup: {...}
📸 Photo URL being saved: [URL]
✅ Student updated successfully
📸 Photo in updated student: [URL]
```

When fetching a student, you should see:
```
📖 GET /api/students/:id - [ID]
📖 Student documents: [...]
📸 Student photo: [URL]
```

## Common Issues

### Issue: Photo not showing after edit
**Check:**
- Browser console for errors
- Backend logs to verify photo URL was saved
- Network tab to see if photo URL is being returned in GET request
- MongoDB to verify photo field has the URL

### Issue: Photo upload fails
**Check:**
- Cloudinary credentials in backend/.env
- File size (should be under 10MB)
- Network tab for upload request status
- Backend console for Cloudinary errors

### Issue: Photo shows in edit drawer but not in profile
**Check:**
- Page reload is happening after save
- AppContext is updating with new student data
- Avatar components are using the correct photo field

## Verification Checklist

After making changes, verify:
- [ ] Photo appears in student list (StudentsList.jsx)
- [ ] Photo appears in profile header (StudentOverview.jsx)
- [ ] Photo appears in edit drawer (AddStudent.jsx)
- [ ] Photo persists after page reload
- [ ] Photo persists after browser refresh
- [ ] Photo URL is saved in MongoDB
- [ ] Cloudinary upload is successful
- [ ] Console logs show correct flow
- [ ] No errors in browser console
- [ ] No errors in backend console

## MongoDB Verification

To verify photo is saved in MongoDB:
```javascript
// In MongoDB shell or Compass
db.students.findOne({ _id: ObjectId("STUDENT_ID") })
// Check the 'photo' field has a Cloudinary URL
```

## Cloudinary Verification

To verify photo is uploaded to Cloudinary:
1. Log into Cloudinary dashboard
2. Go to Media Library
3. Look for folder: `school_documents`
4. Verify the image is there with correct timestamp

## Success Criteria

✅ Photo uploads successfully to Cloudinary
✅ Photo URL is saved to MongoDB
✅ Photo appears in all locations (list, profile, edit drawer)
✅ Photo persists after page reload
✅ Photo persists after browser refresh
✅ Editing student without changing photo preserves the photo
✅ Changing photo replaces the old one
✅ No console errors
✅ No backend errors
