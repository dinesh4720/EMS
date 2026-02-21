# CameraCapture Component System

A modern, mobile-friendly camera capture system for profile picture uploads with seamless integration into your existing photo editing workflow.

## Components

### 1. CameraCaptureModal
The main entry point that provides two options for photo capture:
- **Upload from Device**: Opens file picker
- **Take Photo with Camera**: Opens live camera view

### 2. CameraView
Fullscreen camera interface with:
- Live camera preview
- Front/back camera switching (mobile)
- Photo capture with instant preview
- Retake/confirm options
- Comprehensive error handling

## Features

### User Flow
```
User clicks profile photo
    ↓
CameraCaptureModal opens
    ↓
User chooses:
    ├─ Upload from Device → File picker → PhotoEditorModal → Save
    └─ Take Photo → CameraView → Capture → PhotoEditorModal → Save
```

### Key Features
- **Mobile-First Design**: Optimized for mobile camera usage
- **Camera Switching**: Front/back camera toggle on supported devices
- **Error Handling**: Graceful handling of camera permissions and device errors
- **Preview & Retake**: Instant preview after capture with retake option
- **Seamless Editing**: Integrates with existing PhotoEditorModal
- **Responsive UI**: Works beautifully on desktop and mobile

## Installation

The components are already installed in your project at:
- `school-dashboard/src/components/CameraCaptureModal.jsx`
- `school-dashboard/src/components/CameraView.jsx`

## Usage

### Basic Integration

```jsx
import CameraCaptureModal from "./components/CameraCaptureModal";

function MyComponent() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handlePhotoCaptured = (file) => {
    // file is a File object containing the edited photo
    console.log("Photo captured:", file);

    // Upload to server or process as needed
    // Example: uploadApi.uploadFile(file)

    setIsCameraOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsCameraOpen(true)}>
        Add Photo
      </button>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
      />
    </>
  );
}
```

### Integration with AddStudent.jsx

Replace the existing file input with CameraCaptureModal:

```jsx
// In AddStudent.jsx
import CameraCaptureModal from "../../components/CameraCaptureModal";

// Add state
const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);

// Replace the profile photo section
{formData.picture ? (
  <Avatar
    src={formData.picture instanceof File ? URL.createObjectURL(formData.picture) : formData.picture}
    className="w-20 h-20 text-3xl cursor-pointer"
    onClick={() => setIsCameraCaptureOpen(true)}
  />
) : (
  <div
    className="w-20 h-20 rounded-full border-2 border-default-200 bg-default-50 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors"
    onClick={() => setIsCameraCaptureOpen(true)}
  >
    <User size={32} className="text-default-400" />
  </div>
)}

// Add modal at component root
<CameraCaptureModal
  isOpen={isCameraCaptureOpen}
  onClose={() => setIsCameraCaptureOpen(false)}
  onPhotoCaptured={(file) => {
    updateField("picture", file);
    setIsCameraCaptureOpen(false);
  }}
/>
```

### Integration with StudentProfileHeader.jsx

```jsx
// In StudentProfileHeader.jsx
import CameraCaptureModal from "../../../components/CameraCaptureModal";

// Add state
const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);

// Remove fileInputRef and handleFileSelect
// Replace camera icon click with:
<div
  className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-default-200 cursor-pointer hover:bg-default-50 transition-colors"
  onClick={() => setIsCameraCaptureOpen(true)}
  title="Change photo"
>
  <Camera size={14} className="text-default-600" />
</div>

// Add modal
<CameraCaptureModal
  isOpen={isCameraCaptureOpen}
  onClose={() => setIsCameraCaptureOpen(false)}
  onPhotoCaptured={async (file) => {
    const loadingToast = toast.loading("Uploading photo...");
    try {
      // Upload to Cloudinary
      const response = await uploadApi.uploadFile(file);

      // Update student photo
      const token = getAuthToken();
      await fetch(`${import.meta.env.VITE_API_URL}/api/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ photo: response.url }),
      });

      toast.success("Photo updated successfully", { id: loadingToast });
      window.location.reload();
    } catch (error) {
      toast.error("Photo upload failed: " + error.message, { id: loadingToast });
    }
  }}
/>
```

## Props API

### CameraCaptureModal

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | boolean | Yes | - | Controls modal visibility |
| `onClose` | function | Yes | - | Called when modal is closed |
| `onPhotoCaptured` | function | Yes | - | Called with final photo (File object) |
| `title` | string | No | "Add Profile Photo" | Modal title override |
| `description` | string | No | "Choose how you'd like..." | Modal description override |

### CameraView

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onCapture` | function | Yes | Called with captured photo (File object) |
| `onClose` | function | Yes | Close handler |

## Error Handling

The system handles various camera errors gracefully:

- **Permission Denied**: User denied camera access
- **No Camera**: Device has no camera
- **Camera in Use**: Another app is using the camera
- **General Errors**: Fallback error message

Each error shows:
1. Toast notification
2. In-modal error message
3. "Try Again" button
4. "Close" button

## Browser Support

- ✅ Chrome/Edge (desktop & mobile)
- ✅ Firefox (desktop & mobile)
- ✅ Safari (desktop & mobile)
- ✅ Samsung Internet
- ❌ IE (not supported)

## HTTPS Requirement

Camera access requires HTTPS in production:
- Local development: Works on `http://localhost`
- Production: Must use `https://`

## File Output

The `onPhotoCaptured` callback receives a **File object** with:
```javascript
{
  name: "profile_photo.jpg",
  type: "image/jpeg",
  size: 123456, // bytes
  // ... standard File properties
}
```

You can:
- Upload directly to your server
- Convert to FormData for API calls
- Use with existing upload utilities

## Styling

The components use:
- **Tailwind CSS** for styling
- **HeroUI** components for modals and buttons
- **Lucide React** for icons

Custom styling can be done by modifying the component files directly.

## Permissions

When users first access the camera:
1. Browser will prompt for camera permission
2. User must click "Allow"
3. If denied, error message appears with retry option

## Testing Camera Functionality

To test camera functionality:
1. Open the component on a device with a camera
2. Click "Take Photo with Camera"
3. Grant camera permissions when prompted
4. Test capture, retake, and confirm flow
5. Test camera switching (on mobile devices)

### Testing on Desktop
- Use your computer's webcam
- Most laptops have built-in cameras
- External USB cameras work too

### Testing on Mobile
- Works with both front and back cameras
- Camera switching button appears on supported devices
- Touch-optimized controls

## Troubleshooting

### Camera not starting
- Check browser console for errors
- Ensure HTTPS (or localhost)
- Verify camera permissions in browser settings
- Try closing other apps that might be using the camera

### Poor image quality
- The system captures at 1280x720 by default
- Adjust `ideal` constraints in CameraView.jsx if needed

### Camera not switching on mobile
- Some devices don't support camera switching
- The switch button will still appear but may not work
- This is a browser/device limitation

## Example Integration Files

- `AddStudent.jsx` - Student admission form
- `AddStaff.jsx` - Staff admission form
- `StudentProfileHeader.jsx` - Student profile page
- `StaffDashboard.jsx` - Staff profile page
- `StudentOverview.jsx` - Student overview page

## Future Enhancements

Potential improvements:
- Video recording support
- Filters and effects
- Timer/delayed capture
- Multiple photo capture
- Photo gallery selection
- Cloud integration
