# StudentRatingSystem Component

A beautiful, interactive component for tracking and displaying student ratings across multiple dimensions.

## Features

- **5 Rating Dimensions**: Behaviour, Academics, Extra Curricular, Attendance, and Discipline
- **Interactive Star Rating**: Click-to-rate interface with hover effects
- **Overall Rating Calculation**: Automatic average of all dimensions
- **Color-Coded Feedback**:
  - 4-5 stars: Green (Excellent/Very Good)
  - 3 stars: Yellow (Good)
  - 1-2 stars: Red (Needs Improvement)
- **Comment System**: Add remarks for each dimension
- **Edit/View Modes**: Toggle between editing and viewing
- **Responsive Design**: Works perfectly on mobile and desktop
- **Smooth Animations**: Slide-up animations and hover effects
- **Last Updated Tracking**: Shows when ratings were last modified

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `studentId` | `string` | **required** | Unique identifier for the student |
| `ratings` | `object` | `{}` | Rating data for each dimension |
| `onRatingChange` | `function` | **required** | Callback when ratings are updated |
| `editable` | `boolean` | `true` | Whether the current user can edit ratings |
| `isEditing` | `boolean` | `false` | External control for edit mode |

## Rating Data Structure

```javascript
{
  behaviour: {
    rating: 4,              // 1-5 stars
    comment: "Excellent",   // Optional comment
    lastUpdated: "2024-01-15T10:30:00Z"  // ISO timestamp
  },
  academics: {
    rating: 5,
    comment: "Top performer",
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  extraCurricular: {
    rating: 3,
    comment: "Active in sports",
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  attendance: {
    rating: 5,
    comment: "Perfect attendance",
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  discipline: {
    rating: 4,
    comment: "Well behaved",
    lastUpdated: "2024-01-15T10:30:00Z"
  }
}
```

## Usage Examples

### Basic Usage

```jsx
import { useState } from 'react';
import StudentRatingSystem from './components/StudentRatingSystem';

function StudentProfile() {
  const [ratings, setRatings] = useState({});

  return (
    <StudentRatingSystem
      studentId="student-123"
      ratings={ratings}
      onRatingChange={setRatings}
    />
  );
}
```

### With Existing Ratings

```jsx
const [ratings, setRatings] = useState({
  behaviour: { rating: 4, comment: "Excellent conduct" },
  academics: { rating: 5, comment: "Top performer" },
  extraCurricular: { rating: 3, comment: "Participates in sports" },
  attendance: { rating: 5, comment: "Perfect attendance" },
  discipline: { rating: 4, comment: "Follows rules well" }
});

<StudentRatingSystem
  studentId="student-456"
  ratings={ratings}
  onRatingChange={setRatings}
/>
```

### Read-Only Mode (Parents/Students)

```jsx
<StudentRatingSystem
  studentId="student-789"
  ratings={ratings}
  onRatingChange={() => {}}
  editable={false}
/>
```

### External Edit Control

```jsx
const [isEditing, setIsEditing] = useState(false);

<StudentRatingSystem
  studentId="student-101"
  ratings={ratings}
  onRatingChange={setRatings}
  editable={true}
  isEditing={isEditing}
/>

<button onClick={() => setIsEditing(!isEditing)}>
  {isEditing ? "Cancel" : "Edit Ratings"}
</button>
```

## API Integration Example

```jsx
function StudentRatingWithAPI({ studentId }) {
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch ratings on mount
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await fetch(`/api/students/${studentId}/ratings`);
        const data = await response.json();
        setRatings(data);
      } catch (error) {
        console.error('Failed to fetch ratings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [studentId]);

  // Save ratings to API
  const handleRatingChange = async (newRatings) => {
    try {
      const response = await fetch(`/api/students/${studentId}/ratings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRatings)
      });

      if (response.ok) {
        setRatings(newRatings);
        toast.success('Ratings updated successfully');
      }
    } catch (error) {
      console.error('Failed to update ratings:', error);
      toast.error('Failed to update ratings');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <StudentRatingSystem
      studentId={studentId}
      ratings={ratings}
      onRatingChange={handleRatingChange}
      editable={true}
    />
  );
}
```

## Features in Detail

### 1. Interactive Star Rating
- Click stars to set rating (1-5)
- Hover preview with animated feedback
- Color-coded based on rating value

### 2. Overall Rating
- Automatically calculates average
- Large, prominent display
- Color-coded (green/yellow/red)

### 3. Comments
- Add remarks for each dimension
- Shown in italic quotes in view mode
- Editable textarea in edit mode

### 4. Validation
- All dimensions must be rated before saving
- Toast notifications for errors
- Disabled save button until valid

### 5. Responsive Design
- Mobile-first approach
- Stacked layout on small screens
- Side-by-side on larger screens

### 6. Animations
- Staggered slide-up on load
- Pulse effect on hover
- Smooth color transitions

## Styling

The component uses:
- **Tailwind CSS** for utility classes
- **HeroUI** component library (Card, Button, Textarea, Chip)
- **Lucide React** icons (Star, Award, Clock, TrendingUp, etc.)
- **React Hot Toast** for notifications

Color scheme:
- Primary: Blue/purple gradient header
- Success (4-5 stars): Green
- Warning (3 stars): Yellow
- Danger (1-2 stars): Red
- Default: Neutral grays

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- ARIA labels where appropriate
- Clear visual feedback
- High contrast ratios

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

```json
{
  "react": "^18.0.0",
  "@heroui/react": "^2.0.0",
  "lucide-react": "^0.300.0",
  "react-hot-toast": "^2.4.0"
}
```

## File Structure

```
src/pages/students/components/
├── StudentRatingSystem.jsx       # Main component
├── StudentRatingSystem.example.jsx  # Usage examples
└── StudentRatingSystem.README.md    # This file
```

## License

This component is part of the EMS School Dashboard project.
