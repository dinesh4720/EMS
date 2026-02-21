# StudentRatingSystem - Quick Start Guide

## Installation

The component is already installed in your project at:
`school-dashboard/src/pages/students/components/StudentRatingSystem.jsx`

## Quick Integration

### Step 1: Import the component

```jsx
import StudentRatingSystem from './components/StudentRatingSystem';
```

### Step 2: Add state for ratings

```jsx
const [ratings, setRatings] = useState({});
```

### Step 3: Render the component

```jsx
<StudentRatingSystem
  studentId={student.id}
  ratings={ratings}
  onRatingChange={setRatings}
/>
```

## Full Example - Add to StudentOverview

In `school-dashboard/src/pages/students/StudentOverview.jsx`:

```jsx
import StudentRatingSystem from './components/StudentRatingSystem';

// In your component, add the ratings state
const [ratings, setRatings] = useState({});

// Fetch ratings when component mounts
useEffect(() => {
  const fetchRatings = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/students/${student.id}/ratings`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    }
  };

  fetchRatings();
}, [student.id]);

// Handle rating updates
const handleRatingChange = async (newRatings) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/students/${student.id}/ratings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
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

// In your JSX, add the component
<StudentRatingSystem
  studentId={student.id}
  ratings={ratings}
  onRatingChange={handleRatingChange}
/>
```

## API Endpoint Requirements

Your backend should support:

### GET `/api/students/:studentId/ratings`
Returns rating data for a student

Response:
```json
{
  "behaviour": {
    "rating": 4,
    "comment": "Excellent conduct",
    "lastUpdated": "2024-01-15T10:30:00Z"
  },
  "academics": {
    "rating": 5,
    "comment": "Top performer",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
  // ... other dimensions
}
```

### PUT `/api/students/:studentId/ratings`
Updates rating data for a student

Request body:
```json
{
  "behaviour": {
    "rating": 4,
    "comment": "Excellent conduct"
  },
  "academics": {
    "rating": 5,
    "comment": "Top performer"
  }
  // ... other dimensions
}
```

## Default Empty State

If no ratings exist, the component will display:
- Overall rating: "—"
- All dimensions: "Not rated"
- Edit button to start adding ratings

## Common Use Cases

### 1. Teacher View (Editable)
```jsx
<StudentRatingSystem
  studentId={student.id}
  ratings={ratings}
  onRatingChange={handleRatingChange}
  editable={true}
/>
```

### 2. Parent/Student View (Read-only)
```jsx
<StudentRatingSystem
  studentId={student.id}
  ratings={ratings}
  onRatingChange={() => {}}
  editable={false}
/>
```

### 3. Admin View (Controlled Edit)
```jsx
const [isEditing, setIsEditing] = useState(false);

<StudentRatingSystem
  studentId={student.id}
  ratings={ratings}
  onRatingChange={handleRatingChange}
  editable={true}
  isEditing={isEditing}
/>
```

## Tips

1. **Initialize with empty state** if no ratings exist yet
2. **Handle loading states** while fetching from API
3. **Show error messages** if API calls fail
4. **Add proper authorization** in API calls
5. **Validate ratings** before saving (component does this automatically)

## Styling Customization

The component uses Tailwind CSS classes. To customize:

1. Copy the component file
2. Modify color classes (e.g., `bg-primary-50`, `text-success`)
3. Adjust spacing classes (e.g., `p-6`, `gap-4`)
4. Change border radius (e.g., `rounded-2xl`)

Common customization points:
- Header gradient: `from-primary-50 via-purple-50 to-blue-50`
- Card shadow: `shadow-sm`
- Border radius: `rounded-2xl`
- Icon colors: `text-primary`, `text-success`, `text-warning`, `text-danger`

## Testing

Test the component with:

```jsx
// Test empty state
<StudentRatingSystem
  studentId="test-1"
  ratings={{}}
  onRatingChange={() => {}}
/>

// Test with all 5 stars
<StudentRatingSystem
  studentId="test-2"
  ratings={{
    behaviour: { rating: 5, comment: "Excellent" },
    academics: { rating: 5, comment: "Perfect" },
    extraCurricular: { rating: 5, comment: "Outstanding" },
    attendance: { rating: 5, comment: "Perfect" },
    discipline: { rating: 5, comment: "Exemplary" }
  }}
  onRatingChange={() => {}}
/>

// Test with mixed ratings
<StudentRatingSystem
  studentId="test-3"
  ratings={{
    behaviour: { rating: 4, comment: "Very good" },
    academics: { rating: 3, comment: "Good" },
    extraCurricular: { rating: 2, comment: "Needs work" },
    attendance: { rating: 5, comment: "Perfect" },
    discipline: { rating: 3, comment: "Good" }
  }}
  onRatingChange={() => {}}
/>
```

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review the example.jsx file for usage patterns
3. Check the component source code for implementation details

## Files Created

1. **StudentRatingSystem.jsx** (13.5 KB)
   - Main component with all functionality
   - Interactive star rating
   - Edit/view modes
   - Responsive design

2. **StudentRatingSystem.example.jsx** (4.1 KB)
   - 5 complete usage examples
   - API integration example
   - Different use cases

3. **StudentRatingSystem.README.md** (6.8 KB)
   - Complete documentation
   - Props reference
   - API structure
   - Styling guide

4. **StudentRatingSystem.quickstart.md** (This file)
   - Quick integration guide
   - API requirements
   - Common use cases
