# पंक्ति (Pankti) – Queue Management System

> **Your Queue, Organized in One Place.**

पंक्ति (Pankti) is a full-stack queue management application built with MongoDB, Express, React and Node.js.

## Features

- Manager login with protected dashboard access
- Create and manage multiple queues
- Add people and generate sequential tokens
- View waiting, serving, completed and cancelled tokens
- Reorder waiting tokens
- Call the next token and complete service
- Live queue updates with Socket.IO
- Dark-mode analytics dashboard with queue activity and token distribution charts
- Operations-focused queue screen with a prominent currently serving panel
- Responsive layout for desktop, tablet and mobile screens
- Protected manager routes and password hashing
- Registration is disabled; manager accounts are provisioned separately

## Tech stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Axios
- Backend: Node.js, Express, Socket.IO
- Database: MongoDB with Mongoose
- Authentication: JWT and bcrypt

## Project structure

```text
queueflow/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Shell.jsx
│   │   │   └── Stat.jsx
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── QueuePage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── style.css
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── README.md
```

## Requirements

- Node.js 18 or later
- MongoDB local instance or MongoDB Atlas connection string

## Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd queueflow
```

### 2. Configure the backend

```bash
cd server
npm install
cp .env.example .env
```

Set `MONGODB_URI` and `JWT_SECRET` in `server/.env`. A manager account must already be provisioned in the database; managers sign in using the credentials provided to them.

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:4000` by default.

### 3. Configure the frontend

Open another terminal:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current manager |
| GET | `/api/queues` | List manager queues |
| POST | `/api/queues` | Create a queue |
| DELETE | `/api/queues/:id` | Delete a queue |
| GET | `/api/queues/:id/tokens` | List queue tokens |
| POST | `/api/queues/:id/tokens` | Add a token |
| POST | `/api/queues/:id/serve` | Call the next token |
| PATCH | `/api/queues/:id/tokens/:tokenId` | Reorder, cancel or complete a token |
| GET | `/api/analytics` | Get dashboard analytics |

Protected endpoints require `Authorization: Bearer <token>`.

## Queue behavior

- Token numbers are generated sequentially per queue.
- Waiting positions are assigned when tokens are created.
- Only waiting tokens can be moved or cancelled.
- Only the currently serving token can be completed.
- A queue can have one active serving token at a time.
- Queue changes are broadcast to connected clients through Socket.IO.

## GitHub submission

Create a repository on GitHub, then run:

```bash
git init
git add .
git commit -m "Build QueueFlow MERN application"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```
