# PhotoModal & PhotoAvatar Components

Beautiful, accessible photo viewing components for your school dashboard.

## Features

### PhotoAvatar
- **Clickable avatars** that open a full-size modal
- **Smart fallbacks** - shows initials with gradient colors when no photo
- **4 sizes** - sm, md, lg, xl for different UI contexts
- **Smooth animations** - hover and tap effects using framer-motion
- **Keyboard accessible** - Enter/Space to open modal
- **Auto-initials** - extracts first letter of first/last name
- **Color variety** - 5 gradient colors assigned based on name

### PhotoModal
- **Cinematic animations** - fade-in with scale effect
- **Backdrop blur** - modern glassmorphism effect
- **Multiple close methods**:
  - Click backdrop
  - Press Escape
  - Click X button
- **Loading states** - spinner while image loads
- **Error handling** - friendly error message on failure
- **Responsive** - max 80vh height, auto width
- **Accessibility** - ARIA labels, keyboard navigation, focus management
- **Body scroll lock** - prevents scrolling when modal is open

## Installation

Components are already installed. Just import them:

```jsx
import PhotoModal from "./components/PhotoModal";
import PhotoAvatar from "./components/PhotoAvatar";
```

## Usage

### PhotoAvatar (Recommended)

The easiest way to add clickable photos:

```jsx
import PhotoAvatar from "./components/PhotoAvatar";

function StudentList({ students }) {
  return (
    <div>
      {students.map(student => (
        <PhotoAvatar
          key={student.id}
          src={student.photo}           // Image URL (optional)
          alt={student.name}            // Alt text for accessibility
          name={student.name}           // Name for initials fallback
          size="md"                     // sm | md | lg | xl
          onClick={() => console.log("clicked!")} // Optional
        />
      ))}
    </div>
  );
}
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `src` | string | No | - | Image URL |
| `alt` | string | No | "Profile photo" | Alt text for accessibility |
| `name` | string | No | "User" | Used for initials fallback |
| `size` | string | No | "md" | Size: sm, md, lg, xl |
| `className` | string | No | "" | Additional CSS classes |
| `onClick` | function | No | - | Custom click handler |

#### Sizes

- **sm** - 32px (w-8 h-8) - Compact lists, tables
- **md** - 40px (w-10 h-10) - Standard table rows
- **lg** - 64px (w-16 h-16) - Cards, detail views
- **xl** - 80px (w-20 h-20) - Profile headers, hero sections

### PhotoModal (Advanced)

Use PhotoModal directly when you need custom control:

```jsx
import { useState } from "react";
import PhotoModal from "./components/PhotoModal";

function PhotoGallery() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        View Photo
      </button>

      <PhotoModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        src="https://example.com/large-photo.jpg"
        alt="Student name - Class 10A"
      />
    </div>
  );
}
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | boolean | Yes | - | Controls modal visibility |
| `onClose` | function | Yes | - | Called when modal closes |
| `src` | string | Yes | - | Image URL to display |
| `alt` | string | No | "Photo" | Alt text and title |

## Examples

### Student Card

```jsx
function StudentCard({ student }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <div className="flex items-center gap-4">
        <PhotoAvatar
          src={student.photo}
          alt={student.name}
          name={student.name}
          size="lg"
        />
        <div>
          <h3 className="font-semibold">{student.name}</h3>
          <p className="text-sm text-gray-500">{student.class}</p>
        </div>
      </div>
    </div>
  );
}
```

### Staff List Table

```jsx
function StaffTable({ staff }) {
  return (
    <table>
      <tbody>
        {staff.map(member => (
          <tr key={member.id}>
            <td>
              <PhotoAvatar
                src={member.picture}
                alt={member.name}
                name={member.name}
                size="md"
              />
            </td>
            <td>{member.name}</td>
            <td>{member.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Profile Header with Upload

```jsx
function ProfileHeader({ student, onUpload }) {
  const fileInputRef = useRef(null);

  return (
    <div className="flex items-center gap-4">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={onUpload}
      />

      <PhotoAvatar
        src={student.photo}
        alt={student.name}
        name={student.name}
        size="xl"
      />

      <button onClick={() => fileInputRef.current?.click()}>
        Change Photo
      </button>
    </div>
  );
}
```

## Accessibility

### Keyboard Navigation
- **Tab** - Focus on avatar
- **Enter/Space** - Open modal (when focused on avatar)
- **Escape** - Close modal

### Screen Readers
- Avatars have `aria-label` describing the action
- Modal has `role="dialog"` and `aria-modal="true"`
- Focus is trapped within modal when open
- Focus returns to trigger element on close

### ARIA Labels
```jsx
<PhotoAvatar
  src={photo}
  alt="John Doe"
  name="John Doe"
  // Generates: "View full-size photo of John Doe"
/>
```

## Styling

### Custom Styling with className

```jsx
<PhotoAvatar
  src={photo}
  name="John"
  size="lg"
  className="ring-4 ring-primary ring-offset-2"
/>
```

### Default Colors

Initials avatars use 5 gradient colors:
- Secondary (teal) - default
- Primary (blue)
- Success (green)
- Warning (orange)
- Danger (red)

Colors are assigned based on the first character of the name for consistency.

## Technical Details

### Dependencies
- **framer-motion** - Smooth animations
- **lucide-react** - X icon for close button
- **React** - Hooks and state management

### Performance
- Animations use CSS transforms (GPU accelerated)
- Images load lazily when modal opens
- Event listeners cleaned up on unmount
- Body scroll lock prevents layout shifts

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Files

- `src/components/PhotoModal.jsx` - Modal component
- `src/components/PhotoAvatar.jsx` - Avatar wrapper component
- `src/components/PhotoAvatar.example.jsx` - Usage examples

## Integration Status

✅ **StudentsList.jsx** - PhotoAvatar integrated
✅ **StudentProfileHeader.jsx** - PhotoAvatar integrated
✅ **StaffList.jsx** - PhotoAvatar integrated

All student and staff views now have clickable, expandable photos!

## Design Philosophy

These components follow the design principles of your school dashboard:
- **Modern & Clean** - Minimal design with smooth animations
- **Accessible** - Full keyboard and screen reader support
- **Performant** - Optimized animations and lazy loading
- **Beautiful** - Gradient colors, backdrop blur, smooth transitions
- **Consistent** - Matches your existing design system (Tailwind + HeroUI)

## Tips

1. **Always provide a name** - Even without a photo, initials look great
2. **Use appropriate sizes** - sm for dense tables, xl for profile headers
3. **Consider the context** - Table rows work well with md size
4. **Test with screen readers** - Ensure accessibility
5. **Handle errors** - The modal shows a friendly error if image fails to load

## Future Enhancements

Potential features for future versions:
- [ ] Zoom in/out controls
- [ ] Previous/Next navigation for galleries
- [ ] Download button
- [ ] Image info display (dimensions, size, date)
- [ ] Thumbnail strip for multiple photos
- [ ] Full-screen mode
- [ ] Print functionality

---

**Created:** 2025-01-24
**Version:** 1.0.0
**Status:** Production Ready ✅
