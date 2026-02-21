# Class Teacher Assignment - User Guide

## Quick Start

### What is this page for?
This page helps you manage which teacher is the class teacher (homeroom teacher) for each class. Each class can have only ONE class teacher.

### How to access
**Navigation**: Dashboard → Classes → Class Teachers tab

---

## Understanding the Layout

### Left Side: Assigned Teachers 👨‍🏫
Shows all teachers who are currently class teachers. Each teacher card displays:
- Teacher name and photo
- Department
- All classes they're assigned to (usually just one)
- Quick action buttons (🔄 swap, × remove)

### Right Side: Two Sections

#### 1. Available Teachers 👥
Shows teachers who are NOT currently class teachers and are available to be assigned.

#### 2. Unassigned Classes ⚠️
Shows classes that don't have a class teacher yet and need one.

---

## How to Perform Actions

### 1️⃣ Assign a Teacher to an Unassigned Class

**When to use**: You have a class without a teacher

**Steps**:
1. Find the class in "Unassigned Classes" section
2. Click the **"Assign"** button
3. A window opens showing all available teachers
4. Click on the teacher you want to assign
5. Click **"Confirm"**
6. Done! ✅

**Result**: 
- Teacher moves from "Available" to "Assigned"
- Class gets a teacher and disappears from unassigned list

---

### 2️⃣ Swap Teachers Between Two Classes

**When to use**: You want to exchange teachers between two classes

**Steps**:
1. Find the teacher in "Assigned Teachers" section
2. Click the **🔄 refresh icon** next to their class
3. A window opens with options
4. Under "Swap with another assigned teacher", click on the teacher you want to swap with
5. Review the swap details
6. Click **"Confirm"**
7. Done! ✅

**Result**: 
- Teacher A now teaches Class B
- Teacher B now teaches Class A
- Both remain in the assigned section

**Example**:
- Before: John teaches 10-A, Mary teaches 10-B
- After: John teaches 10-B, Mary teaches 10-A

---

### 3️⃣ Replace a Teacher with an Available Teacher

**When to use**: You want to change the class teacher, and you have an available teacher

**Steps**:
1. Find the teacher in "Assigned Teachers" section
2. Click the **🔄 refresh icon** next to their class
3. A window opens with options
4. Under "Replace with available teacher", click on the new teacher
5. Review the replacement details
6. Click **"Confirm"**
7. Done! ✅

**Result**: 
- Old teacher becomes available
- New teacher takes over the class
- Class keeps its teacher (just a different person)

**Example**:
- Before: John teaches 10-A (Mary is available)
- After: Mary teaches 10-A (John is available)

---

### 4️⃣ Remove a Teacher from a Class

**When to use**: You want to unassign a teacher (class will have no teacher)

**Steps**:
1. Find the teacher in "Assigned Teachers" section
2. Click the **× cross icon** next to their class
3. Done! ✅

**Result**: 
- Teacher becomes available
- Class moves to "Unassigned Classes" section

---

## Tips & Tricks

### 🔍 Search Feature
- Use the search box at the top to quickly find teachers or classes
- Type teacher name: Shows only that teacher
- Type class name (e.g., "10-A"): Shows only teachers assigned to that class
- Click the × to clear search

### 📊 Quick Stats
The header shows:
- **X assigned**: Number of teachers with class assignments
- **X available**: Number of teachers without assignments
- **X unassigned classes**: Number of classes needing teachers

### ⚡ Quick Actions
- **🔄 Refresh icon**: Swap or replace teacher
- **× Cross icon**: Remove teacher assignment
- **Assign button**: Assign available teacher to class

### 🎯 Best Practices
1. **Assign all classes**: Try to ensure every class has a teacher
2. **Use swap**: When reorganizing, use swap instead of remove + assign
3. **Check regularly**: Review assignments at the start of each term
4. **Search first**: Use search to quickly find specific teachers or classes

---

## Common Questions

### Q: Can a teacher be class teacher for multiple classes?
**A**: Yes, the system allows it, but it's not recommended. Each class should ideally have its own dedicated class teacher.

### Q: What happens to the old teacher when I replace them?
**A**: They become "available" and can be assigned to another class.

### Q: Can I undo an assignment?
**A**: Yes, click the × icon to unassign. The teacher becomes available again.

### Q: What if I don't see any available teachers?
**A**: All teachers are currently assigned. You can either:
- Add new teachers from the Staff page
- Unassign a teacher from their current class
- Replace an existing assignment

### Q: What's the difference between swap and replace?
**A**: 
- **Swap**: Both teachers exchange classes (both stay assigned)
- **Replace**: New teacher takes over, old teacher becomes available

### Q: I don't see the Assign button, why?
**A**: You might not have permission to edit class assignments. Contact your administrator.

---

## Troubleshooting

### Problem: Changes not saving
**Solution**: 
- Check your internet connection
- Refresh the page and try again
- Contact IT support if issue persists

### Problem: Teacher appears in both sections
**Solution**: 
- Refresh the page (F5)
- If issue persists, contact IT support

### Problem: Can't click any buttons
**Solution**: 
- You might not have edit permissions
- Contact your administrator to grant you access

### Problem: Search not working
**Solution**: 
- Clear the search box and try again
- Refresh the page
- Try a different search term

---

## Need Help?

If you encounter any issues or have questions:
1. Check this guide first
2. Try refreshing the page
3. Contact your school IT administrator
4. Report the issue with:
   - What you were trying to do
   - What happened instead
   - Any error messages you saw

---

## Keyboard Shortcuts

- **Tab**: Navigate between elements
- **Enter**: Confirm selection
- **Escape**: Close modal/cancel
- **Ctrl+F**: Focus search box (browser default)

---

## Visual Guide

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Search teachers or classes...                           │
├──────────────────────────┬──────────────────────────────────┤
│ ✓ Assigned Teachers      │  👥 Available Teachers           │
│                          │  ─────────────────────           │
│ [Photo] John Doe         │  [Photo] Jane Smith              │
│         Mathematics      │          Science                 │
│         [1 Class]        │          [Available]             │
│                          │                                  │
│   [10] Class 10-A        │  [Photo] Bob Wilson              │
│        45 students       │          English                 │
│        [🔄] [×]          │          [Available]             │
│                          │                                  │
│ [Photo] Mary Johnson     │  ⚠ Unassigned Classes           │
│         Science          │  ─────────────────────           │
│         [1 Class]        │                                  │
│                          │  [9] Class 9-B    [Assign]      │
│   [9] Class 9-A          │       38 students                │
│       42 students        │                                  │
│       [🔄] [×]           │  [11] Class 11-C  [Assign]      │
│                          │        35 students               │
└──────────────────────────┴──────────────────────────────────┘
```

---

**Last Updated**: February 2026
**Version**: 2.0 (Redesigned UI)
