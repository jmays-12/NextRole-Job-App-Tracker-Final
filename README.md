# NextRole

A full-stack job application tracker. Sign up, log in, and keep every application in one place so nothing slips through the cracks.

**Status:** MVP (signup/login/logout, full CRUD on applications, and ownership checks working end to end)

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Flask, Flask-SQLAlchemy, Flask-Migrate, Flask-Bcrypt, Flask-CORS
- **Database:** SQLite
- **Auth:** Session-based (HttpOnly cookie), passwords hashed with Flask-Bcrypt

## Features

- Sign up, log in, and log out
- Stay logged in after a page refresh
- Add, view, edit, and delete job applications
- Track company, role, link, date applied, status, notes, and last activity date
- Update application status with one click: applied, interviewing, offer, rejected, withdrawn, no response, or offer declined
- See a stale-application reminder when an application is still active and has had no activity for seven days; mark no response or reset the activity date
- Search by company or role, filter by status, sort by applied date or company, and hide closed applications
- Delete confirmation and an in-app help popup
- Each user only sees and edits their own applications

## Data Models

- **User**: id, email, password_hash
- **Application**: id, user_id, company, role, status, link, date_applied, notes, last_activity_at

One user has many applications.

## API Routes

| Method | Route | Auth. req'd? | Purpose |
|---|---|---|---|
| POST | `/api/signup` | no | Create account and log in |
| POST | `/api/login` | no | Log in |
| POST | `/api/logout` | no | Log out |
| GET | `/api/me` | no | Return the current user (or null) |
| GET | `/api/applications` | yes | List your applications |
| POST | `/api/applications` | yes | Create an application |
| PATCH | `/api/applications/<id>` | yes | Update an application |
| DELETE | `/api/applications/<id>` | yes | Delete an application |

Every application route checks for a valid session (401 if missing) and that the record belongs to the logged-in user (404 if not).

## Getting Started

### 1. Backend

```bash
cd server
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env       # replace SECRET_KEY with a random value
flask --app app db upgrade       # creates the database tables
flask --app app run --debug --port 5001
```

The server runs on http://localhost:5001.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Vite reads `VITE_API_URL` from the same repository-root `.env` as the backend. Only variables prefixed with `VITE_` are exposed to frontend code. Open the app at http://localhost:5173 (use `localhost`, not `127.0.0.1`, so the CORS origin matches and the session cookie is sent).

## Production Deployment

Deploy the frontend and Flask API as separate services, and use a managed PostgreSQL database for production. SQLite is the local default; on most hosting platforms its filesystem is temporary, so application data can disappear on restart or redeploy.

Configure these backend environment variables in your hosting provider:

- `SECRET_KEY`: your randomly generated secret key for production
- `DATABASE_URL`: the managed PostgreSQL connection URL. The app accepts both `postgres://` and `postgresql://` URL schemes.
- `FRONTEND_URL`: the frontend's exact origin, for example `https://jobs.example.com` (no trailing slash).
- `SESSION_COOKIE_SECURE=true`: required when serving over HTTPS.
- `SESSION_COOKIE_SAMESITE=Lax` when frontend and API are same-site. For cross-site deployments use `None`; browsers require `Secure=true` with `SameSite=None`.

Set `VITE_API_URL` in the shared root environment (or the frontend hosting/build environment) to the API base URL, including `/api`, for example `https://api.example.com/api`. Vite reads the root `.env`; only `VITE_`-prefixed variables are bundled into browser code. CORS only permits the origin configured by `FRONTEND_URL`.

Install dependencies and apply database migrations as a pre-deploy/release step, from the `server/` directory:

```bash
pip install -r requirements.txt
flask --app app db upgrade
```

Configure the backend service's start command from the `server/` directory as:

```bash
gunicorn --bind "0.0.0.0:${PORT:-8000}" --workers 2 app:app
```

Gunicorn is the production server. Do not use Flask's `--debug` mode or development server in production. The `flask --app app run --debug --port 5001` command above is for local development only.

## Project Structure

```
.env.example             # repository-root environment template
server/
├── app.py              # Flask routes (auth + applications)
├── models.py           # SQLAlchemy models (User, Application)
├── migrations/         # Flask-Migrate database migrations
└── requirements.txt
client/src/
├── main.jsx
├── App.jsx             # Shows Auth or Dashboard based on login state
├── Auth.jsx            # Login / signup form
├── Dashboard.jsx       # Application list, add, edit, delete, status chips
├── index.css
└── utils/
    ├── api.js          # All fetch calls to the backend (CORS, credentials: include)
    └── theme.js        # All Tailwind classes live here
```

## Known Issues and Placeholders

- Password validation is limited; there are no password-strength rules, password reset flow, or email verification.
- No React Router yet. The app switches between login and dashboard with conditional rendering.
- Add/edit forms are inline on the dashboard instead of separate pages.
- Job links are not validated; a missing `https://` is added when opening a link.
- Reminders are in-app only. The seven-day interval is fixed, and activity is tracked by date rather than time.
- API errors are shown as plain text; there is no centralized notification system.
- Production deployment requires a persistent database and correctly configured session cookies, CORS origin, and frontend API URL.

## Possible Future Improvements

- Configurable follow-up reminders and a dated activity history
- Password reset and email verification
- CSV export and account/data deletion
- More job details such as location, source, salary, and contact information
- Automated backend tests for authentication, ownership checks, validation, and application CRUD
