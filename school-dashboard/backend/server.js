import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'data', 'database.json');

app.use(cors());
app.use(express.json());

// Helper to read DB
async function getDb() {
    try {
        return await fs.readJson(DB_FILE);
    } catch (err) {
        console.error('Error reading DB:', err);
        return { users: [], permissionRequests: [] };
    }
}

// Helper to write DB
async function saveDb(data) {
    try {
        await fs.writeJson(DB_FILE, data, { spaces: 2 });
    } catch (err) {
        console.error('Error writing DB:', err);
    }
}

// --- Auth Routes ---

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const db = await getDb();

    const user = db.users.find(u => u.email === email && u.password === password);

    if (user) {
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// --- Permission Routes ---

// Get permissions for a specific user
app.get('/api/permissions/user/:id', async (req, res) => {
    const { id } = req.params;
    const db = await getDb();

    const user = db.users.find(u => u.id === id);
    if (!user) {
        // Return default empty permissions if user exists in auth but not sync in DB (generic fallback)
        return res.json({
            role: 'teacher',
            permissions: [],
            customPermissions: false
        });
    }

    res.json({
        role: user.role,
        permissions: user.permissions || [],
        customPermissions: true
    });
});

// Get pending requests for a user
app.get('/api/permissions/user/:id/requests', async (req, res) => {
    const { id } = req.params;
    const db = await getDb();
    const requests = db.permissionRequests.filter(r => r.userId === id && r.status === 'pending');
    res.json(requests);
});

// Create a permission request
app.post('/api/permissions/request', async (req, res) => {
    const { userId, module, reason } = req.body;
    const db = await getDb();

    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = db.permissionRequests.find(r =>
        r.userId === userId && r.module === module && r.status === 'pending'
    );

    if (existing) {
        return res.status(400).json({ error: 'Request already pending' });
    }

    const newRequest = {
        id: uuidv4(),
        userId,
        userName: user.name,
        userEmail: user.email,
        module,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    db.permissionRequests.push(newRequest);
    await saveDb(db);

    res.json(newRequest);
});

// --- Admin Routes ---

// Get all pending requests
app.get('/api/admin/requests/pending', async (req, res) => {
    const db = await getDb();
    const pending = db.permissionRequests.filter(r => r.status === 'pending');
    res.json(pending);
});

// Approve/Reject Request
app.post('/api/admin/requests/resolve', async (req, res) => {
    const { requestId, status, adminId } = req.body;
    const db = await getDb();

    const requestIndex = db.permissionRequests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) {
        return res.status(404).json({ error: 'Request not found' });
    }

    const request = db.permissionRequests[requestIndex];
    request.status = status;
    request.resolvedAt = new Date().toISOString();
    request.resolvedBy = adminId;

    if (status === 'approved') {
        const userIndex = db.users.findIndex(u => u.id === request.userId);
        if (userIndex !== -1) {
            const user = db.users[userIndex];
            const existingPermIndex = user.permissions.findIndex(p => p.module === request.module);

            const newPerm = {
                module: request.module,
                view: true, create: true, edit: true, delete: true
            };

            if (existingPermIndex !== -1) {
                user.permissions[existingPermIndex] = newPerm;
            } else {
                user.permissions.push(newPerm);
            }
        }
    }

    await saveDb(db);
    res.json({ message: `Request ${status}`, request });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
