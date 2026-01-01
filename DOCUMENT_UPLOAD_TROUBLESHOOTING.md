# Document Upload Troubleshooting

## Error: "Upload failed" with 500 status

### Possible Causes

1. **Cloudinary credentials not configured**
2. **File size too large**
3. **Cloudinary timeout**
4. **Network issues**

### Solutions

#### 1. Check Cloudinary Credentials

Verify your `backend/.env` file has these variables:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**How to get credentials:**
1. Go to https://cloudinary.com/
2. Sign up or log in
3. Go to Dashboard
4. Copy Cloud Name, API Key, and API Secret
5. Add them to `backend/.env`

#### 2. Check File Size

Current limit: **10MB per file**

**If files are too large:**
- Compress PDFs before uploading
- Use online tools like https://www.ilovepdf.com/compress_pdf
- Or increase the limit in `backend/server.js`:

```javascript
const upload = multer({ 
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // Increase to 20MB
  }
});
```

#### 3. Check Backend Logs

Look for these log messages in your backend console:

**Success:**
```
📤 Upload request received
📄 File received: filename.pdf Size: 1234567 bytes Type: application/pdf
☁️ Attempting Cloudinary upload...
✅ Cloudinary upload successful: https://res.cloudinary.com/...
```

**Failure:**
```
📤 Upload request received
📄 File received: filename.pdf Size: 1234567 bytes Type: application/pdf
☁️ Attempting Cloudinary upload...
⚠️ Cloudinary upload failed, using base64 fallback: [error message]
```

**Common Error Messages:**

- `"No file uploaded"` - File not received by backend
- `"File size exceeds 10MB limit"` - File too large
- `"Invalid credentials"` - Cloudinary credentials wrong
- `"Timeout"` - Upload took too long

#### 4. Fallback to Base64

If Cloudinary fails, the system automatically falls back to base64 storage. This works but:
- ❌ Files stored in database (not recommended for large files)
- ❌ Slower page loads
- ✅ Works without Cloudinary

**To use base64 fallback:**
- Just upload the file
- System will automatically use base64 if Cloudinary fails
- You'll see a warning in backend logs

### Testing Steps

1. **Test with small file first** (< 1MB)
   - If this works, issue is file size
   
2. **Check backend console** for detailed error messages
   - Look for Cloudinary error details
   
3. **Verify Cloudinary credentials**
   - Test by uploading a photo (photos work = credentials OK)
   
4. **Try different file types**
   - PDF, JPG, PNG all supported
   - If one type fails, might be file corruption

### Improved Error Messages

After the fix, you'll see more detailed errors:

**Frontend:**
```
Upload failed: File size exceeds 10MB limit
Upload failed: Invalid Cloudinary credentials
Upload failed: Network timeout
```

**Backend:**
```
❌ File too large: 15728640 bytes
⚠️ Cloudinary upload failed: Invalid credentials
❌ Upload Error: Network timeout
```

### Quick Fixes

**Problem: All uploads fail**
- Solution: Check Cloudinary credentials in `backend/.env`

**Problem: Large PDFs fail**
- Solution: Compress PDFs or increase file size limit

**Problem: Uploads timeout**
- Solution: Increased timeout to 60 seconds (already done)

**Problem: Multiple files fail**
- Solution: Upload files one at a time or in smaller batches

### File Size Recommendations

| File Type | Recommended Size | Maximum Size |
|-----------|------------------|--------------|
| Photos (JPG/PNG) | < 2MB | 10MB |
| PDFs (few pages) | < 5MB | 10MB |
| PDFs (many pages) | Compress first | 10MB |
| Word docs | < 5MB | 10MB |

### Compression Tools

**For PDFs:**
- https://www.ilovepdf.com/compress_pdf
- https://smallpdf.com/compress-pdf
- Adobe Acrobat (Save As > Reduced Size PDF)

**For Images:**
- https://tinypng.com/
- https://compressor.io/
- Photoshop (Save for Web)

### Related Files
- `backend/server.js` - Upload endpoint with improved logging
- `school-dashboard/src/services/api.js` - Upload API with better error messages
- `backend/.env` - Cloudinary credentials

### Summary

The improved error handling now provides:
1. ✅ Detailed error messages from backend
2. ✅ File size validation
3. ✅ Cloudinary timeout increased to 60s
4. ✅ Automatic fallback to base64
5. ✅ Better logging for debugging

Check the backend console logs to see the exact error and follow the appropriate solution above.
