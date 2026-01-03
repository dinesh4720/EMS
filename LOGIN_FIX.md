# Login System Fix - Email & Phone Support ✅

## Problem
Staff members created through User Management couldn't login with their email and password. The system was using mock authentication instead of the real backend API.

## Root Causes
1. **AuthContext using mock data**: Login function was checking hardcoded credentials instead of calling the backend API
2. **Backend only accepted phone**: Login route only accepted phone number, not email
3. **No API integration**: Frontend wasn't connected to the real authentication endpoint

## Solution Applied

### 1. Updated Backend Login Route (backend/server.js)
Modified to accept **both email and phone** as login ID:

```javascript
app.post('/api/auth/login', async (req, res) => {
  const { phone, email, password } = req.body;
  
  // Allow login with either phone or email
  let query = { password, status: 'active' };
  if (phone) {
    query.phone = phone;
  } else if (email) {
    query.email = email;
  }
  
  const staff = await Staff.findOne(query);
  if (!staff) return res.status(401).json({ error: 'Invalid credentials' });
  
  res.json({
    id: staff._id,
    code: staff.code,
    name: staff.name,
    role: staff.role,
    email: staff.email,
    phone: staff.phone,
    classes: [...]
  });
});
```

### 2. Updated AuthContext (school-dashboard/src/context/AuthContext.jsx)
Changed from mock authentication to real API calls:

```javascript
const login = async (emailOrPhone, password) => {
  // Call the backend API
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: emailOrPhone.includes('@') ? emailOrPhone : undefined,
      phone: !emailOrPhone.includes('@') ? emailOrPhone : undefined,
      password
    }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const userData = await response.json();
  
  // Store user data
  setUser(userData);
  setIsAuthenticated(true);
  localStorage.setItem("app_user", JSON.stringify(userData));
  
  navigate("/");
  return userData;
};
```

## How Login Works Now

### Login Methods Supported:

#### 1. **Email + Password**
```
Email: john.doe@school.com
Password: abc12345
```

#### 2. **Phone + Password**
```
Phone: 9876543210
Password: abc12345
```

### Login Flow:

1. **User enters credentials** (email or phone + password)
2. **Frontend detects** if input contains '@' (email) or not (phone)
3. **API call** to `/api/auth/login` with appropriate field
4. **Backend searches** for staff with matching email/phone and password
5. **Returns user data** if found, error if not
6. **Frontend stores** user data in state and localStorage
7. **Redirects** to dashboard

## Where to Find Credentials

### Option 1: User Management Page
1. Go to **Settings > User Management**
2. See all staff with their:
   - Login ID (Phone)
   - Password (can view/copy)
3. Can change password from here

### Option 2: Staff List
1. Go to **Staff Management**
2. View any staff member
3. Their credentials are auto-generated:
   - **Username**: From email (before @) or staff code
   - **Password**: Auto-generated 8-character password

### Option 3: Backend Response
When you create a staff member, the API returns:
```json
{
  "id": "...",
  "name": "John Doe",
  "email": "john.doe@school.com",
  "phone": "9876543210",
  "username": "johndoe",
  "password": "abc12345",  // Auto-generated
  ...
}
```

## Testing the Fix

### Test 1: Login with Email
1. Go to User Management
2. Find a staff member with email
3. Copy their password
4. Logout
5. Login with:
   - Email: `staff.email@school.com`
   - Password: `copied_password`
6. ✅ Should login successfully

### Test 2: Login with Phone
1. Go to User Management
2. Find a staff member with phone
3. Copy their password
4. Logout
5. Login with:
   - Phone: `9876543210`
   - Password: `copied_password`
6. ✅ Should login successfully

### Test 3: Create New Staff & Login
1. Add new staff member
2. Note the auto-generated password from response
3. Logout
4. Login with their email/phone and password
5. ✅ Should login successfully

## Important Notes

### Password Generation
When creating a staff member:
- Password is **auto-generated** (8 random characters)
- Returned in the API response
- Visible in User Management
- Can be changed by admin

### Password Security
⚠️ **Current Implementation**:
- Passwords stored in **plain text** (not hashed)
- This is for development/testing only

🔒 **For Production**:
- Hash passwords using bcrypt
- Never store plain text passwords
- Implement password reset flow

### Example Production Password Hashing:
```javascript
// When creating staff
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
staff.password = hashedPassword;

// When logging in
const isValid = await bcrypt.compare(password, staff.password);
```

## Files Modified

1. **backend/server.js**
   - Updated POST /api/auth/login to accept email or phone

2. **school-dashboard/src/context/AuthContext.jsx**
   - Changed from mock authentication to real API calls
   - Auto-detects email vs phone based on '@' character

## Common Issues & Solutions

### Issue: "Invalid credentials" error
**Cause**: Wrong email/phone or password

**Solution**:
1. Check User Management for correct credentials
2. Ensure staff status is "active"
3. Try copying password directly (avoid typos)

### Issue: Login works but redirects to login again
**Cause**: User data not stored properly

**Solution**:
1. Check browser console for errors
2. Verify localStorage has "app_user"
3. Check if backend returns all required fields

### Issue: Can't find staff credentials
**Cause**: Staff created before password generation was implemented

**Solution**:
1. Go to User Management
2. Click "Change Password" for that staff
3. Set a new password
4. Use that to login

## Summary

✅ **Login now works with real backend API**
✅ **Supports both email and phone as login ID**
✅ **Passwords auto-generated when creating staff**
✅ **Admins can view/change passwords in User Management**
✅ **Staff can login with credentials from User Management**

The authentication system is now fully functional and connected to the database!
