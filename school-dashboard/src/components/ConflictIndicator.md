# ConflictIndicator Component

## Overview

The `ConflictIndicator` component is a reusable React component designed to display scheduling conflicts in the timetable management system. It provides detailed conflict information and suggests resolution options to help administrators resolve scheduling issues.

## Features

### ✅ Task Requirements Completed

1. **Build UI for displaying conflict details** ✓
   - Card-based layout with clear visual hierarchy
   - Color-coded conflict types (danger, warning, default)
   - Responsive design that works on all screen sizes

2. **Show conflicting teacher, classes, day, and period** ✓
   - Teacher information with name and code
   - Time slot details (day and period)
   - List of all conflicting classes with subjects and rooms
   - Clear visual separation of information sections

3. **Implement displayConflictDetails method** ✓
   - Comprehensive method that formats conflict data
   - Displays different information based on conflict type
   - Shows teacher info, time slot, and conflict-specific details

4. **Add resolution suggestion logic** ✓
   - `suggestResolutions()` method generates context-aware options
   - Different suggestions for different conflict types:
     - Double booking: Remove current, choose different teacher, remove from specific class
     - Unqualified: Choose qualified teacher, update assignments
     - Invalid: Cancel assignment

5. **Provide options to resolve conflicts** ✓
   - Interactive resolution cards with icons
   - Clear descriptions for each option
   - Callback system to handle resolution actions

6. **Integrate with conflict resolution handlers** ✓
   - `onResolve` callback prop for parent components
   - Passes conflict and resolution data to parent
   - Integrated into Timetable.jsx and TeacherTimetableEditor.jsx

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `conflicts` | Array | `[]` | Array of conflict objects to display |
| `onResolve` | Function | - | Callback function when resolution is selected |
| `compact` | Boolean | `false` | Whether to show compact view (button only) |
| `className` | String | `""` | Additional CSS classes |

## Conflict Object Structure

```javascript
{
  type: 'double_booking' | 'unqualified' | 'invalid_assignment',
  teacherId: string,
  teacherName: string,
  teacherCode: string,
  day: string,
  periodIndex: number,
  message: string,
  
  // For double_booking type
  conflicts: [
    {
      classId: string,
      className: string,
      subject: string,
      room: string
    }
  ],
  
  // For unqualified type
  subject: string,
  classId: string,
  className: string
}
```

## Resolution Data Structure

When a resolution is selected, the `onResolve` callback receives:

```javascript
{
  conflict: Object,        // The original conflict object
  resolution: Object,      // The selected resolution option
  action: string,          // Action type: 'remove_current', 'choose_different', etc.
  classId: string          // (Optional) Class ID for class-specific actions
}
```

## Usage Examples

### Basic Usage

```jsx
import ConflictIndicator from '../../components/ConflictIndicator';

function MyComponent() {
  const [conflicts, setConflicts] = useState([]);

  const handleResolve = (resolutionData) => {
    const { action, conflict, classId } = resolutionData;
    
    if (action === 'remove_current') {
      // Remove the current assignment
      clearSlot();
    } else if (action === 'choose_different') {
      // Let user select different teacher
      resetTeacherSelection();
    }
  };

  return (
    <ConflictIndicator
      conflicts={conflicts}
      onResolve={handleResolve}
    />
  );
}
```

### Compact View

```jsx
<ConflictIndicator
  conflicts={conflicts}
  onResolve={handleResolve}
  compact={true}
/>
```

### With Custom Styling

```jsx
<ConflictIndicator
  conflicts={conflicts}
  onResolve={handleResolve}
  className="my-4 shadow-lg"
/>
```

## Conflict Types

### 1. Double Booking
When a teacher is assigned to multiple classes at the same time.

**Resolution Options:**
- Cancel this assignment
- Choose different teacher
- Remove from specific conflicting class

### 2. Unqualified Teacher
When a teacher is not assigned to teach a subject in a class.

**Resolution Options:**
- Choose qualified teacher
- Update teacher assignments

### 3. Invalid Assignment
When assignment data is incomplete or invalid.

**Resolution Options:**
- Cancel assignment

## Integration Points

### Timetable.jsx (Class Timetable View)
- Displays conflicts when assigning teachers to class slots
- Integrated in the slot editing modal
- Replaces inline conflict warning

### TeacherTimetableEditor.jsx (Teacher Timetable View)
- Shows all conflicts for a teacher
- Displays at the top of the timetable
- Replaces the previous conflict card

## Visual Design

- **Colors:**
  - Danger (red): Double booking conflicts
  - Warning (yellow): Unqualified teacher
  - Default (gray): Invalid assignments

- **Icons:**
  - AlertTriangle: Main conflict indicator
  - X: Remove/cancel actions
  - RefreshCw: Change/switch actions
  - UserX: Remove from class
  - Info: Information/update actions

- **Layout:**
  - Full view: Card with detailed information
  - Compact view: Button with conflict count
  - Modal: Detailed view with resolution options

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support (via HeroUI components)
- Clear visual indicators for different states

## Requirements Validation

This component satisfies the following requirements from the design document:

- **Requirement 6.1**: Detects and displays teacher conflicts
- **Requirement 6.2**: Shows conflict error messages
- **Requirement 6.3**: Prevents invalid assignments
- **Requirement 6.4**: Displays conflicting class and time slot details
- **Requirement 6.5**: Provides resolution options

## Testing

See `ConflictIndicator.test.jsx` for example usage and test scenarios.

## Future Enhancements

Potential improvements for future versions:

1. Bulk conflict resolution
2. Conflict history tracking
3. Automatic conflict resolution suggestions based on AI
4. Export conflict reports
5. Email notifications for conflicts
6. Conflict prevention warnings before saving

## Dependencies

- @heroui/react: UI components
- lucide-react: Icons
- React: Core framework

## Browser Support

Works in all modern browsers that support:
- ES6+ JavaScript
- CSS Grid and Flexbox
- React 18+
