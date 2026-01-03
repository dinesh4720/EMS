# Chat Permissions & Role-Based Access Guide

## Overview
This guide explains how to configure role-based permissions for the chat messaging system, allowing you to control who can message whom based on their role in the school.

## Default Role Permissions

### Principal
- ✅ Can message anyone (staff, students, parents)
- ✅ Can create group chats
- ✅ Can broadcast messages
- ✅ Full chat access

### Vice Principal
- ✅ Can message staff, students, and parents
- ✅ Can create group chats
- ❌ Cannot broadcast to all

### Admin
- ✅ Can message staff, students, and parents
- ❌ Cannot create group chats
- ❌ Cannot broadcast

### Teacher
- ✅ Can message their class students
- ✅ Can message parents of their students
- ✅ Can message other staff members
- ❌ Cannot message students from other classes (unless given permission)

### Accountant
- ✅ Can message parents (for fee-related communication)
- ✅ Can message admin/principal
- ❌ Cannot message students directly

### Librarian
- ✅ Can message students (for library-related communication)
- ✅ Can message staff
- ❌ Cannot message parents

### Front Desk
- ✅ Can message parents (for inquiries)
- ✅ Can message admin
- ❌ Cannot message students directly

### Students
- ✅ Can message their teachers
- ✅ Can message admin/principal
- ❌ Cannot message other students
- ❌ Cannot message parents

## How to Enable Chat for a Teacher

### Step 1: Create Staff Member
1. Go to **Staff Management**
2. Click **Add Staff**
3. Fill in details:
   - Name: John Doe
   - Role: **Teacher**
   - Department: Mathematics
   - Phone, Email, etc.
4. Click **Save**

### Step 2: Assign Communication Permissions (Optional)

#### Option A: Use Default Permissions
Teachers automatically get these permissions:
- Message their class students
- Message parents of their students
- Message other staff

#### Option B: Custom Permissions
1. Go to **Settings > Roles & Access**
2. Find **Teacher** role
3. Enable custom chat permissions:
   - `chat.send_message` ✅
   - `chat.view_conversations` ✅
   - `chat.message_students` ✅
   - `chat.message_parents` ✅
   - `chat.message_staff` ✅
   - `chat.message_anyone` ❌ (only for admin roles)

### Step 3: Test Chat Access
1. Login as the teacher
2. Navigate to **Messaging > Chat**
3. Click **+** to start a new conversation
4. You should see:
   - Other staff members
   - Students from your assigned class
   - Parents (if enabled)

## Permission Levels Explained

### Basic Permissions
```javascript
SEND_MESSAGE          // Can send messages at all
VIEW_CONVERSATIONS    // Can view conversation list
```

### Target-Based Permissions
```javascript
MESSAGE_STUDENTS      // Can message students
MESSAGE_PARENTS       // Can message parents
MESSAGE_STAFF         // Can message other staff
MESSAGE_ANYONE        // Can message anyone (admin only)
```

### Advanced Permissions
```javascript
CREATE_GROUP          // Can create group chats
BROADCAST             // Can send broadcast messages
```

## Customizing Permissions in Code

### Backend: Update Default Permissions

Edit `backend/middleware/chatPermissions.js`:

```javascript
export const DEFAULT_ROLE_PERMISSIONS = {
  'Teacher': [
    CHAT_PERMISSIONS.SEND_MESSAGE,
    CHAT_PERMISSIONS.VIEW_CONVERSATIONS,
    CHAT_PERMISSIONS.MESSAGE_STUDENTS,
    CHAT_PERMISSIONS.MESSAGE_PARENTS,
    CHAT_PERMISSIONS.MESSAGE_STAFF,
    // Add more permissions as needed
  ],
  // Add custom roles
  'Counselor': [
    CHAT_PERMISSIONS.SEND_MESSAGE,
    CHAT_PERMISSIONS.VIEW_CONVERSATIONS,
    CHAT_PERMISSIONS.MESSAGE_STUDENTS,
    CHAT_PERMISSIONS.MESSAGE_PARENTS,
    CHAT_PERMISSIONS.MESSAGE_STAFF
  ]
};
```

### Database: Add Custom Permissions to Staff

You can add a `customPermissions` field to the Staff model:

```javascript
// In database.js Staff schema
const staffSchema = new mongoose.Schema({
  // ... existing fields
  customPermissions: [{
    type: String,
    enum: [
      'chat.send_message',
      'chat.view_conversations',
      'chat.message_students',
      'chat.message_parents',
      'chat.message_staff',
      'chat.message_anyone',
      'chat.create_group',
      'chat.broadcast'
    ]
  }]
});
```

Then update via API:
```javascript
// Update staff with custom permissions
await Staff.findByIdAndUpdate(staffId, {
  customPermissions: [
    'chat.send_message',
    'chat.view_conversations',
    'chat.message_anyone' // Give this teacher full access
  ]
});
```

## UI: Settings Page for Permissions

Create a settings page where admins can manage chat permissions:

```jsx
// Settings > Communication Settings > Chat Permissions

<div className="space-y-4">
  <h3>Teacher Permissions</h3>
  <Checkbox checked={canMessageStudents}>
    Can message students
  </Checkbox>
  <Checkbox checked={canMessageParents}>
    Can message parents
  </Checkbox>
  <Checkbox checked={canMessageStaff}>
    Can message other staff
  </Checkbox>
</div>
```

## Permission Checks Flow

### 1. User Opens Chat
```
User → Load Permissions → Check canSendMessage
  ↓
  If NO → Show "Access Restricted" message
  If YES → Load conversations
```

### 2. User Starts New Conversation
```
User → Click "New Chat" → Load Available Contacts
  ↓
  Filter contacts based on:
  - canMessageStaff → Show staff
  - canMessageStudents → Show students
  - canMessageParents → Show parents
  - canMessageAnyone → Show everyone
```

### 3. User Sends Message
```
User → Type message → Click Send
  ↓
  Backend checks:
  1. Does user have SEND_MESSAGE permission?
  2. Can user message this specific receiver?
  ↓
  If NO → Return error "Permission denied"
  If YES → Send message
```

## Common Scenarios

### Scenario 1: Teacher wants to message a student
**Question**: Can a Math teacher message a student from English class?

**Answer**: By default, NO. Teachers can only message students from their assigned class.

**Solution**: 
- Option A: Assign the teacher to that class as well
- Option B: Give teacher `MESSAGE_ANYONE` permission (not recommended)
- Option C: Create a group chat with both teachers and the student

### Scenario 2: Accountant needs to message parents about fees
**Question**: Can the accountant message all parents?

**Answer**: YES. Accountants have `MESSAGE_PARENTS` permission by default.

### Scenario 3: Student wants to message another student
**Question**: Can students message each other?

**Answer**: NO. Students can only message staff members (teachers, admin).

**Reason**: To prevent misuse and maintain professional communication.

**Alternative**: Students can use group chats created by teachers.

### Scenario 4: Front desk needs to message a student
**Question**: Can front desk staff message students directly?

**Answer**: NO by default. Front desk can message parents and admin.

**Solution**: If needed, admin can grant `MESSAGE_STUDENTS` permission to front desk staff.

## Security Best Practices

1. **Principle of Least Privilege**: Only grant permissions that are necessary for the role
2. **Regular Audits**: Review who has `MESSAGE_ANYONE` permission
3. **Monitor Usage**: Track message volume and patterns
4. **Content Moderation**: Implement filters for inappropriate content
5. **Reporting System**: Allow users to report inappropriate messages

## Testing Permissions

### Test Checklist
- [ ] Principal can message anyone
- [ ] Teacher can message their class students
- [ ] Teacher cannot message other class students
- [ ] Accountant can message parents
- [ ] Students can message teachers
- [ ] Students cannot message other students
- [ ] Permission denied errors show helpful messages
- [ ] New chat modal only shows allowed contacts

### Test Script
```javascript
// Test as Teacher
1. Login as teacher (assigned to Class 10-A)
2. Go to Chat
3. Click "New Chat"
4. Verify: Can see Class 10-A students
5. Verify: Cannot see Class 10-B students
6. Try to message Class 10-A student → Should work
7. Try to message Class 10-B student (via API) → Should fail

// Test as Student
1. Login as student
2. Go to Chat
3. Click "New Chat"
4. Verify: Can see teachers and admin
5. Verify: Cannot see other students
6. Try to message teacher → Should work
7. Try to message another student (via API) → Should fail
```

## Troubleshooting

### Issue: Teacher cannot see any contacts
**Cause**: Missing permissions or not assigned to any class

**Solution**:
1. Check if teacher has `SEND_MESSAGE` permission
2. Verify teacher is assigned to a class
3. Check if `MESSAGE_STUDENTS` permission is enabled

### Issue: "Permission denied" error when sending message
**Cause**: User doesn't have permission to message that specific user type

**Solution**:
1. Check user's role and permissions
2. Verify receiver's type (staff/student/parent)
3. Grant appropriate permission (`MESSAGE_STAFF`, `MESSAGE_STUDENTS`, etc.)

### Issue: All staff can message anyone
**Cause**: All staff have `MESSAGE_ANYONE` permission

**Solution**:
1. Review `DEFAULT_ROLE_PERMISSIONS` in `chatPermissions.js`
2. Remove `MESSAGE_ANYONE` from roles that shouldn't have it
3. Restart backend server

## API Endpoints for Permission Management

```javascript
// Get user's chat permissions
GET /api/messages/permissions?userId=123&userType=staff

// Response:
{
  "canSendMessage": true,
  "canViewConversations": true,
  "canMessageStudents": true,
  "canMessageParents": true,
  "canMessageStaff": true,
  "canMessageAnyone": false,
  "canCreateGroup": false,
  "canBroadcast": false
}

// Update staff permissions (admin only)
PUT /api/staff/:id
{
  "customPermissions": [
    "chat.send_message",
    "chat.message_anyone"
  ]
}
```

## Summary

✅ **Role-based permissions** control who can message whom
✅ **Default permissions** are set per role (Teacher, Admin, etc.)
✅ **Custom permissions** can be assigned to individual staff
✅ **Permission checks** happen on both frontend and backend
✅ **Security** is enforced at the API and Socket.IO level
✅ **Flexible** - easy to add new roles and permissions

To enable chat for a teacher, simply create them with the "Teacher" role - they'll automatically get the appropriate permissions!
