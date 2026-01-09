# Example: Implementing Permissions in Messaging Module

This is a complete example showing how to add permission protection to the Messaging module.

## Before (No Permissions)

```javascript
// school-dashboard/src/pages/messaging/Chat.jsx
export default function Chat() {
  return (
    <div>
      {/* Chat interface */}
      <Button onPress={sendMessage}>Send</Button>
      <Button onPress={deleteMessage}>Delete</Button>
    </div>
  );
}
```

## After (With Permissions)

```javascript
// school-dashboard/src/pages/messaging/Chat.jsx
import PermissionGuard from "../../components/PermissionGuard";
import { usePermissions } from "../../context/PermissionContext";

export default function Chat() {
  const { hasPermission } = usePermissions();

  return (
    <PermissionGuard module="messaging" action="view">
      <div>
        {/* Chat interface */}
        
        {/* Only show send button if user has create permission */}
        {hasPermission('messaging', 'create') && (
          <Button onPress={sendMessage}>Send</Button>
        )}
        
        {/* Only show delete button if user has delete permission */}
        {hasPermission('messaging', 'delete') && (
          <Button onPress={deleteMessage}>Delete</Button>
        )}
      </div>
    </PermissionGuard>
  );
}
```

## Complete Implementation for Messaging Module

### 1. Update Chat.jsx

```javascript
import { useState } from "react";
import { Avatar, ScrollShadow, Button } from "@heroui/react";
import { Send, Search, Phone, Video, MoreVertical, X } from "lucide-react";
import PermissionGuard from "../../components/PermissionGuard";
import { usePermissions } from "../../context/PermissionContext";

export default function Chat() {
  const { hasPermission } = usePermissions();
  const [selectedContact, setSelectedContact] = useState(contacts[0]);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;
    if (!hasPermission('messaging', 'create')) {
      toast.error('You don\'t have permission to send messages');
      return;
    }
    // Send message logic
  };

  const handleDelete = (messageId) => {
    if (!hasPermission('messaging', 'delete')) {
      toast.error('You don\'t have permission to delete messages');
      return;
    }
    // Delete message logic
  };

  return (
    <PermissionGuard module="messaging" action="view">
      <div className="flex gap-0 h-full w-full">
        {/* Contacts List */}
        <div className="w-80 shrink-0 border-r border-default-200">
          {/* Contacts */}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2">
                <div>{msg.text}</div>
                {/* Only show delete for own messages if user has delete permission */}
                {msg.sender === 'me' && hasPermission('messaging', 'delete') && (
                  <Button
                    size="sm"
                    isIconOnly
                    variant="light"
                    onPress={() => handleDelete(msg.id)}
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Input Area - Only show if user can create messages */}
          {hasPermission('messaging', 'create') ? (
            <div className="p-4 border-t border-default-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-lg border"
                />
                <Button
                  color="primary"
                  isIconOnly
                  onPress={handleSend}
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 border-t border-default-200 bg-default-50">
              <p className="text-sm text-default-500 text-center">
                You don't have permission to send messages
              </p>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}
```

### 2. Update Announcements.jsx

```javascript
import PermissionGuard from "../../components/PermissionGuard";
import { usePermissions } from "../../context/PermissionContext";

export default function Announcements() {
  const { hasPermission } = usePermissions();

  return (
    <PermissionGuard module="messaging" action="view">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2>Announcements</h2>
          {hasPermission('messaging', 'create') && (
            <Button onPress={handleCreateAnnouncement}>
              Create Announcement
            </Button>
          )}
        </div>

        {/* Announcements List */}
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardBody>
              <h3>{announcement.title}</h3>
              <p>{announcement.content}</p>
              
              <div className="flex gap-2 mt-4">
                {hasPermission('messaging', 'edit') && (
                  <Button size="sm" onPress={() => handleEdit(announcement.id)}>
                    Edit
                  </Button>
                )}
                {hasPermission('messaging', 'delete') && (
                  <Button size="sm" color="danger" onPress={() => handleDelete(announcement.id)}>
                    Delete
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </PermissionGuard>
  );
}
```

### 3. Update Reminders.jsx

```javascript
import PermissionGuard from "../../components/PermissionGuard";
import { usePermissions } from "../../context/PermissionContext";

export default function Reminders() {
  const { hasPermission } = usePermissions();

  return (
    <PermissionGuard module="messaging" action="view">
      <div>
        {hasPermission('messaging', 'create') && (
          <Button onPress={handleCreateReminder}>
            Create Reminder
          </Button>
        )}

        {/* Reminders list with conditional edit/delete */}
      </div>
    </PermissionGuard>
  );
}
```

### 4. Update CommunicationLogs.jsx

```javascript
import PermissionGuard from "../../components/PermissionGuard";

export default function CommunicationLogs() {
  return (
    <PermissionGuard module="messaging" action="view">
      <div>
        {/* Communication logs - read-only for most users */}
      </div>
    </PermissionGuard>
  );
}
```

### 5. Update Messaging Index

```javascript
// school-dashboard/src/pages/messaging/index.jsx
import { Routes, Route } from "react-router-dom";
import { usePermissions } from "../../context/PermissionContext";
import PermissionDenied from "../../components/PermissionDenied";
import Chat from "./Chat";
import Announcements from "./Announcements";
import Reminders from "./Reminders";
import CommunicationLogs from "./CommunicationLogs";

export default function MessagingPage() {
  const { hasAnyPermission } = usePermissions();

  // If user has no messaging permissions at all, show denied page
  if (!hasAnyPermission('messaging')) {
    return <PermissionDenied module="messaging" action="view" />;
  }

  return (
    <Routes>
      <Route path="/" element={<Chat />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/reminders" element={<Reminders />} />
      <Route path="/logs" element={<CommunicationLogs />} />
    </Routes>
  );
}
```

## Testing the Implementation

### Test Scenario 1: Teacher Role
```javascript
// Teacher permissions:
// - messaging: { view: true, create: true, edit: true, delete: false }

// Expected behavior:
// ✅ Can view chat
// ✅ Can send messages
// ✅ Can edit own messages
// ❌ Cannot delete messages
// ✅ Can create announcements
// ✅ Can edit own announcements
// ❌ Cannot delete announcements
```

### Test Scenario 2: Accountant Role
```javascript
// Accountant permissions:
// - messaging: { view: true, create: true, edit: false, delete: false }

// Expected behavior:
// ✅ Can view chat
// ✅ Can send messages
// ❌ Cannot edit messages
// ❌ Cannot delete messages
// ✅ Can create announcements
// ❌ Cannot edit announcements
// ❌ Cannot delete announcements
```

### Test Scenario 3: Receptionist Role
```javascript
// Receptionist permissions:
// - messaging: { view: true, create: true, edit: false, delete: false }

// Expected behavior:
// ✅ Can view chat
// ✅ Can send messages
// ❌ Cannot edit messages
// ❌ Cannot delete messages
```

### Test Scenario 4: No Permission
```javascript
// User with no messaging permissions

// Expected behavior:
// ❌ Shows permission denied page
// ✅ Can request permission
// ✅ Request goes to admin
```

## Visual Indicators

### 1. Disabled State
```javascript
<Button
  isDisabled={!hasPermission('messaging', 'create')}
  onPress={handleSend}
>
  Send Message
</Button>
```

### 2. Hidden Elements
```javascript
{hasPermission('messaging', 'delete') && (
  <Button onPress={handleDelete}>Delete</Button>
)}
```

### 3. Tooltip Explanation
```javascript
<Tooltip
  content={
    hasPermission('messaging', 'edit')
      ? "Edit message"
      : "You don't have permission to edit messages"
  }
>
  <Button
    isDisabled={!hasPermission('messaging', 'edit')}
    onPress={handleEdit}
  >
    Edit
  </Button>
</Tooltip>
```

## Error Handling

```javascript
const handleSend = async () => {
  // Frontend check (UX)
  if (!hasPermission('messaging', 'create')) {
    toast.error('You don\'t have permission to send messages');
    return;
  }

  try {
    // Backend will also check permissions
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMessage, userId: user.id })
    });

    if (response.status === 403) {
      // Permission denied by backend
      const error = await response.json();
      toast.error(error.message);
      // Optionally refresh permissions
      refetchPermissions();
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    // Success
    toast.success('Message sent');
  } catch (error) {
    toast.error(error.message);
  }
};
```

## Backend Protection

Don't forget to protect the backend routes:

```javascript
// backend/routes/messages.js
import { checkPermission } from '../middleware/permissions.js';

// View messages
router.get('/messages', checkPermission('messaging', 'view'), async (req, res) => {
  // Get messages
});

// Send message
router.post('/messages', checkPermission('messaging', 'create'), async (req, res) => {
  // Create message
});

// Edit message
router.put('/messages/:id', checkPermission('messaging', 'edit'), async (req, res) => {
  // Update message
});

// Delete message
router.delete('/messages/:id', checkPermission('messaging', 'delete'), async (req, res) => {
  // Delete message
});
```

## Summary

This example shows:
1. ✅ Page-level protection with PermissionGuard
2. ✅ Button-level permission checks
3. ✅ Conditional rendering based on permissions
4. ✅ User-friendly error messages
5. ✅ Backend route protection
6. ✅ Proper error handling
7. ✅ Visual indicators for disabled features

Apply this same pattern to all other modules!
