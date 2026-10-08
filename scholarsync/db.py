import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def database_path():
    configured = os.environ.get("SCHOLARSYNC_DB")
    if configured:
        return Path(configured)
    data_dir = Path(os.environ.get("SCHOLARSYNC_DATA", ROOT / ".data"))
    return data_dir / "scholarsync.db"

SCHEMA = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'professor')) DEFAULT 'student',
  university TEXT,
  department TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  major TEXT,
  graduation_year INTEGER,
  gpa REAL,
  skills TEXT NOT NULL DEFAULT '[]',
  interests TEXT NOT NULL DEFAULT '[]',
  resume_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS professor_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  research_areas TEXT NOT NULL DEFAULT '[]',
  lab_name TEXT,
  website_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  professor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  skills_needed TEXT NOT NULL DEFAULT '[]',
  research_areas TEXT NOT NULL DEFAULT '[]',
  duration TEXT,
  compensation TEXT,
  positions_available INTEGER NOT NULL DEFAULT 1,
  application_deadline TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'filled')) DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (opportunity_id, student_id)
);

CREATE TABLE IF NOT EXISTS saved_opportunities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, opportunity_id)
);
"""


def now():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def new_id():
    return str(uuid.uuid4())


def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=32)
    return f"{salt}:{digest.hex()}"


def verify_password(password, stored):
    try:
        salt, digest = stored.split(":", 1)
        actual = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=32)
        return hmac.compare_digest(actual, bytes.fromhex(digest))
    except (ValueError, TypeError):
        return False


def loads(value):
    if isinstance(value, list):
        return [str(item) for item in value]
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return []
    return [str(item) for item in parsed] if isinstance(parsed, list) else []


def connect():
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db(connection):
    connection.executescript(SCHEMA)
    count = connection.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]
    if count == 0:
        seed(connection)
    connection.commit()


def seed(connection):
    created = now()
    professor_id = new_id()
    connection.execute(
        """
        INSERT INTO users (
          id, email, password_hash, full_name, role, university, department, bio, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'professor', ?, ?, ?, ?, ?)
        """,
        (
            professor_id,
            "maya.chen@university.edu",
            hash_password("demo1234"),
            "Dr. Maya Chen",
            "State University",
            "Computer Science",
            "I lead the Adaptive Systems Lab and look for students who enjoy applied machine learning.",
            created,
            created,
        ),
    )
    connection.execute(
        """
        INSERT INTO professor_profiles (
          id, user_id, title, research_areas, lab_name, website_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            new_id(),
            professor_id,
            "Associate Professor",
            json.dumps(["Computer Science", "Artificial Intelligence"]),
            "Adaptive Systems Lab",
            "https://example.edu/labs/adaptive-systems",
            created,
            created,
        ),
    )
    insert = """
        INSERT INTO opportunities (
          id, professor_id, title, description, requirements, skills_needed, research_areas,
          duration, compensation, positions_available, application_deadline, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
    """
    connection.execute(
        insert,
        (
            new_id(),
            professor_id,
            "Machine Learning Research Assistant",
            "Help design and evaluate models that match students with research mentors. You will clean datasets, run experiments, and write up results with the lab.",
            "Comfort with Python and a course in machine learning or statistics.",
            json.dumps(["Python", "Machine Learning", "Data Analysis"]),
            json.dumps(["Computer Science", "Artificial Intelligence"]),
            "Semester",
            "Stipend",
            2,
            None,
            created,
            created,
        ),
    )
    connection.execute(
        insert,
        (
            new_id(),
            professor_id,
            "Climate Data Analysis Intern",
            "Work with public climate datasets to find patterns in extreme weather. The project mixes statistics, visualization, and a short research paper.",
            "Interest in environmental data and at least one programming language.",
            json.dumps(["Python", "R", "Statistics"]),
            json.dumps(["Environmental Science", "Data Analysis"]),
            "Summer",
            "Course credit",
            1,
            None,
            created,
            created,
        ),
    )


def _profile_from_join(row):
    if row is None:
        return None
    data = dict(row)
    data["skills"] = loads(data.get("skills"))
    data["interests"] = loads(data.get("interests"))
    data["research_areas"] = loads(data.get("research_areas"))
    return data


def get_profile(connection, user_id):
    row = connection.execute(
        """
        SELECT
          u.*,
          s.major, s.graduation_year, s.gpa, s.skills, s.interests,
          s.resume_url, s.linkedin_url, s.github_url,
          p.title, p.research_areas, p.lab_name, p.website_url
        FROM users u
        LEFT JOIN student_profiles s ON s.user_id = u.id
        LEFT JOIN professor_profiles p ON p.user_id = u.id
        WHERE u.id = ?
        """,
        (user_id,),
    ).fetchone()
    return _profile_from_join(row)


def get_user_by_email(connection, email):
    row = connection.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?",
        (email.strip().lower(),),
    ).fetchone()
    return dict(row) if row else None


def profile_complete(user):
    if not user:
        return False
    if user["role"] == "student":
        return bool(user["skills"] or user["interests"])
    return bool(user["research_areas"])


def create_user(connection, email, password, full_name, role, university):
    created = now()
    user_id = new_id()
    connection.execute(
        """
        INSERT INTO users (id, email, password_hash, full_name, role, university, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, email, hash_password(password), full_name, role, university, created, created),
    )
    if role == "student":
        connection.execute(
            """
            INSERT INTO student_profiles (id, user_id, skills, interests, created_at, updated_at)
            VALUES (?, ?, '[]', '[]', ?, ?)
            """,
            (new_id(), user_id, created, created),
        )
    else:
        connection.execute(
            """
            INSERT INTO professor_profiles (id, user_id, research_areas, created_at, updated_at)
            VALUES (?, ?, '[]', ?, ?)
            """,
            (new_id(), user_id, created, created),
        )
    connection.commit()
    return user_id


def save_profile(connection, user, fields):
    created = now()
    connection.execute(
        """
        UPDATE users
        SET full_name = ?, university = ?, department = ?, bio = ?, updated_at = ?
        WHERE id = ?
        """,
        (
            fields["full_name"],
            fields["university"],
            fields["department"],
            fields["bio"],
            created,
            user["id"],
        ),
    )
    if user["role"] == "student":
        connection.execute(
            """
            UPDATE student_profiles
            SET major = ?, graduation_year = ?, gpa = ?, skills = ?, interests = ?,
                linkedin_url = ?, github_url = ?, updated_at = ?
            WHERE user_id = ?
            """,
            (
                fields["major"],
                fields["graduation_year"],
                fields["gpa"],
                json.dumps(fields["skills"]),
                json.dumps(fields["interests"]),
                fields["linkedin_url"],
                fields["github_url"],
                created,
                user["id"],
            ),
        )
    else:
        connection.execute(
            """
            UPDATE professor_profiles
            SET title = ?, lab_name = ?, research_areas = ?, website_url = ?, updated_at = ?
            WHERE user_id = ?
            """,
            (
                fields["title"],
                fields["lab_name"],
                json.dumps(fields["research_areas"]),
                fields["website_url"],
                created,
                user["id"],
            ),
        )
    connection.commit()


def _opportunity(row):
    data = dict(row)
    data["skills_needed"] = loads(data.get("skills_needed"))
    data["research_areas"] = loads(data.get("research_areas"))
    data["professor"] = {
        "id": data["professor_id"],
        "full_name": data.get("professor_name"),
        "university": data.get("professor_university"),
        "department": data.get("professor_department"),
        "title": data.get("professor_title"),
        "lab_name": data.get("lab_name"),
        "website_url": data.get("professor_website"),
    }
    return data


OPPORTUNITY_SELECT = """
    SELECT
      o.*,
      u.full_name AS professor_name,
      u.university AS professor_university,
      u.department AS professor_department,
      p.title AS professor_title,
      p.lab_name,
      p.website_url AS professor_website,
      (SELECT COUNT(*) FROM applications a WHERE a.opportunity_id = o.id) AS application_count
    FROM opportunities o
    JOIN users u ON u.id = o.professor_id
    LEFT JOIN professor_profiles p ON p.user_id = o.professor_id
"""


def list_open_opportunities(connection):
    rows = connection.execute(
        OPPORTUNITY_SELECT + " WHERE o.status = 'open' ORDER BY o.created_at DESC"
    ).fetchall()
    return [_opportunity(row) for row in rows]


def list_professor_opportunities(connection, professor_id):
    rows = connection.execute(
        OPPORTUNITY_SELECT + " WHERE o.professor_id = ? ORDER BY o.created_at DESC",
        (professor_id,),
    ).fetchall()
    return [_opportunity(row) for row in rows]


def get_opportunity(connection, opportunity_id):
    row = connection.execute(
        OPPORTUNITY_SELECT + " WHERE o.id = ?",
        (opportunity_id,),
    ).fetchone()
    return _opportunity(row) if row else None


def list_saved_ids(connection, user_id):
    rows = connection.execute(
        "SELECT opportunity_id FROM saved_opportunities WHERE user_id = ?",
        (user_id,),
    ).fetchall()
    return {row["opportunity_id"] for row in rows}


def list_saved_opportunities(connection, user_id):
    rows = connection.execute(
        OPPORTUNITY_SELECT
        + """
        JOIN saved_opportunities s ON s.opportunity_id = o.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
        """,
        (user_id,),
    ).fetchall()
    return [_opportunity(row) for row in rows]


def toggle_saved(connection, user_id, opportunity_id):
    existing = connection.execute(
        "SELECT id FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?",
        (user_id, opportunity_id),
    ).fetchone()
    if existing:
        connection.execute("DELETE FROM saved_opportunities WHERE id = ?", (existing["id"],))
        connection.commit()
        return False
    found = connection.execute(
        "SELECT id FROM opportunities WHERE id = ?",
        (opportunity_id,),
    ).fetchone()
    if not found:
        return None
    connection.execute(
        "INSERT INTO saved_opportunities (id, user_id, opportunity_id, created_at) VALUES (?, ?, ?, ?)",
        (new_id(), user_id, opportunity_id, now()),
    )
    connection.commit()
    return True


def _application(row):
    data = dict(row)
    data["skills"] = loads(data.get("skills"))
    data["interests"] = loads(data.get("interests"))
    if data.get("opportunity_skills") is not None or data.get("opportunity_title"):
        data["opportunity"] = {
            "id": data.get("opportunity_id"),
            "title": data.get("opportunity_title"),
            "professor_id": data.get("professor_id"),
            "skills_needed": loads(data.get("opportunity_skills")),
            "research_areas": loads(data.get("opportunity_areas")),
        }
    if data.get("student_name") is not None or data.get("student_email"):
        data["student"] = {
            "id": data.get("student_id"),
            "full_name": data.get("student_name"),
            "email": data.get("student_email"),
            "university": data.get("student_university"),
            "major": data.get("major"),
            "skills": data["skills"],
            "interests": data["interests"],
            "bio": data.get("student_bio"),
        }
    return data


APPLICATION_SELECT = """
    SELECT
      a.*,
      o.title AS opportunity_title,
      o.professor_id,
      o.skills_needed AS opportunity_skills,
      o.research_areas AS opportunity_areas,
      u.full_name AS student_name,
      u.email AS student_email,
      u.university AS student_university,
      u.bio AS student_bio,
      s.major, s.skills, s.interests
    FROM applications a
    JOIN opportunities o ON o.id = a.opportunity_id
    JOIN users u ON u.id = a.student_id
    LEFT JOIN student_profiles s ON s.user_id = a.student_id
"""


def list_student_applications(connection, student_id):
    rows = connection.execute(
        APPLICATION_SELECT + " WHERE a.student_id = ? ORDER BY a.created_at DESC",
        (student_id,),
    ).fetchall()
    return [_application(row) for row in rows]


def list_professor_applications(connection, professor_id):
    rows = connection.execute(
        APPLICATION_SELECT + " WHERE o.professor_id = ? ORDER BY a.created_at DESC",
        (professor_id,),
    ).fetchall()
    return [_application(row) for row in rows]


def get_application_for_opportunity(connection, opportunity_id, student_id):
    row = connection.execute(
        APPLICATION_SELECT + " WHERE a.opportunity_id = ? AND a.student_id = ?",
        (opportunity_id, student_id),
    ).fetchone()
    return _application(row) if row else None


def apply_to_opportunity(connection, opportunity, student_id, cover_letter):
    if opportunity["status"] != "open":
        return "This opportunity is not open"
    if opportunity["professor_id"] == student_id:
        return "You cannot apply to your own opportunity"
    created = now()
    try:
        connection.execute(
            """
            INSERT INTO applications (
              id, opportunity_id, student_id, cover_letter, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'pending', ?, ?)
            """,
            (new_id(), opportunity["id"], student_id, cover_letter, created, created),
        )
        connection.commit()
    except sqlite3.IntegrityError:
        return "You have already applied to this opportunity"
    return None


def update_application_status(connection, application_id, professor_id, status):
    allowed = {"pending", "reviewed", "accepted", "rejected"}
    if status not in allowed:
        return "Invalid status"
    row = connection.execute(
        """
        SELECT a.id
        FROM applications a
        JOIN opportunities o ON o.id = a.opportunity_id
        WHERE a.id = ? AND o.professor_id = ?
        """,
        (application_id, professor_id),
    ).fetchone()
    if not row:
        return "Application not found"
    connection.execute(
        "UPDATE applications SET status = ?, updated_at = ? WHERE id = ?",
        (status, now(), application_id),
    )
    connection.commit()
    return None


def create_opportunity(connection, professor_id, fields):
    created = now()
    opportunity_id = new_id()
    connection.execute(
        """
        INSERT INTO opportunities (
          id, professor_id, title, description, requirements, skills_needed, research_areas,
          duration, compensation, positions_available, application_deadline, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
        """,
        (
            opportunity_id,
            professor_id,
            fields["title"],
            fields["description"],
            fields["requirements"],
            json.dumps(fields["skills"]),
            json.dumps(fields["research_areas"]),
            fields["duration"],
            fields["compensation"],
            fields["positions"],
            fields["deadline"],
            created,
            created,
        ),
    )
    connection.commit()
    return opportunity_id


def reset_password(connection, email, password):
    user = get_user_by_email(connection, email)
    if not user:
        return "No account uses that email"
    connection.execute(
        "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
        (hash_password(password), now(), user["id"]),
    )
    connection.commit()
    return None
