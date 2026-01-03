# 🔐 Admin Login Credentials

## ✅ Valid Admin Accounts

### 1. Vikram Patel (Easiest to Remember)
```
Email: vikram@school.com
Password: password123
```

### 2. Dinesh Kumar
```
Email: dkumdesigns@gmail.com
Password: QpCZjRvW
```

### 3. Sooraj
```
Email: Bdk472000@gmail.com
Password: w9WQjBat
```

### 4. Sooraj CEO
```
Email: soorajCEO-GENZ-ELONMUSK@gmail.com
Password: TLCmDFf3
```

---

## 🎯 How to Login

### Step 1: Go to Login Page
Open: `http://localhost:5173`

### Step 2: Enter Credentials
- **Email:** Copy-paste from above
- **Password:** Copy-paste from above

### Step 3: Click Login
You should be logged in successfully!

---

## 🔧 Troubleshooting

### "Invalid credentials" error?

**Check these:**
1. ✅ Email is **exactly** as shown (case-sensitive)
2. ✅ Password is **exactly** as shown (case-sensitive)
3. ✅ No extra spaces before/after
4. ✅ Backend server is running

**Try this:**
- Use **Vikram Patel** account (simplest password)
- Email: `vikram@school.com`
- Password: `password123`

### Still not working?

**Test the API directly:**
```powershell
# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"vikram@school.com","password":"password123"}'
```

Should return user data if successful.

---

## 📋 All Staff Accounts

Total staff in database: **15**

**Admins (4):**
- Vikram Patel
- Dinesh Kumar
- Sooraj
- Sooraj CEO

**Teachers (11):**
- Rajesh Kumar
- Priya Singh
- Amit Verma
- Sunita Devi
- Multiple "Sooraj" entries

---

## 🔑 Password Reset (If Needed)

If you want to reset a password, you can:

### Option 1: Via User Management
1. Login as admin
2. Go to Settings → User Management
3. Find the staff member
4. Update their password

### Option 2: Via Database Script
Create a script to update password directly in MongoDB.

---

## 🎯 Recommended Test Account

**Use this for testing:**
```
Email: vikram@school.com
Password: password123
Role: Admin
```

This is the easiest to remember and type!

---

## 📝 Notes

- All passwords are **case-sensitive**
- Login accepts **email OR phone** (not both)
- Staff must have `status: 'active'` to login
- All admin accounts shown above are active

---

## ✅ Quick Test

Try logging in with:
```
vikram@school.com
password123
```

This should work immediately!

---

**Created:** To help with login issues
**Last Updated:** Current session
