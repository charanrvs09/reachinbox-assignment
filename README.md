# 📧 ReachInbox Email Scheduler

### Full-Stack Email Scheduling & Processing System

A production-style full-stack email scheduling application built as part of the **ReachInbox SDE Internship Assignment**.

The system allows users to authenticate with Google, compose and schedule emails, upload leads, process scheduled jobs asynchronously using **BullMQ + Redis**, send emails through **Ethereal SMTP**, persist data in **PostgreSQL**, search emails using **Elasticsearch**, and receive **Slack notifications** when sending limits are reached.

---

## ✨ Features

### 🔐 Authentication

- Google OAuth login
- Protected dashboard routes
- Database-backed sessions
- User profile information
- Logout functionality

### 📬 Email Scheduling

- Schedule emails for future dates and times
- Schedule emails to multiple recipients
- Individual BullMQ job per email
- Scheduled / Processing / Sent / Failed status tracking
- Persistent scheduled jobs
- Jobs survive application and worker restarts

### ⚡ Background Processing

- BullMQ-based job queue
- Redis-backed delayed jobs
- Dedicated email worker
- Configurable worker concurrency
- No cron jobs
- No in-memory scheduling timers

### 🚦 Rate Limiting & Throttling

- Per-sender hourly email limits
- Redis-based atomic rate limiting
- Redis Lua scripting for concurrency safety
- Configurable minimum delay between sends
- Automatic rescheduling when hourly limits are reached
- Slack notification when a rate limit is reached

### 🔎 Search

- Elasticsearch integration
- Email indexing
- Search scheduled and sent emails
- Dedicated search API

### 📊 Dashboard

- Email statistics
- Scheduled emails
- Sent emails
- Search
- Email composition
- Lead upload
- CSV/TXT parsing
- Slack connection status

### 🔗 Integrations

- Google OAuth
- Slack OAuth
- Ethereal SMTP
- PostgreSQL
- Redis
- Elasticsearch

---

# 🏗️ Architecture

```text
                              ┌──────────────────────┐
                              │      React App       │
                              │   React + Tailwind   │
                              └──────────┬───────────┘
                                         │
                                         │ REST API
                                         ▼
                              ┌──────────────────────┐
                              │    Express Server    │
                              │      TypeScript      │
                              └──────┬────────┬──────┘
                                     │        │
                       ┌─────────────┘        └─────────────┐
                       ▼                                    ▼
              ┌──────────────────┐                ┌──────────────────┐
              │    PostgreSQL    │                │      Redis       │
              │                  │                │                  │
              │ • Emails         │                │ • BullMQ Queue   │
              │ • Users          │                │ • Delayed Jobs   │
              │ • Sessions       │                │ • Rate Limits    │
              │ • Slack Tokens   │                │ • Throttling     │
              └──────────────────┘                └────────┬─────────┘
                                                           │
                                                           │ BullMQ
                                                           ▼
                                                ┌──────────────────────┐
                                                │    Email Worker      │
                                                │                      │
                                                │ Configurable         │
                                                │ Concurrency          │
                                                └──────┬───────┬───────┘
                                                       │       │
                                      ┌────────────────┘       └────────────────┐
                                      ▼                                         ▼
                              ┌─────────────────┐                     ┌─────────────────┐
                              │  Ethereal SMTP  │                     │  Elasticsearch  │
                              │                 │                     │                 │
                              │ Email Delivery  │                     │ Email Search    │
                              └─────────────────┘                     └─────────────────┘

                                                ┌─────────────────┐
                                                │      Slack      │
                                                │  Notifications  │
                                                └─────────────────┘






🧰 Technology Stack
Layer	Technology
Frontend	React, TypeScript, Vite
Styling	Tailwind CSS
Backend	Node.js, Express, TypeScript
Database	PostgreSQL
ORM	Prisma
Queue	BullMQ
Queue Storage	Redis
Email	Nodemailer + Ethereal SMTP
Search	Elasticsearch
Authentication	Google OAuth
Notifications	Slack OAuth
Queue Monitoring	Bull Board
Infrastructure	Docker + Docker Compose
📁 Project Structure
reachinbox-assignment/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.ts
│   │   │
│   │   ├── queue/
│   │   │   ├── email.queue.ts
│   │   │   └── email.worker.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── email.routes.ts
│   │   │   ├── search.routes.ts
│   │   │   └── slack.routes.ts
│   │   │
│   │   ├── services/
│   │   │   ├── elasticsearch.ts
│   │   │   ├── mailer.ts
│   │   │   ├── rateLimiter.ts
│   │   │   ├── sendThrottle.ts
│   │   │   └── slack.ts
│   │   │
│   │   └── server.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── .gitignore
└── README.md
📅 How Email Scheduling Works

When a user schedules an email, the following flow takes place:

User
  │
  ▼
React Dashboard
  │
  ▼
Express API
  │
  ├──────────────► PostgreSQL
  │                 Save Email
  │
  ├──────────────► Elasticsearch
  │                 Index Email
  │
  └──────────────► BullMQ
                    Create Delayed Job
                         │
                         ▼
                       Redis
                         │
                         │ Scheduled Time Reached
                         ▼
                   Email Worker
                         │
                         ├── Check Send Throttle
                         │
                         ├── Check Hourly Limit
                         │
                         ├── Send Email
                         │
                         ├── Update PostgreSQL
                         │
                         └── Update Elasticsearch

BullMQ delayed jobs are used instead of:

setTimeout()
JavaScript in-memory timers
Cron jobs

This allows scheduled jobs to be persisted and recovered after restarts.

💾 Persistence & Restart Handling

Redis is configured with AOF persistence.

BullMQ stores delayed jobs in Redis while PostgreSQL stores the persistent email records and their statuses.

Restart behaviour

If the backend or worker is restarted:

Email records remain in PostgreSQL.
BullMQ jobs remain in Redis.
Delayed jobs are recovered by BullMQ.
The worker continues processing pending jobs.
Email statuses remain persisted.
Scheduled emails can still be processed after the restart.

This makes the scheduler independent of in-memory application timers.

⚙️ Worker Concurrency

The email worker runs as a separate process from the Express API.

Concurrency is configurable:

WORKER_CONCURRENCY=5

For example, with:

WORKER_CONCURRENCY=5

the worker can process up to five jobs concurrently.

Start API
npm run dev
Start Worker
npm run dev:worker

Separating the worker from the API allows background processing to operate independently.

🚦 Rate Limiting

The application implements a per-sender hourly email limit.

Example:

HOURLY_EMAIL_LIMIT=60

Redis is used as the shared coordination layer.

Atomic Lua scripting is used so multiple workers cannot accidentally exceed the configured limit.

Rate limit flow
                    Email Job
                       │
                       ▼
                Rate Limit Check
                       │
              ┌────────┴────────┐
              │                 │
           Allowed          Limit Reached
              │                 │
              ▼                 ▼
         Send Email       Calculate Next Hour
                                │
                                ▼
                         Delay BullMQ Job
                                │
                                ▼
                         Process Later

When the hourly limit is reached, the job is delayed until the next available hour instead of being discarded.

⏱️ Minimum Send Delay

A configurable delay can be applied between email sends:

MIN_SEND_DELAY_MS=1000

Redis is used to atomically reserve the next available send slot.

This allows the send delay to remain coordinated even when multiple worker processes are running.

🔔 Slack Notifications

Slack OAuth is implemented to connect a Slack workspace.

The application stores the Slack OAuth access token for the tenant.

When the hourly sending limit is reached, the worker can send a notification to the configured Slack channel.

The application also safely handles the case where Slack is not connected.

🔑 Google Authentication

The application uses real Google OAuth authentication.

Frontend
   │
   ▼
Continue with Google
   │
   ▼
Google OAuth
   │
   ▼
Backend Callback
   │
   ▼
Find / Create User
   │
   ▼
Create Session
   │
   ▼
Dashboard

Users and sessions are stored in PostgreSQL.

Unauthenticated users are redirected to the login page when accessing protected routes.

🔎 Elasticsearch Search

Scheduled and sent emails are indexed into Elasticsearch.

Index
emails
Search API
GET /api/search/emails?q=<search-term>

Elasticsearch is initialized when the backend starts.

📊 BullMQ Dashboard

Bull Board is integrated for queue monitoring.

Local dashboard:

http://localhost:5000/admin/queues

It provides visibility into the BullMQ email queue and job states.

🔌 API Endpoints
Method	Endpoint	Description
GET	/health	Backend and database health
POST	/api/email/schedule	Schedule email(s)
GET	/api/email/scheduled	Get scheduled emails
GET	/api/email/sent	Get sent/failed emails
GET	/api/search/emails?q=	Search emails
GET	/admin/queues	BullMQ dashboard
Schedule Email Example
{
  "recipient": "recipient@example.com",
  "sender": "sender@example.com",
  "subject": "Test Email",
  "body": "Hello from ReachInbox",
  "scheduledAt": "2026-09-10T10:00:00.000Z"
}
🔐 Environment Variables

Create a file:

backend/.env

Example configuration:

DATABASE_URL="postgresql://reachinbox:reachinbox@localhost:5432/reachinbox"

REDIS_URL="redis://localhost:6379"

ELASTICSEARCH_URL="http://localhost:9200"

PORT=5000

WORKER_CONCURRENCY=5

MIN_SEND_DELAY_MS=1000

HOURLY_EMAIL_LIMIT=60

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_username
SMTP_PASS=your_ethereal_password
SMTP_FROM=your_ethereal_email

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=http://localhost:5000/api/slack/callback
SLACK_TENANT_ID=your_tenant_id

Important: Never commit .env files, passwords, OAuth secrets, or access tokens to GitHub.

📧 Ethereal Email Setup

Ethereal Email is used as the SMTP provider for testing.

Configure the SMTP credentials in backend/.env:

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASS=your_password
SMTP_FROM=your_email

After an email is sent, Ethereal provides a preview URL that can be used to inspect the test email.

🚀 Local Setup
Prerequisites

Make sure the following are installed:

Node.js
npm
Docker Desktop
Git
1. Clone Repository
git clone <PRIVATE_REPOSITORY_URL>
cd reachinbox-assignment
2. Start Infrastructure

Start PostgreSQL, Redis and Elasticsearch:

docker compose up -d

Check running services:

docker compose ps

Services:

Service	Port
PostgreSQL	5432
Redis	6379
Elasticsearch	9200
3. Install Backend Dependencies
cd backend
npm install
4. Configure Environment

Create:

backend/.env

Add the required environment variables described above.

5. Generate Prisma Client
npx prisma generate
6. Start Backend
npm run dev

Backend:

http://localhost:5000

Health check:

http://localhost:5000/health
7. Start Worker

Open a new terminal:

cd reachinbox-assignment/backend
npm run dev:worker

Expected output:

Email worker is running with concurrency 5...
8. Start Frontend

Open another terminal:

cd reachinbox-assignment/frontend
npm install
npm run dev

Frontend:

http://localhost:5173
🖥️ Running the Complete Application

Four processes are used during local development.

Terminal 1 — Infrastructure
docker compose up -d
Terminal 2 — Backend
cd backend
npm run dev
Terminal 3 — Worker
cd backend
npm run dev:worker
Terminal 4 — Frontend
cd frontend
npm run dev
🧪 Testing the Scheduler
Start PostgreSQL, Redis and Elasticsearch.
Start the Express backend.
Start the BullMQ worker.
Start the React frontend.
Login using Google.
Open the dashboard.
Compose an email.
Select a future date and time.
Schedule the email.
Verify that it appears in the Scheduled tab.
Wait until the scheduled time.
BullMQ worker processes the job.
Rate limiting and send throttling are checked.
Email is sent using Ethereal SMTP.
PostgreSQL is updated with the final status.
Elasticsearch is updated.
The email appears in the Sent tab.
🔄 Restart Test

The scheduler can be tested for persistence using the following flow:

1. Schedule an email for a future time.
          ↓
2. Stop the backend and worker.
          ↓
3. Wait for some time.
          ↓
4. Start the backend again.
          ↓
5. Start the worker again.
          ↓
6. BullMQ recovers the delayed job.
          ↓
7. Worker processes the job.
          ↓
8. Email is sent through Ethereal.

This demonstrates that scheduling does not rely on in-memory timers.

📋 Assignment Requirement Mapping
Backend Requirements
Assignment Requirement	Implementation
Scheduler	BullMQ delayed jobs
Persistence	PostgreSQL + Redis
Queue	BullMQ
Worker	Dedicated BullMQ worker
Concurrency	Configurable WORKER_CONCURRENCY
Minimum delay	Redis-based send throttle
Hourly limits	Atomic Redis Lua rate limiter
Rescheduling	BullMQ delayed jobs
Email sending	Nodemailer + Ethereal SMTP
Search	Elasticsearch
Queue monitoring	Bull Board
Google authentication	Google OAuth
Slack integration	Slack OAuth + notifications
Frontend Requirements
Assignment Requirement	Implementation
Login	Google OAuth
Dashboard	React dashboard
Compose	Compose Email interface
Scheduling	Future date/time scheduling
Scheduled emails	Scheduled tab
Sent emails	Sent tab
Search	Elasticsearch-backed search
Lead upload	CSV/TXT upload
Lead parsing	PapaParse
Statistics	Dashboard statistics
Logout	Session logout
Slack	Slack connection/status
📝 Assumptions
Ethereal Email is used instead of a production email provider because this is an assessment/testing environment.
The application is demonstrated using a local Docker-based environment.
Each scheduled recipient is processed as an individual email job.
Email sending limits are applied per sender.
Redis is used as the shared coordination layer for rate limiting and send throttling.
PostgreSQL is the persistent source for application data.
Elasticsearch is used for search rather than as the primary database.
⚖️ Trade-offs
Redis-backed Rate Limiting

Redis atomic operations allow multiple workers to coordinate rate limits safely.

Separate Worker Process

The worker is separated from the API process so background processing does not block API requests and worker concurrency can be configured independently.

BullMQ Delayed Jobs

BullMQ is used instead of setTimeout() or cron jobs so scheduled jobs are persisted in Redis and can survive application restarts.

PostgreSQL + Elasticsearch

PostgreSQL is used for persistent application data while Elasticsearch is used for search.

Ethereal SMTP

Ethereal is suitable for development and demonstrations but is not intended to be a production email delivery provider.

🏗️ Build
Backend
cd backend
npm run build
Frontend
cd frontend
npm run build
🐳 Docker
Start services
docker compose up -d
Stop services
docker compose down
Check services
docker compose ps
🎥 Demo Checklist

The demonstration covers:

✅ Google Login
✅ Dashboard
✅ Email composition
✅ CSV/TXT lead upload
✅ Email scheduling
✅ Scheduled emails
✅ BullMQ queue
✅ Worker processing
✅ Ethereal email delivery
✅ Sent emails
✅ Elasticsearch search
✅ Minimum send delay
✅ Hourly rate limiting
✅ Slack integration
✅ Application restart persistence
🔒 Repository

This project is maintained in a private GitHub repository as required by the ReachInbox SDE Internship Assignment.

👨‍💻 Author

Developed as part of the ReachInbox SDE Internship Assignment.
