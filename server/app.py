import os
from datetime import datetime, timezone
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, jsonify, request, session
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_migrate import Migrate
from models import Application, User, db

load_dotenv()

# variables for validate_application
MAX_FIELD_LENGTH = 200
MAX_NOTES_LENGTH = 2000

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
database_url = os.environ.get("DATABASE_URL", "sqlite:///nextrole.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SESSION_COOKIE_HTTPONLY"] = True  # JS can't read the cookie
app.config["SESSION_COOKIE_SAMESITE"] = os.environ.get(
    "SESSION_COOKIE_SAMESITE", "Lax"
)
app.config["SESSION_COOKIE_SECURE"] = os.environ.get(
    "SESSION_COOKIE_SECURE", "false"
).lower() in {"true", "1", "yes"}

if not app.config["SECRET_KEY"]:
    raise RuntimeError("SECRET_KEY environment variable is not set")

CORS(
    app,
    origins=[os.environ.get("FRONTEND_URL", "http://localhost:5173")],
    supports_credentials=True,
)
bcrypt = Bcrypt(app)
db.init_app(app)
migrate = Migrate(app, db)

VALID_STATUSES = ["applied", "interviewing", "offer", "rejected", "withdrawn"]


# reusable function wrapper for validating session
def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Not logged in"}), 401
        return f(*args, **kwargs)

    return wrapper


def get_owned_application(app_id):
    """Returns the application only if it belongs to the logged-in user."""
    return Application.query.filter_by(id=app_id, user_id=session["user_id"]).first()


def is_valid_date(value):
    try:
        datetime.strptime(value, "%Y-%m-%d")  # noqa: DTZ007 - disable Ruff linter analyzing this line for not adding a timezone arg
        return True
    except (ValueError, TypeError):
        return False


def validate_application(company, role, link, notes, date_applied):
    """Returns an error message, or None if everything is fine."""
    if not company or not role:
        return "Company and role required"
    if len(company) > MAX_FIELD_LENGTH or len(role) > MAX_FIELD_LENGTH:
        return "Company and role must be 200 characters or fewer"
    if len(link) > 500:
        return "Link must be 500 characters or fewer"
    if len(notes) > MAX_NOTES_LENGTH:
        return "Notes must be 2000 characters or fewer"
    if not is_valid_date(date_applied):
        return "Date must be in YYYY-MM-DD format"
    return None


@app.post("/api/signup")
def signup():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already in use"}), 400

    user = User(
        email=email,
        password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
    )
    db.session.add(user)
    db.session.commit()
    session["user_id"] = user.id
    return jsonify({"email": user.email}), 201


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(
        user.password_hash, data.get("password") or ""
    ):
        return jsonify({"error": "Invalid email or password"}), 401

    session["user_id"] = user.id
    return jsonify({"email": user.email})


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"success": True})


@app.get("/api/me")
def me():
    if "user_id" not in session:
        return jsonify({"user": None})
    user = db.session.get(User, session["user_id"])
    if not user:  # session points at a deleted user
        session.clear()
        return jsonify({"user": None})
    return jsonify({"user": {"email": user.email}})


@app.get("/api/applications")
@login_required
def get_applications():
    apps = (
        Application.query.filter_by(user_id=session["user_id"])
        .order_by(Application.id.desc())
        .all()
    )
    return jsonify([a.to_dict() for a in apps])


@app.post("/api/applications")
@login_required
def create_application():
    data = request.get_json(silent=True) or {}

    company = str(data.get("company") or "").strip()
    role = str(data.get("role") or "").strip()
    link = str(data.get("link") or "").strip()
    date_applied = (
        data.get("date_applied") or datetime.now(timezone.utc).date().isoformat()
    )

    error = validate_application(company, role, link, "", date_applied)
    if error:
        return jsonify({"error": error}), 400

    application = Application(
        user_id=session["user_id"],
        company=company,
        role=role,
        link=link,
        date_applied=date_applied,
    )
    db.session.add(application)
    db.session.commit()
    return jsonify(application.to_dict()), 201


@app.patch("/api/applications/<int:app_id>")
@login_required
def update_application(app_id):
    application = get_owned_application(app_id)
    if not application:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json(silent=True) or {}
    company = str(data.get("company", application.company)).strip()
    role = str(data.get("role", application.role)).strip()
    link = str(data.get("link", application.link)).strip()
    notes = str(data.get("notes", application.notes))
    date_applied = data.get("date_applied", application.date_applied)
    status = data.get("status", application.status)

    error = validate_application(company, role, link, notes, date_applied)
    if error:
        return jsonify({"error": error}), 400
    if status not in VALID_STATUSES:
        return jsonify({"error": "Invalid status"}), 400

    application.company = company
    application.role = role
    application.status = status
    application.link = link
    application.date_applied = date_applied
    application.notes = notes
    db.session.commit()
    return jsonify(application.to_dict())


@app.delete("/api/applications/<int:app_id>")
@login_required
def delete_application(app_id):
    application = get_owned_application(app_id)
    if not application:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(application)
    db.session.commit()
    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(port=5001)
