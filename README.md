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
- Track company, role, link, date applied, status, and notes
- Move an application through stages with one click: applied, interviewing, offer, rejected, withdrawn
- Delete confirmation and an in-app help popup
- Each user only sees and edits their own applications

## Data Models

- **User**: id, email, password_hash
- **Application**: id, user_id, company, role, status, link, date_applied, notes

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
cp ../.env.example ../.env             # then edit .env and set SECRET_KEY
flask --app app db upgrade       # creates the database tables
python app.py
```

The server runs on http://localhost:5001.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Open the app at http://localhost:5173 (use `localhost`, not `127.0.0.1`, so the CORS origin matches and the session cookie is sent).

## Project Structure

```
server/
├── app.py              # Flask routes (auth + applications)
├── models.py           # SQLAlchemy models (User, Application)
├── migrations/         # Flask-Migrate database migrations
├── requirements.txt
└── .env.example        # copy to .env and set SECRET_KEY
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

- Styling is not finalized. All classes live in `client/src/utils/theme.js`, so restyling happens in one place.
- No password rules or email format validation beyond "required".
- No React Router yet. The app switches between login and dashboard with conditional rendering.
- Add/edit forms are inline on the dashboard instead of separate pages.
- Job links are not validated (a missing `https://` is added automatically when the link is opened).
- A failed API call shows a plain error message, and there are no loading states beyond the initial page load.
- Cookie settings are for local development only and will need changes for deployment (separate domains need `SameSite=None; Secure`).
- Not deployed. Runs locally only.

## Planned for Final Version

- Status filtering
- Form validation
- Error and loading states
- Real styling
- Deployment, if time allows
