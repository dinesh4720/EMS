# Browser Console Fix for ObjectId Name Issue

## Quick Fix from Browser Console

If you're logged into the school-dashboard and see a staff member with an ObjectId as their name, you can fix it directly from the browser console.

### Step 1: Open Browser Console

1. Navigate to the staff page: `http://localhost:5173/staffs/69900115d125322003266f9d`
2. Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. Go to the **Console** tab

### Step 2: Get the Staff Data

First, let's see what data we have:

```javascript
// Get the current staff data from the page
const staffId = '69900115d125322003266f9d';
const token = JSON.parse(sessionStorage.getItem('app_user')).token;

fetch(`http://localhost:3001/api/staff/${staffId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(staff => {
  console.log('Current Staff Data:', staff);
  console.log('Name:', staff.name);
  console.log('Code:', staff.code);
  console.log('Email:', staff.email);
  console.log('Role:', staff.role);
})
.catch(err => console.error('Error:', err));
```

### Step 3: Update with Correct Name

Once you see the data, update it with the correct name:

```javascript
// Replace 'Correct Name Here' with the actual staff member's name
const staffId = '69900115d125322003266f9d';
const token = JSON.parse(sessionStorage.getItem('app_user')).token;
const correctName = 'Correct Name Here';  // ⚠️ CHANGE THIS!

fetch(`http://localhost:3001/api/staff/${staffId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: correctName
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Updated successfully:', data);
  alert('Staff name updated! Refreshing page...');
  window.location.reload();
})
.catch(err => {
  console.error('❌ Error:', err);
  alert('Failed to update. Check console for details.');
});
```

### Step 4: Alternative - Use Code as Name

If you don't know the actual name, use the staff code:

```javascript
const staffId = '69900115d125322003266f9d';
const token = JSON.parse(sessionStorage.getItem('app_user')).token;

// First get the staff data
fetch(`http://localhost:3001/api/staff/${staffId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(staff => {
  // Generate a name from available data
  let newName;
  if (staff.code) {
    newName = `Staff ${staff.code}`;
  } else if (staff.email) {
    const emailPrefix = staff.email.split('@')[0];
    newName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  } else {
    newName = `${staff.role || 'Staff'} ${staffId.slice(-6)}`;
  }
  
  console.log('Generated name:', newName);
  
  // Update with the generated name
  return fetch(`http://localhost:3001/api/staff/${staffId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name: newName })
  });
})
.then(res => res.json())
.then(data => {
  console.log('✅ Updated successfully:', data);
  alert('Staff name updated! Refreshing page...');
  window.location.reload();
})
.catch(err => {
  console.error('❌ Error:', err);
  alert('Failed to update. Check console for details.');
});
```

### Step 5: Fix All Corrupted Staff Names

To find and fix ALL staff with ObjectId names:

```javascript
const token = JSON.parse(sessionStorage.getItem('app_user')).token;

// Get all staff
fetch('http://localhost:3001/api/staff', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(staffList => {
  // Find staff with ObjectId names
  const corrupted = staffList.filter(s => /^[a-f\d]{24}$/i.test(s.name));
  
  console.log(`Found ${corrupted.length} staff with ObjectId names:`);
  corrupted.forEach(s => {
    console.log(`- ${s.id}: ${s.name} (Code: ${s.code}, Email: ${s.email})`);
  });
  
  if (corrupted.length === 0) {
    console.log('✅ No corrupted staff names found!');
    return;
  }
  
  // Ask for confirmation
  if (!confirm(`Found ${corrupted.length} staff with corrupted names. Fix them automatically?`)) {
    return;
  }
  
  // Fix each one
  const fixes = corrupted.map(staff => {
    let newName;
    if (staff.code) {
      newName = `Staff ${staff.code}`;
    } else if (staff.email) {
      const emailPrefix = staff.email.split('@')[0];
      newName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    } else {
      newName = `${staff.role || 'Staff'} ${staff.id.slice(-6)}`;
    }
    
    return fetch(`http://localhost:3001/api/staff/${staff.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: newName })
    })
    .then(res => res.json())
    .then(() => {
      console.log(`✅ Fixed: ${staff.id} -> ${newName}`);
      return { id: staff.id, oldName: staff.name, newName, success: true };
    })
    .catch(err => {
      console.error(`❌ Failed to fix ${staff.id}:`, err);
      return { id: staff.id, oldName: staff.name, success: false, error: err.message };
    });
  });
  
  return Promise.all(fixes);
})
.then(results => {
  if (!results) return;
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n✅ Fixed ${successful} staff names`);
  if (failed > 0) {
    console.log(`❌ Failed to fix ${failed} staff names`);
  }
  
  alert(`Fixed ${successful} staff names! Refreshing page...`);
  window.location.reload();
})
.catch(err => {
  console.error('❌ Error:', err);
  alert('Failed to fix staff names. Check console for details.');
});
```

## Important Notes

1. **Make sure you're logged in** to the school-dashboard before running these commands
2. **The backend server must be running** on `http://localhost:3001`
3. **You need appropriate permissions** to update staff records
4. **Always verify the data** before updating
5. **Consider backing up the database** before making bulk changes

## Troubleshooting

### Error: "Invalid or expired token"
- You're not logged in or your session expired
- Log in again and retry

### Error: "Permission denied"
- Your user account doesn't have permission to edit staff
- Log in as an admin

### Error: "Network request failed"
- Backend server is not running
- Start the backend: `cd backend && npm start`

### Error: "Staff not found"
- The staff ID is incorrect
- Verify the ID in the URL

## After Fixing

1. Refresh the page
2. Verify the name displays correctly
3. Check the staff list page
4. Test the owlin tracker to ensure it shows the correct name
