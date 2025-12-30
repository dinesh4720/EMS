# TeacherOS Redesign Implementation Plan

## 1. Core Visual Identity
- **Theme**: "Clean Slate & Vibrant Blue".
  - Primary: `#2563EB` (Vibrant Blue)
  - Background: `#F8FAFC` (Slate 50)
  - Surface: White with soft shadows (`SHADOWS.small`, `SHADOWS.primary`)
- **Typography**: Inter (SemiBold for headers, Regular for body). No more "box" look.

## 2. Navigation Flow
- **Main Stack**: Home -> Classes -> Work.
- **Profile**: Accessed via the Avatar on the Home Header (modal style).
- **Class Workspace**: Accessed by clicking any class card. Uses `ModernTabBar` for sub-sections.

## 3. Key Screen Redesigns

### Home Screen (Command Center)
- **Header**: Simple "Hello, [Name]" with date and profile bubble.
- **Hero**: Top card shows the *immediate next action* (e.g., "Start Class 10B" or "Prepare Logic Design").
- **Quick Actions**: Horizontal scroll of colored tiles for "Check In", "Leave", "Notices".
- **Schedule**: A timeline view of the day's remaining classes.

### Class Workspace (The Workbench)
- **Attendance**:
  - **Visual**: Grid of "Bubbles" (students).
  - **Interaction**: Tap to toggle red/green. One-tap "Mark All Present".
- **Students**: Clean list with avatar and "Quick Action" dots.
- **Teach/Assess**: Card-based lists for Lesson Plans and Tests.

## 4. Components Created
- `ModernHeader`: Standardized premium header.
- `ActionCard`: The "Hero" gradient card.
- `ModernTabBar`: Pill-shaped scrolling tab bar for sub-pages.
- `SectionHeader`: Standard title + "See All" link.

## 5. Next Steps for User
- Check the "Profile" flow (tap avatar on Home).
- Test the "Attendance" bubble interaction.
- Verify the "Add Lesson Plan" form on the Teach tab.
