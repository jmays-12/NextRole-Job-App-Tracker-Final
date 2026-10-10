from datetime import date, timedelta
from pathlib import Path

from flask import Flask
from flask_bcrypt import Bcrypt
from models import Application, User, db

DEMO_EMAIL = "test@test.com"
DEMO_PASSWORD = "test"

seed_app = Flask(__name__)
seed_app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///nextrole-seed.db"
SEED_DB_PATH = Path(seed_app.instance_path) / "nextrole-seed.db"
db.init_app(seed_app)
bcrypt = Bcrypt(seed_app)

SAMPLE_APPLICATIONS = [
    {
        "company": "Job Corp",
        "role": "Junior Software Engineer",
        "status": "applied",
        "days_ago": 3,
        "activity_days_ago": 3,
        "link": "https://example.com/jobs/junior-software-engineer",
        "notes": "Applied through the company careers page. Review the project portfolio before following up.",
    },
    {
        "company": "ABC Co.",
        "role": "Frontend Developer",
        "status": "interviewing",
        "days_ago": 18,
        "activity_days_ago": 2,
        "link": "https://example.com/jobs/frontend-developer",
    },
    {
        "company": "Example Company",
        "role": "Backend Engineer I",
        "status": "applied",
        "days_ago": 14,
        "activity_days_ago": 14,
        "link": "https://example.com/jobs/backend-engineer",
        "notes": "Review API design, database relationships, and recent backend project examples.",
    },
    {
        "company": "Acme Software",
        "role": "Full Stack Developer",
        "status": "offer",
        "days_ago": 36,
        "activity_days_ago": 1,
        "link": "https://example.com/jobs/full-stack-developer",
    },
    {
        "company": "Sample Solutions",
        "role": "Associate Web Developer",
        "status": "no response",
        "days_ago": 29,
        "activity_days_ago": 18,
        "link": "https://example.com/jobs/associate-web-developer",
        "notes": "Sent one polite follow-up. No response yet; revisit if a new contact becomes available.",
    },
    {
        "company": "Demo Technologies",
        "role": "Software Engineer",
        "status": "rejected",
        "days_ago": 42,
        "activity_days_ago": 9,
        "link": "https://example.com/jobs/software-engineer",
        "notes": "Thank the interviewer for their time. Note areas to practice for future technical screens.",
    },
    {
        "company": "General Systems",
        "role": "Entry-Level QA Engineer",
        "status": "applied",
        "days_ago": 8,
        "activity_days_ago": 8,
        "link": "https://example.com/jobs/qa-engineer",
        "notes": "Highlight test planning, bug reports, and any automated testing experience.",
    },
    {
        "company": "Placeholder Apps",
        "role": "React Developer",
        "status": "interviewing",
        "days_ago": 21,
        "activity_days_ago": 5,
        "link": "https://example.com/jobs/react-developer",
        "notes": "Technical interview scheduled. Review hooks, state management, accessibility, and component testing.",
    },
    {
        "company": "Test Company",
        "role": "Cloud Support Engineer",
        "status": "withdrawn",
        "days_ago": 25,
        "activity_days_ago": 7,
        "link": "https://example.com/jobs/cloud-support",
        "notes": "Withdrew after accepting another interview process. Keep the contact details for networking.",
    },
    {
        "company": "First Choice Tech",
        "role": "Junior Data Engineer",
        "status": "applied",
        "days_ago": 1,
        "activity_days_ago": 1,
        "link": "https://example.com/jobs/junior-data-engineer",
    },
    {
        "company": "Next Step Software",
        "role": "Software Developer Intern",
        "status": "offer declined",
        "days_ago": 54,
        "activity_days_ago": 12,
        "link": "https://example.com/software-intern",
        "notes": "Declined due to schedule. Send a brief thank you and leave the door open for future roles.",
    },
    {
        "company": "Open Role Co.",
        "role": "Application Developer",
        "status": "applied",
        "days_ago": 11,
        "activity_days_ago": 11,
        "link": "https://example.com/jobs/application-developer",
        "notes": "Application submitted. Prepare a concise overview of a recent full-stack project.",
    },
    {
        "company": "Generic Cloud Services",
        "role": "Associate Platform Engineer",
        "status": "interviewing",
        "days_ago": 16,
        "activity_days_ago": 3,
        "link": "https://example.com/jobs/platform-engineer",
        "notes": "Next step is a conversation with the team. Review Linux fundamentals and deployment experience.",
    },
    {
        "company": "Career Builders",
        "role": "Web Application Engineer",
        "status": "applied",
        "days_ago": 6,
        "activity_days_ago": 6,
        "link": "",
        "notes": "Found the opening through a general job board. Verify the application details before following up.",
    },
    {
        "company": "Software Group",
        "role": "Graduate Software Engineer",
        "status": "applied",
        "days_ago": 1,
        "activity_days_ago": 1,
        "link": "https://example.com/jobs/graduate-engineer",
    },
]


def seed_database() -> int:
    """Recreate the dedicated seed database with the demo account and sample jobs."""
    with seed_app.app_context():
        db.drop_all()
        db.create_all()

        user = User(
            email=DEMO_EMAIL,
            password_hash=bcrypt.generate_password_hash(DEMO_PASSWORD).decode("utf-8"),
        )
        db.session.add(user)
        db.session.flush()

        today = date.today()  # noqa

        for sample in SAMPLE_APPLICATIONS:
            db.session.add(
                Application(
                    user_id=user.id,
                    company=sample["company"],
                    role=sample["role"],
                    status=sample["status"],
                    link=sample["link"],
                    date_applied=(
                        today - timedelta(days=sample["days_ago"])
                    ).isoformat(),
                    notes=sample.get("notes", ""),
                    last_activity_at=(
                        today - timedelta(days=sample["activity_days_ago"])
                    ).isoformat(),
                )
            )

        db.session.commit()
        return len(SAMPLE_APPLICATIONS)


if __name__ == "__main__":
    count = seed_database()
    print(f"Reset {SEED_DB_PATH} and added {count} sample applications.")
    print(f"Demo login: {DEMO_EMAIL} / {DEMO_PASSWORD}")
