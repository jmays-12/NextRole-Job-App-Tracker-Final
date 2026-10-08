from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)

    applications = db.relationship(
        "Application", backref="user", cascade="all, delete-orphan"
    )


class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    company = db.Column(db.String, nullable=False)
    role = db.Column(db.String, nullable=False)
    status = db.Column(db.String, nullable=False, default="applied")
    link = db.Column(db.String, nullable=False, default="")
    # kept as YYYY-MM-DD text so the client doesn't change
    date_applied = db.Column(
        db.String,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).date().isoformat(),
    )
    notes = db.Column(db.String, nullable=False, default="")
    last_activity_at = db.Column(db.String, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "company": self.company,
            "role": self.role,
            "status": self.status,
            "link": self.link,
            "date_applied": self.date_applied,
            "notes": self.notes,
        }
