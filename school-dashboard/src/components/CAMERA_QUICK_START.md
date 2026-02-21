# CameraCapture - Quick Start Guide

## 30-Second Integration

```jsx
import CameraCaptureModal from "./components/CameraCaptureModal";

function YourComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Add Photo</button>

      <CameraCaptureModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onPhotoCaptured={(file) => {
          console.log("Got photo:", file);
          // Upload or use file
        }}
      />
    </>
  );
}
```

## Integration Checklist

- [ ] Import CameraCaptureModal
- [ ] Add state for modal open/close
- [ ] Add button/trigger to open modal
- [ ] Implement `onPhotoCaptured` handler
- [ ] Handle upload to server
- [ ] Test on mobile and desktop

## Props Reference

| Prop | Type | Required |
|------|------|----------|
| `isOpen` | boolean | ✅ |
| `onClose` | function | ✅ |
| `onPhotoCaptured` | function | ✅ |
| `title` | string | ❌ |
| `description` | string | ❌ |

## Common Patterns

### Pattern 1: Avatar Click to Open
```jsx
<Avatar onClick={() => setIsOpen(true)} />
```

### Pattern 2: With Upload
```jsx
const handleCapture = async (file) => {
  const response = await uploadApi.uploadFile(file);
  setPhotoUrl(response.url);
  setIsOpen(false);
};
```

### Pattern 3: Delete Photo
```jsx
{photo && (
  <Button onClick={() => setPhoto(null)}>Delete</Button>
)}
```

## File Output

The `onPhotoCaptured` callback receives a **File object**:

```javascript
File {
  name: "profile_photo.jpg",
  type: "image/jpeg",
  size: 123456
}
```

## Browser Requirements

- ✅ HTTPS required (except localhost)
- ✅ Modern browser with getUserMedia support
- ✅ Camera permission required

## Testing

1. Open modal
2. Click "Take Photo"
3. Grant camera permission
4. Capture photo
5. Edit/crop in PhotoEditorModal
6. Save photo

## Troubleshooting

**Camera not working?**
- Check HTTPS
- Check browser permissions
- Check console for errors

**Photo not saving?**
- Check `onPhotoCaptured` implementation
- Verify upload API call
- Check network tab

## Need Help?

See full documentation: `CAMERA_CAPTURE_README.md`
See examples: `CameraCaptureExample.jsx`
