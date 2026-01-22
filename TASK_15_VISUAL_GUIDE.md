# Task 15 Visual Guide: Staff Module Timetable Management

## User Flow

```
Staff List Page
    │
    ├─ Click on Staff Member
    │
    ▼
Staff Dashboard
    │
    ├─ Tab: Overview (default)
    ├─ Tab: Attendance
    ├─ Tab: About
    ├─ Tab: Timetable ◄── NEW/UPDATED
    │   │
    │   └─ TeacherTimetableEditor Component
    │       ├─ Weekly Schedule Grid
    │       ├─ Period-based Time Slots
    │       ├─ Class Assignment per Period
    │       ├─ Subject Display (color-coded)
    │       ├─ Conflict Detection
    │       └─ Real-time Sync with Class Timetables
    │
    ├─ Tab: Assignments ◄── ENHANCED
    │   │
    │   └─ StaffAssignmentPanel Component
    │       ├─ View Subject-Class Assignments
    │       ├─ Add New Assignment (Subject + Classes)
    │       ├─ Remove Assignment
    │       └─ Validation & API Integration
    │
    ├─ Tab: Payroll
    └─ Tab: Documents
```

## Tab Structure Before vs After

### BEFORE
```
┌─────────────────────────────────────────────┐
│ Overview | Attendance | About | Timetable & │
│          |            |       | Plans       │
│          |            |       | (academics) │
└─────────────────────────────────────────────┘
```

### AFTER
```
┌─────────────────────────────────────────────┐
│ Overview | Attendance | About | Timetable | │
│          |            |       |           | │
│ Assignments | Payroll | Documents         │
└─────────────────────────────────────────────┘
```

## Timetable Tab Layout

```
┌────────────────────────────────────────────────────────┐
│  📅 Weekly Timetable                                   │
│  Manage class schedules and assignments                │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────┬─────────┬─────────┬─────────┬─────────┐    │
│  │ Time │ Monday  │ Tuesday │ Wed     │ Thu     │    │
│  ├──────┼─────────┼─────────┼─────────┼─────────┤    │
│  │ 8:00 │ 10-A    │ 10-B    │ 10-A    │ 10-C    │    │
│  │      │ Math    │ Math    │ Science │ Math    │    │
│  ├──────┼─────────┼─────────┼─────────┼─────────┤    │
│  │ 8:45 │ 9-A     │ 9-B     │ 9-A     │ 9-C     │    │
│  │      │ Math    │ Math    │ Math    │ Math    │    │
│  ├──────┼─────────┼─────────┼─────────┼─────────┤    │
│  │ 9:30 │ BREAK   │ BREAK   │ BREAK   │ BREAK   │    │
│  └──────┴─────────┴─────────┴─────────┴─────────┘    │
│                                                         │
│  [Conflict Indicators]                                 │
│  [Sync Status]                                         │
│                                                         │
└────────────────────────────────────────────────────────┘
```

## Assignments Tab Layout

```
┌────────────────────────────────────────────────────────┐
│  💼 Subject & Class Assignments                        │
│  Manage which subjects and classes this teacher can    │
│  teach                                                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Current Assignments:                                  │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Mathematics - 10-A, 10-B, 10-C          [Delete] │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ Science - 9-A, 9-B                      [Delete] │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  [+ Add New Assignment]                                │
│                                                         │
└────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Timetable Tab
- **Visual Grid**: Easy-to-read weekly schedule
- **Color Coding**: Different colors for different subjects
- **Interactive**: Click slots to edit assignments
- **Conflict Detection**: Visual indicators for scheduling conflicts
- **Real-time Sync**: Changes reflect immediately in class timetables

### 2. Assignments Tab
- **List View**: Clear display of all assignments
- **Quick Actions**: Add/remove assignments with one click
- **Validation**: Prevents invalid assignments
- **Multi-class Support**: Assign one subject to multiple classes

## Navigation Paths

### From Staff List to Timetable
1. Navigate to `/staffs`
2. Click on any staff member row
3. Automatically opens staff dashboard at `/staffs/:id`
4. Click "Timetable" tab
5. View/edit teacher's weekly schedule

### From Staff List to Assignments
1. Navigate to `/staffs`
2. Click on any staff member row
3. Automatically opens staff dashboard at `/staffs/:id`
4. Click "Assignments" tab
5. View/edit subject-class assignments

## Integration Points

### With Class Module
- Changes in teacher timetable → Updates class timetable
- Changes in class timetable → Updates teacher timetable
- Bidirectional synchronization ensures consistency

### With Conflict Detection
- Real-time validation when assigning classes
- Visual indicators for conflicts
- Prevents double-booking

### With Teacher Assignments
- Only shows classes where teacher is qualified
- Filters based on subject-class associations
- Validates assignments before saving

## Color Scheme

### Tab Icons
- 📅 Timetable: Pink theme (`bg-pink-50 text-pink-600`)
- 💼 Assignments: Blue theme (`bg-blue-50 text-blue-600`)

### Subject Colors
- Mathematics: Primary (blue)
- Science: Success (green)
- English: Warning (yellow)
- Hindi: Danger (red)
- Social Studies: Secondary (purple)
- Others: Default (gray)

## Responsive Design

### Desktop (>1024px)
- Full grid view with all days visible
- Side-by-side layout for assignments
- Expanded card views

### Tablet (768px - 1024px)
- Scrollable grid for timetable
- Stacked layout for assignments
- Compact card views

### Mobile (<768px)
- Single day view with navigation
- Vertical list for assignments
- Touch-optimized controls

## Accessibility

- Keyboard navigation support
- Screen reader friendly labels
- High contrast mode compatible
- Focus indicators on interactive elements
- ARIA labels for all actions

## Performance Considerations

- Lazy loading of timetable data
- Debounced API calls for updates
- Optimistic UI updates
- Cached assignment data
- Efficient re-rendering with React keys

## Error Handling

- Network error recovery
- Validation error messages
- Conflict resolution guidance
- Rollback on failed updates
- User-friendly error notifications
