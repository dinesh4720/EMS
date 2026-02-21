# Class Teacher Assignment UI - Visual Mockup

## Desktop View (1920px)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│  👥 Class Teacher Management                                                               │
│  3 assigned • 2 available • 1 unassigned classes                                          │
│                                                                    🔍 Search teachers...  × │
└────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  ℹ️ How to use:                                                                             │
│  • Click "Assign" on available teachers to assign them to unassigned classes               │
│  • Click the refresh icon on assigned classes to swap or replace the teacher               │
│  • Drag and drop functionality coming soon!                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────┬──────────────────────────────────────────────────┐
│ ✓ Assigned Teachers                      │  👥 Available Teachers                           │
│ 3 teachers with class assignments        │  2 teachers without assignments                  │
├──────────────────────────────────────────┼──────────────────────────────────────────────────┤
│                                          │                                                  │
│ ┌────────────────────────────────────┐  │  ┌────────────────────────────────────────────┐ │
│ │ [Photo] John Doe                   │  │  │ [Photo] Jane Smith                         │ │
│ │         Mathematics                │  │  │         Science                            │ │
│ │         [1 Class]                  │  │  │         [Available]                        │ │
│ │                                    │  │  └────────────────────────────────────────────┘ │
│ │   ┌──────────────────────────┐    │  │                                                  │
│ │   │ [10] Class 10-A    🔄  × │    │  │  ┌────────────────────────────────────────────┐ │
│ │   │      45 students         │    │  │  │ [Photo] Bob Wilson                         │ │
│ │   └──────────────────────────┘    │  │  │         English                            │ │
│ └────────────────────────────────────┘  │  │         [Available]                        │ │
│                                          │  └────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐  │                                                  │
│ │ [Photo] Mary Johnson               │  │  ⚠ Unassigned Classes                           │
│ │         Science                    │  │  1 classes need teachers                        │
│ │         [1 Class]                  │  │  ────────────────────────────────────────────   │
│ │                                    │  │                                                  │
│ │   ┌──────────────────────────┐    │  │  ┌────────────────────────────────────────────┐ │
│ │   │ [9] Class 9-A      🔄  × │    │  │  │ [9] Class 9-B              [Assign]        │ │
│ │   │     42 students          │    │  │  │     38 students                            │ │
│ │   └──────────────────────────┘    │  │  └────────────────────────────────────────────┘ │
│ └────────────────────────────────────┘  │                                                  │
│                                          │                                                  │
│ ┌────────────────────────────────────┐  │                                                  │
│ │ [Photo] David Lee                  │  │                                                  │
│ │         Physics                    │  │                                                  │
│ │         [1 Class]                  │  │                                                  │
│ │                                    │  │                                                  │
│ │   ┌──────────────────────────┐    │  │                                                  │
│ │   │ [11] Class 11-A    🔄  × │    │  │                                                  │
│ │   │      40 students         │    │  │                                                  │
│ │   └──────────────────────────┘    │  │                                                  │
│ └────────────────────────────────────┘  │                                                  │
│                                          │                                                  │
└──────────────────────────────────────────┴──────────────────────────────────────────────────┘
```

## Modal: Assign Teacher to Unassigned Class

```
┌─────────────────────────────────────────────────────────────┐
│  ✓ Assign Teacher                                           │
│  For Class 9-B                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  ⚠ Unassigned Class                                   │ │
│  │  [9] Class 9-B                                        │ │
│  │      38 students                                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Select a teacher to assign:                                │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Photo] Jane Smith                    [Available]     │ │
│  │         Science                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Photo] Bob Wilson                    [Available]     │ │
│  │         English                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                    [Cancel]                 │
└─────────────────────────────────────────────────────────────┘
```

## Modal: Replace or Swap Teacher

```
┌─────────────────────────────────────────────────────────────┐
│  🔄 Replace or Swap Teacher                                 │
│  For Class 10-A                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Currently Assigned:                                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Photo] John Doe                                      │ │
│  │         Mathematics                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Choose an option:                                          │
│                                                             │
│  Swap with another assigned teacher:                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Photo] Mary Johnson                            ↔     │ │
│  │         Science                                       │ │
│  │         Currently: Class 9-A                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Photo] David Lee                               ↔     │ │
│  │         Physics                                       │ │
│  │         Currently: Class 11-A                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Replace with available teacher:                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Photo] Jane Smith                    [Available]     │ │
│  │         Science                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Photo] Bob Wilson                    [Available]     │ │
│  │         English                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                    [Cancel]                 │
└─────────────────────────────────────────────────────────────┘
```

## Modal: Confirm Swap

```
┌─────────────────────────────────────────────────────────────┐
│  🔄 Replace or Swap Teacher                                 │
│  For Class 10-A                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  ℹ️ Confirm Action                                     │ │
│  │                                                        │ │
│  │  Swap teachers between classes:                       │ │
│  │                                                        │ │
│  │         John Doe                                       │ │
│  │      Class 10-A                                        │ │
│  │                                                        │ │
│  │           ↔                                            │ │
│  │                                                        │ │
│  │      Mary Johnson                                      │ │
│  │      Class 9-A                                         │ │
│  │                                                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                          [Cancel]  [Confirm]                │
└─────────────────────────────────────────────────────────────┘
```

## Mobile View (375px)

```
┌─────────────────────────────────┐
│  👥 Class Teacher Management    │
│  3 assigned • 2 available       │
│  1 unassigned classes           │
│                                 │
│  🔍 Search...              ×   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  ℹ️ How to use:                 │
│  • Click "Assign" to assign     │
│  • Click 🔄 to swap/replace     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ✓ Assigned Teachers             │
│ 3 teachers with assignments     │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [Photo] John Doe            │ │
│ │         Mathematics         │ │
│ │         [1 Class]           │ │
│ │                             │ │
│ │   [10] Class 10-A           │ │
│ │        45 students          │ │
│ │        🔄  ×                │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [Photo] Mary Johnson        │ │
│ │         Science             │ │
│ │         [1 Class]           │ │
│ │                             │ │
│ │   [9] Class 9-A             │ │
│ │       42 students           │ │
│ │       🔄  ×                 │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 👥 Available Teachers           │
│ 2 teachers without assignments  │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [Photo] Jane Smith          │ │
│ │         Science             │ │
│ │         [Available]         │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [Photo] Bob Wilson          │ │
│ │         English             │ │
│ │         [Available]         │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ⚠ Unassigned Classes            │
│ 1 classes need teachers         │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [9] Class 9-B               │ │
│ │     38 students             │ │
│ │              [Assign]       │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

## Color Scheme

### Assigned Teachers Section
- **Background**: Light green (#f0fdf4)
- **Border**: Green (#bbf7d0)
- **Icon**: Green (#16a34a)
- **Badge**: Success green

### Available Teachers Section
- **Background**: Light gray (#f9fafb)
- **Border**: Gray (#e5e7eb)
- **Icon**: Gray (#6b7280)
- **Badge**: Default gray

### Unassigned Classes Section
- **Background**: Light yellow (#fefce8)
- **Border**: Yellow (#fde047)
- **Icon**: Warning yellow (#eab308)
- **Badge**: Warning yellow

### Action Buttons
- **Assign**: Primary blue (#3b82f6)
- **Refresh**: Default gray (#6b7280)
- **Remove**: Danger red (#ef4444)
- **Confirm**: Primary blue (#3b82f6)
- **Cancel**: Light gray (#f3f4f6)

## Icons Used

- 👥 Users (Available Teachers)
- ✓ UserCheck (Assigned Teachers)
- ⚠ AlertCircle (Unassigned Classes, Warnings)
- 🔍 Search (Search box)
- × X (Close, Remove)
- 🔄 RefreshCw (Swap/Replace)
- ↔ ArrowLeftRight (Swap indicator)

## Typography

- **Headers**: 16px, Semibold
- **Teacher Names**: 14px, Medium
- **Department**: 12px, Regular
- **Class Names**: 14px, Medium
- **Student Count**: 12px, Regular
- **Badges**: 12px, Medium
- **Descriptions**: 12px, Regular

## Spacing

- **Card Padding**: 16px
- **Gap between cards**: 12px
- **Gap between sections**: 24px
- **Modal padding**: 24px
- **Button padding**: 8px 16px

## Interactions

### Hover States
- Cards: Slight shadow increase
- Buttons: Background color change
- Teacher cards: Border color change to primary

### Loading States
- Buttons show spinner
- Text changes to "Processing..."
- All buttons disabled

### Focus States
- Blue outline (2px)
- Visible keyboard navigation
- Tab order: Search → Assigned → Available → Unassigned

### Animations
- Modal: Fade in + scale
- Cards: Smooth hover transition
- Toast: Slide in from top
- Loading: Spinner rotation

## Accessibility

- **ARIA Labels**: All buttons and interactive elements
- **Keyboard Navigation**: Full support
- **Screen Reader**: Announces all changes
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible and clear

## Responsive Breakpoints

- **Desktop**: 1024px+ (Two columns)
- **Tablet**: 768px - 1023px (Two columns, narrower)
- **Mobile**: < 768px (Single column, stacked)

---

This mockup represents the actual implementation in the code. All visual elements, colors, and interactions are functional in the deployed UI.
