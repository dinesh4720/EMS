# Class & Section Data - Best Practices

## Current Issues ❌

### Problem 1: Data Duplication
```javascript
// Class Model
{
  name: "Class 7",
  section: "A",
  classTeacherId: ObjectId("teacher123")
}

// Staff Model
{
  _id: ObjectId("teacher123"),
  name: "Prakash Mishra",
  classTeacherOf: "Class 7-A",  // ❌ DUPLICATE DATA
  isClassTeacher: true           // ❌ REDUNDANT
}
```

**Why this is bad:**
- When you update the class teacher, you must update TWO places
- Easy to get out of sync (as you experienced)
- Wastes database space
- Harder to maintain

### Problem 2: Inconsistent Naming
```javascript
// Sometimes:
name: "7"

// Sometimes:
name: "Class 7"

// Display as:
"Class 7-A" or "7-A" or "Class 7, Section A"
```

**Why this is bad:**
- Hard to query
- String matching fails
- Confusing for developers

---

## Recommended Solution ✅

### Database Schema

#### Class Model (Source of Truth)
```javascript
const ClassSchema = new mongoose.Schema({
  name: String,        // Just the number: "7", "10", "12"
  section: String,     // Just the letter: "A", "B", "C"
  classTeacherId: {    // Reference to Staff - SINGLE SOURCE OF TRUTH
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  subjects: [String],
  academicYear: String,
  studentCount: Number
});

// Add index for faster queries
ClassSchema.index({ name: 1, section: 1 });
ClassSchema.index({ classTeacherId: 1 });
```

#### Staff Model (No Duplication)
```javascript
const StaffSchema = new mongoose.Schema({
  name: String,
  role: [String],      // ["Teacher", "Admin"]
  department: String,
  // ❌ REMOVE: classTeacherOf
  // ❌ REMOVE: isClassTeacher
  
  // Optional: Add virtual field for convenience
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field - computed on the fly, not stored
StaffSchema.virtual('assignedClass', {
  ref: 'Class',
  localField: '_id',
  foreignField: 'classTeacherId',
  justOne: true
});
```

---

## How to Query

### Find Teacher's Assigned Class
```javascript
// Method 1: Direct query
const assignedClass = await Class.findOne({ 
  classTeacherId: teacherId 
});

// Method 2: Using virtual (if defined)
const teacher = await Staff.findById(teacherId).populate('assignedClass');
console.log(teacher.assignedClass); // { name: "7", section: "A", ... }
```

### Find All Teachers with Classes
```javascript
const classesWithTeachers = await Class.find({
  classTeacherId: { $exists: true, $ne: null }
}).populate('classTeacherId');

classesWithTeachers.forEach(cls => {
  console.log(`${cls.name}-${cls.section}: ${cls.classTeacherId.name}`);
});
```

### Find All Available Teachers
```javascript
// Get all teacher IDs who are assigned
const assignedTeacherIds = await Class.distinct('classTeacherId');

// Find teachers NOT in that list
const availableTeachers = await Staff.find({
  role: 'Teacher',
  _id: { $nin: assignedTeacherIds }
});
```

### Find Unassigned Classes
```javascript
const unassignedClasses = await Class.find({
  $or: [
    { classTeacherId: null },
    { classTeacherId: { $exists: false } }
  ]
});
```

---

## API Endpoints

### Assign Class Teacher
```javascript
// PUT /api/classes/:classId/class-teacher
app.put('/api/classes/:classId/class-teacher', async (req, res) => {
  const { classId } = req.params;
  const { classTeacherId } = req.body;

  try {
    // If assigning a new teacher, check if they're already assigned elsewhere
    if (classTeacherId) {
      const existingAssignment = await Class.findOne({ 
        classTeacherId,
        _id: { $ne: classId } // Exclude current class
      });

      if (existingAssignment) {
        // Optional: Auto-unassign from old class
        await Class.findByIdAndUpdate(existingAssignment._id, {
          classTeacherId: null
        });
      }
    }

    // Update the class
    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { classTeacherId: classTeacherId || null },
      { new: true }
    ).populate('classTeacherId');

    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Get Teacher's Assigned Class
```javascript
// GET /api/staff/:staffId/assigned-class
app.get('/api/staff/:staffId/assigned-class', async (req, res) => {
  try {
    const assignedClass = await Class.findOne({
      classTeacherId: req.params.staffId
    });

    res.json(assignedClass || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Frontend Display

### Display Format
```javascript
// Backend stores:
{ name: "7", section: "A" }

// Frontend displays:
const displayName = `Class ${cls.name}-${cls.section}`;
// Result: "Class 7-A"

// Or for short form:
const shortName = `${cls.name}${cls.section}`;
// Result: "7A"
```

### React Component Example
```jsx
function ClassCard({ classData }) {
  const displayName = `Class ${classData.name}-${classData.section}`;
  const teacher = classData.classTeacherId;

  return (
    <div className="class-card">
      <h3>{displayName}</h3>
      <p>Teacher: {teacher?.name || 'Unassigned'}</p>
      <p>Students: {classData.studentCount}</p>
    </div>
  );
}
```

---

## Migration Steps

### Step 1: Backup Database
```bash
mongodump --uri="your-mongodb-uri" --out=backup-$(date +%Y%m%d)
```

### Step 2: Run Cleanup Script
```bash
node backend/scripts/cleanup-class-teacher-data.js
```

This will:
1. Remove "Class " prefix from class names
2. Remove `classTeacherOf` from Staff model
3. Remove `isClassTeacher` from Staff model
4. Keep `classTeacherId` as single source of truth

### Step 3: Update Backend Code

Remove any code that updates `staff.classTeacherOf`:
```javascript
// ❌ REMOVE THIS:
await Staff.findByIdAndUpdate(teacherId, {
  classTeacherOf: `${className}-${section}`,
  isClassTeacher: true
});

// ✅ ONLY UPDATE CLASS:
await Class.findByIdAndUpdate(classId, {
  classTeacherId: teacherId
});
```

### Step 4: Update Frontend Code

Change from:
```javascript
// ❌ OLD WAY:
const assignedClass = teacher.classTeacherOf;
```

To:
```javascript
// ✅ NEW WAY:
const assignedClass = classes.find(c => 
  String(c.classTeacherId) === String(teacher.id)
);
```

---

## Benefits of This Approach

### 1. Single Source of Truth ✅
- Only one place to update
- No sync issues
- Always consistent

### 2. Easier Queries ✅
```javascript
// Find teacher's class
Class.findOne({ classTeacherId: teacherId })

// Find all assigned teachers
Class.find({ classTeacherId: { $exists: true } })

// Find available teachers
Staff.find({ _id: { $nin: assignedTeacherIds } })
```

### 3. Better Performance ✅
- Indexed queries are fast
- No need to parse strings
- Less data to transfer

### 4. Easier to Maintain ✅
- Less code to write
- Fewer bugs
- Clearer logic

### 5. Flexible Display ✅
```javascript
// Can format however you want in frontend
`Class ${name}-${section}`
`${name}${section}`
`Grade ${name}, Section ${section}`
```

---

## Common Patterns

### Pattern 1: Assign Teacher
```javascript
async function assignClassTeacher(classId, teacherId) {
  // Remove teacher from any other class
  await Class.updateMany(
    { classTeacherId: teacherId },
    { classTeacherId: null }
  );

  // Assign to new class
  await Class.findByIdAndUpdate(classId, {
    classTeacherId: teacherId
  });
}
```

### Pattern 2: Swap Teachers
```javascript
async function swapClassTeachers(class1Id, class2Id) {
  const class1 = await Class.findById(class1Id);
  const class2 = await Class.findById(class2Id);

  // Swap the teacher IDs
  await Class.findByIdAndUpdate(class1Id, {
    classTeacherId: class2.classTeacherId
  });

  await Class.findByIdAndUpdate(class2Id, {
    classTeacherId: class1.classTeacherId
  });
}
```

### Pattern 3: Get Teacher's Classes (if multiple allowed)
```javascript
async function getTeacherClasses(teacherId) {
  return await Class.find({ classTeacherId: teacherId });
}
```

---

## Testing

### Test 1: Assign Teacher
```javascript
const classId = '...';
const teacherId = '...';

await Class.findByIdAndUpdate(classId, { classTeacherId: teacherId });

const cls = await Class.findById(classId).populate('classTeacherId');
assert(cls.classTeacherId._id.equals(teacherId));
```

### Test 2: Find Teacher's Class
```javascript
const teacherId = '...';

const assignedClass = await Class.findOne({ classTeacherId: teacherId });
assert(assignedClass !== null);
assert(assignedClass.classTeacherId.equals(teacherId));
```

### Test 3: Unassign Teacher
```javascript
const classId = '...';

await Class.findByIdAndUpdate(classId, { classTeacherId: null });

const cls = await Class.findById(classId);
assert(cls.classTeacherId === null);
```

---

## Summary

### DO ✅
- Store class name as just the number: "7", "10"
- Store section as just the letter: "A", "B"
- Use `Class.classTeacherId` as single source of truth
- Query classes to find teacher assignments
- Format display strings in frontend

### DON'T ❌
- Store "Class 7" with prefix in database
- Duplicate data in `Staff.classTeacherOf`
- Use `Staff.isClassTeacher` flag
- Store formatted strings like "Class 7-A"
- Update multiple places for one change

### Result
- Cleaner code
- Fewer bugs
- Easier maintenance
- Better performance
- More flexible

---

**Recommended Action**: Run the cleanup script to migrate your database to the recommended structure.

```bash
node backend/scripts/cleanup-class-teacher-data.js
```
