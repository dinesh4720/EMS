/**
 * PhotoModal & PhotoAvatar Usage Examples
 *
 * This file demonstrates how to use the PhotoModal and PhotoAvatar components
 * in your school dashboard application.
 */

import PhotoModal from "./PhotoModal";
import PhotoAvatar from "./PhotoAvatar";

// ============================================
// EXAMPLE 1: Using PhotoAvatar (Recommended)
// ============================================
export function Example1_PhotoAvatar() {
  return (
    <div className="p-8 space-y-8">
      {/* Student avatar with blue color scheme */}
      <PhotoAvatar
        src="https://example.com/student-photo.jpg"
        alt="Student photo"
        name="John Doe"
        size="md"
        type="student"
      />

      {/* Staff avatar with indigo/purple color scheme */}
      <PhotoAvatar
        src="https://example.com/staff-photo.jpg"
        alt="Staff photo"
        name="Jane Smith"
        size="md"
        type="staff"
      />

      {/* Small size - for compact lists */}
      <PhotoAvatar
        src="https://example.com/photo.jpg"
        alt="Student photo"
        name="Bob Johnson"
        size="sm"
      />

      {/* Medium size - for table rows */}
      <PhotoAvatar
        src="https://example.com/photo.jpg"
        alt="Student photo"
        name="Alice Williams"
        size="md"
      />

      {/* Large size - for cards */}
      <PhotoAvatar
        src="https://example.com/photo.jpg"
        alt="Student photo"
        name="Charlie Brown"
        size="lg"
      />

      {/* Extra large size - for profile headers */}
      <PhotoAvatar
        src="https://example.com/photo.jpg"
        alt="Student photo"
        name="Diana Prince"
        size="xl"
      />

      {/* Without photo (shows initials) - Student */}
      <PhotoAvatar
        src={null}
        alt="Student photo"
        name="Eve Davis"
        size="lg"
        type="student"
      />

      {/* Without photo (shows initials) - Staff */}
      <PhotoAvatar
        src={null}
        alt="Staff photo"
        name="Frank Miller"
        size="lg"
        type="staff"
      />

      {/* With custom click handler */}
      <PhotoAvatar
        src="https://example.com/photo.jpg"
        alt="Staff photo"
        name="Grace Lee"
        size="md"
        type="staff"
        onClick={() => console.log("Avatar clicked!")}
      />
    </div>
  );
}

// ============================================
// EXAMPLE 2: Using PhotoModal Directly
// ============================================
export function Example2_PhotoModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <button onClick={() => setIsOpen(true)}>
        Open Photo Modal
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

// ============================================
// EXAMPLE 3: Real-world Usage - Student Card
// ============================================
export function Example3_StudentCard({ student }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <div className="flex items-center gap-4">
        {/* Clickable avatar with modal - Student type */}
        <PhotoAvatar
          src={student.photo}
          alt={student.name}
          name={student.name}
          size="lg"
          type="student"
        />

        <div>
          <h3 className="font-semibold">{student.name}</h3>
          <p className="text-sm text-gray-500">{student.class}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 4: Real-world Usage - Staff List
// ============================================
export function Example4_StaffRow({ staff }) {
  return (
    <tr className="hover:bg-gray-50">
      <td>
        <PhotoAvatar
          src={staff.picture}
          alt={staff.name}
          name={staff.name}
          size="md"
          type="staff"
        />
      </td>
      <td>{staff.name}</td>
      <td>{staff.role}</td>
      <td>{staff.department}</td>
    </tr>
  );
}

// ============================================
// EXAMPLE 5: Custom Styling
// ============================================
export function Example5_CustomStyling() {
  return (
    <div className="p-8 space-y-4">
      {/* With custom className */}
      <PhotoAvatar
        src="https://example.com/photo.jpg"
        alt="Student photo"
        name="Custom styled"
        size="lg"
        className="ring-4 ring-primary ring-offset-2"
      />

      {/* With onClick for custom behavior */}
      <PhotoAvatar
        src="https://example.com/photo.jpg"
        alt="Student photo"
        name="Click handler"
        size="md"
        onClick={(e) => {
          e.stopPropagation();
          // Custom navigation or action
          console.log("Custom action!");
        }}
      />
    </div>
  );
}

// ============================================
// FEATURES SUMMARY
// ============================================
/**
 * PhotoAvatar Component Features:
 * - ✅ Clickable avatar that opens modal
 * - ✅ Falls back to beautiful initials with gradient colors
 * - ✅ 4 size options: sm, md, lg, xl
 * - ✅ Type-based color schemes: "student" (blue), "staff" (indigo/purple)
 * - ✅ Smooth hover/tap animations using framer-motion
 * - ✅ Custom click handlers supported
 * - ✅ Keyboard accessible (Enter/Space to open)
 * - ✅ Fully accessible with ARIA labels
 * - ✅ Auto-generates initials from name
 * - ✅ Type-specific color palettes for visual distinction
 *
 * PhotoModal Component Features:
 * - ✅ Smooth fade-in/scale animations
 * - ✅ Backdrop blur effect
 * - ✅ Close on backdrop click
 * - ✅ Close on Escape key
 * - ✅ Close button (X) in corner
 * - ✅ Loading spinner while image loads
 * - ✅ Error state if image fails
 * - ✅ Responsive sizing (max 80vh height)
 * - ✅ Keyboard hint at bottom
 * - ✅ Prevents body scroll when open
 * - ✅ Full accessibility support
 */
