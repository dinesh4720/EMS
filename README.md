# EMS Monorepo

Education Management System — a multi-tenant SaaS platform for schools.

## Repository Layout

| Directory | Description |
|-----------|-------------|
| `../EMS-backend/` | Node.js / Express / MongoDB API (port 3001) |
| `school-dashboard/` | React admin + teacher web app (port 5173) |
| `parent-app/` | React Native parent mobile app |
| `staff-app/` | React Native staff mobile app |
| `owlin/` | Internal product-analytics stack for EMS |

---

## Quick Start

### Prerequisites

- **Node.js** 20+ (`node -v`)
- **MongoDB** 6+ running locally **or** a MongoDB Atlas connection string
- **npm** 9+ (comes with Node)

### 1 — Backend

```bash
cd ../EMS-backend
cp .env.example .env          # fill in required values (see .env.example)
npm install
npm run dev                   # starts on http://localhost:3001
```

Minimum required env vars in `.env`:

```
MONGODB_URI=mongodb://localhost:27017/school_db
PORT=3001
JWT_SECRET=<64-char random hex>
JWT_REFRESH_SECRET=<different 64-char random hex>
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2 — School Dashboard

```bash
cd school-dashboard
cp .env.example .env.local    # if an example exists, otherwise create it
npm install
npm run dev                   # starts on http://localhost:5173
```

Minimum `.env.local`:
```
VITE_API_URL=http://localhost:3001/api
```

Open [http://localhost:5173](http://localhost:5173) and log in with the super-admin credentials you set up via the backend seed script (if any).

### 3 — Parent App (React Native / Expo)

```bash
cd parent-app
npm install
npx expo start
```

Requires Expo Go on your phone or an iOS/Android simulator.

### 4 — Staff App (React Native / Expo)

```bash
cd staff-app
npm install
npx expo start
```

---

## Optional Services

| Service | Purpose | Required? |
|---------|---------|-----------|
| Cloudinary | Profile photo & document uploads | Recommended |
| Firebase Admin | Parent OTP login + push notifications | Optional |
| MSG91 | SMS / WhatsApp alerts | Optional |
| Razorpay | Fee payments in parent app | Optional |
| Redis | Distributed cache + multi-instance socket | Optional |
| Sentry | Error tracking | Optional |
| Loki / ELK | Structured log aggregation | Optional |

See `../EMS-backend/.env.example` for full configuration details for each service.

---

## Development Tips

- **Super-admin**: Log in with a user whose `role` is `super_admin` to access `/super-admin`.
- **Multi-tenancy**: Every school is isolated by `schoolId`. Create schools via the super-admin panel.
- **Hot reload**: Both the backend (`npm run dev`) and dashboard (`npm run dev`) support hot reload.
- **Socket.IO**: Real-time features (attendance, chat) require the backend to be running.

---

## What `owlin` Is

`owlin` is the internal product-analytics stack for EMS (not a separate product):

- `owlin/sdk` — tracking SDK consumed by `school-dashboard`
- `owlin/server` — receives and stores tracking events
- `owlin/src` — analytics dashboard for inspecting events

Currently only `school-dashboard` is integrated. `parent-app` and `staff-app` are not yet integrated.

---

## Architecture

```
Browser / Mobile
      │
      ▼
school-dashboard (Vite + React)
      │  REST + Socket.IO
      ▼
EMS-backend (Express + MongoDB + Socket.IO)
      │
      ├── MongoDB  (primary data store)
      ├── Redis    (optional cache + pub/sub)
      └── External services (Cloudinary, Firebase, MSG91, Razorpay…)
```
