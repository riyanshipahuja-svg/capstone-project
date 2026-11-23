# University Campus Management System

A web-based university management application where **administrators**, **faculty** and **students** manage courses, attendance and announcements. Built as a Backend Development Capstone Project (MVC architecture, REST API, MongoDB, JWT, Socket.IO).

## Features

- **Admin:** manage students, faculty and courses; assign faculty to courses; enrol students; publish university-wide announcements; view statistics and reports.
- **Faculty:** view assigned courses and enrolled students; mark, edit and delete attendance (only for their own courses); view records and percentages; publish course announcements.
- **Student:** view profile, enrolled courses, attendance records, subject-wise attendance percentage and relevant announcements.
- **Security:** bcrypt password hashing, JWT access + refresh tokens (rotation, logout invalidation), role-based access control, passwords never returned, students can only see their own attendance.
- **Backend techniques:** MongoDB indexes, 3 aggregation pipelines, Node.js `EventEmitter`, Socket.IO with JWT authentication, validation / logging / centralised error-handling middleware, pagination and filtering.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, Axios, React Router DOM, Socket.IO Client |
| Backend | Node.js 22, Express 5, MongoDB, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, Socket.IO, dotenv |
| Tools | MongoDB Compass, Postman |

`bcryptjs` is the pure-JavaScript implementation of bcrypt (same algorithm, no native compilation needed).

## Folder structure

```
university-campus-management/
├── backend/
│   ├── config/         env.js (env validation), db.js (Mongo connection)
│   ├── models/         User, Course, Attendance, Announcement, RefreshToken
│   ├── controllers/    auth, user (students+faculty), course, attendance, announcement, report
│   ├── routes/         index.js (all routes + validation rules)
│   ├── middleware/     auth.js (protect, authorize), requestLogger.js, errorHandler.js
│   ├── services/       attendanceService (aggregations), courseAccess, notificationService
│   ├── events/         appEvents.js (EventEmitter), listeners.js
│   ├── sockets/        index.js (Socket.IO server + JWT auth), io.js
│   ├── seeders/        seed.js
│   ├── utils/          ApiError, response, validate, pagination, tokens, date
│   ├── tests/          api.test.js (integration tests)
│   ├── app.js          Express app          server.js  entry point
│   └── .env.example
├── frontend/
│   ├── src/api/        Axios client with token refresh
│   ├── src/context/    AuthContext (auth + socket), ToastContext
│   ├── src/components/ Layout (sidebar/topbar), ProtectedRoute, reusable UI
│   ├── src/pages/      Login, Dashboard, Announcements, admin/, faculty/, student/
│   └── .env.example
├── postman/            Campus_Management_API.postman_collection.json
├── docs/               API_DOCUMENTATION.md (every endpoint)
├── e2e/                ui_test.py (optional browser test, Playwright for Python)
└── README.md
```

## Installation

**Prerequisites:** Node.js 20+ (tested on 22), and MongoDB running locally (or a MongoDB Atlas URI).

### 1. MongoDB configuration

1. Install and start MongoDB Community Server (default port 27017).
2. Open **MongoDB Compass** and connect to `mongodb://127.0.0.1:27017`.
3. You do not have to create the database manually. `campus_management` is created automatically on first run/seed. Refresh Compass afterwards to see `users`, `courses`, `attendances`, `announcements` and `refreshtokens`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
# edit .env: set two long random secrets (see below)
npm run seed                # inserts sample data (clears existing collections!)
npm run dev                 # or: npm start   -> http://localhost:5000
```

Generate secrets: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                 # -> http://localhost:5173
```

Production build: `npm run build`.

### Environment variables (`backend/.env`)

| Variable | Meaning | Example |
|---|---|---|
| `PORT` | API port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/campus_management` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | long random string |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (different value) | long random string |
| `ACCESS_TOKEN_EXPIRY` | Access token lifetime | `15m` |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime | `7d` |
| `CLIENT_URL` | Frontend origin for CORS + Socket.IO | `http://localhost:5173` |

Frontend (`frontend/.env`): `VITE_API_URL=http://localhost:5000/api`, `VITE_SOCKET_URL=http://localhost:5000`.
**Open the app at `http://localhost:5173` (not `127.0.0.1`)** — the backend CORS policy only allows the `CLIENT_URL` origin.

## Demo credentials (created by `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@campus.edu` | `Admin@123` |
| Faculty | `rajesh.verma@campus.edu` (also `anita.sharma@…`, `vikram.singh@…`) | `Faculty@123` |
| Student | `aarav.mehta@campus.edu` (also `diya.patel@…`, `kabir.khanna@…`, `isha.reddy@…`, `rohan.gupta@…`) | `Student@123` |

Seed data: 1 admin, 3 faculty, 5 students, 4 courses (CS101, CS201, MA101, PH101), enrolments, 112 attendance records over 8 weekdays, 4 announcements. Passwords are hashed with bcrypt during seeding.

## API overview

Full details for every endpoint (method, URL, purpose, auth, role, body, success and error responses) are in **[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)**.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/register` (admin), `GET /auth/me` |
| Students / Faculty (admin) | `GET/POST /students`, `GET/PUT/DELETE /students/:id` (same for `/faculty`) |
| Courses | CRUD, `PUT /courses/:id/faculty`, `POST /courses/:id/enroll`, `DELETE /courses/:id/enroll/:studentId`, `GET /courses/:id/students` |
| Attendance | `POST /attendance`, `GET /attendance`, `GET /attendance/my`, `GET /attendance/sheet`, `GET/PUT/DELETE /attendance/:id` |
| Announcements | CRUD on `/announcements` |
| Reports | `GET /reports/dashboard`, `/reports/attendance/students`, `/reports/attendance/courses`, `/reports/enrollment` |

### Indexes

| Collection | Index | Why |
|---|---|---|
| Attendance | **unique** `{ student, course, date }` | blocks duplicate attendance |
| Attendance | `{ course, date: -1 }` | attendance sheet / history per course |
| User | **unique partial** `{ rollNumber }` | unique roll numbers (students only) |
| User | `{ role, department }` | list + filter screens |
| Course | `{ faculty }`, `{ students }` | "my courses" queries |
| Announcement | `{ target, course, createdAt: -1 }` | newest-first feeds |
| RefreshToken | TTL `{ expiresAt }` | expired sessions are auto-deleted |

### Aggregation pipelines

1. **Student-wise attendance** (`/reports/attendance/students`): `$match` → `$group` by student+course (count total and present with `$cond`) → `$addFields` percentage → optional `$match` (`below=75`) → `$lookup` users and courses → `$project`. Also used for the student's own subject-wise summary.
2. **Course-wise attendance** (`/reports/attendance/courses`): `$group` by course with `$addToSet` for distinct students and sessions → `$lookup` course → average percentage.
3. **Enrolment statistics** (`/reports/enrollment`): `$facet` producing per-course counts (`$size`), an overall summary (`$group` + `$avg`) and per-department counts (`$unwind` + `$lookup`).

## EventEmitter implementation

`backend/events/appEvents.js` exports one shared `EventEmitter` and the event names. Controllers only **emit**; they never contain notification logic:

```js
// controllers/attendanceController.js  (after saving to MongoDB)
appEvents.emit(EVENTS.ATTENDANCE_MARKED, { courseId, courseCode, date, records });
```

`backend/events/listeners.js` (registered once in `server.js`) subscribes to the events and reacts: it logs the event and calls `services/notificationService.js`, which pushes Socket.IO messages. Two events exist:

| Event | Emitted when | Reaction |
|---|---|---|
| `attendanceMarked` | faculty marks attendance | each student receives `attendance:marked` |
| `announcementCreated` | admin/faculty publishes an announcement | relevant users receive `announcement:new` |

Because the API response does not wait for notifications and listener errors are caught, a failing notification can never break the HTTP request.

## Socket.IO events

The client connects with `io(SOCKET_URL, { auth: { token: <accessToken> } })`. The server verifies the JWT and rejects the connection otherwise (`Authentication required` / `Invalid or expired token`). Every user joins a private room `user:<id>`, and messages are sent to those rooms only, so nobody receives data meant for someone else.

| Event (server → client) | Payload | Who receives it |
|---|---|---|
| `socket:ready` | `{ userId, role }` | the connecting user, after authentication |
| `announcement:new` | `{ id, title, message, target, course, createdAt }` | university-wide: all users except the author; course: that course's faculty and enrolled students except the author |
| `attendance:marked` | `{ courseId, courseCode, date, status }` | each marked student, **only their own status** |

In the UI, events show a toast, increase the bell counter in the top bar and refresh the dashboard, announcement and attendance pages.

## Testing

**Automated backend tests** (needs MongoDB running; uses a separate `campus_test` database, never your real data):

```bash
cd backend
npm test
```

14 integration tests cover: password hashing, login errors, 401/403 enforcement, token refresh rotation and logout, student/faculty/course CRUD, enrolment, attendance marking, duplicate prevention, authorization, student privacy, percentage calculation, all three aggregations, announcement visibility, Socket.IO authentication and targeted delivery, the EventEmitter event, error JSON shape and index existence.

**Postman:** import `postman/Campus_Management_API.postman_collection.json`, run `npm run seed`, start the backend, then run the collection top to bottom with the Collection Runner. It stores tokens/ids automatically and covers successful requests, invalid input, 401, 403, 404, 409 and duplicate attendance (126 requests, 341 assertions). Command line: `npx newman run postman/Campus_Management_API.postman_collection.json`.

**Browser test (optional):** `pip install playwright && playwright install chromium`, start backend + frontend, run `python e2e/ui_test.py`.

## Verification status (what was actually run)

| Check | Result |
|---|---|
| All backend files pass `node --check` | passed |
| Backend startup + real MongoDB 7.0 connection | passed |
| Seed script | passed (counts above) |
| `npm test` (14 integration tests, real MongoDB) | 14/14 passed |
| Postman collection via Newman | 126 requests, 341/341 assertions passed |
| Frontend production build (`vite build`) | passed |
| Browser test (Chromium, 3 roles in parallel, real backend) | 19/19 passed, incl. live notifications |

## Known limitations

- Access tokens are kept in `localStorage` (simple for a student project; an HttpOnly cookie is more resistant to XSS).
- Attendance is one record per student per course per day (one session a day per course).
- Seeding **deletes** all existing data in the five collections.
- Tested on Chromium only; the layout was checked at desktop (1280px) and phone (390px) widths.
- No email/password-reset flow, file uploads or timetable, as they are outside the project scope.
