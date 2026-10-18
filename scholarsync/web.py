import hmac
import os
import secrets
import sqlite3
from datetime import timedelta
from pathlib import Path

from flask import (
    Flask,
    abort,
    flash,
    g,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from scholarsync import db
from scholarsync.matching import annotate

ROOT = Path(__file__).resolve().parent.parent
RESEARCH_AREAS = [
    "Computer Science",
    "Biology",
    "Chemistry",
    "Physics",
    "Mathematics",
    "Engineering",
    "Medicine",
    "Psychology",
    "Economics",
    "Environmental Science",
]
SUGGESTED_SKILLS = [
    "Python",
    "R",
    "Machine Learning",
    "Data Analysis",
    "JavaScript",
    "Statistics",
    "Lab Techniques",
    "Scientific Writing",
    "MATLAB",
    "SQL",
]
SUGGESTED_INTERESTS = [
    "Artificial Intelligence",
    "Bioinformatics",
    "Climate Science",
    "Neuroscience",
    "Quantum Computing",
    "Robotics",
    "Genomics",
    "Economics",
    "Psychology",
    "Physics",
]
DURATIONS = ["1 semester", "2 semesters", "Summer", "1 year", "Ongoing", "Flexible", "Semester"]
COMPENSATIONS = ["Paid", "Unpaid", "Stipend", "Course Credit", "Course credit", "Negotiable"]


def _secret():
    configured = os.environ.get("SCHOLARSYNC_SECRET")
    if configured:
        return configured
    path = db.database_path().parent / "session.secret"
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text(secrets.token_hex(32), encoding="utf-8")
        path.chmod(0o600)
    return path.read_text(encoding="utf-8").strip()


def create_app():
    app = Flask(
        __name__,
        template_folder=str(ROOT / "templates"),
        static_folder=str(ROOT / "static"),
    )
    app.config.update(
        SECRET_KEY=_secret(),
        SESSION_COOKIE_NAME="scholarsync_session",
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        PERMANENT_SESSION_LIFETIME=timedelta(days=14),
    )

    @app.before_request
    def prepare_request():
        g.db = db.connect()
        db.init_db(g.db)
        if request.method == "POST":
            expected = session.get("_csrf", "")
            sent = request.form.get("csrf_token", "")
            if not expected or not sent or not hmac.compare_digest(expected, sent):
                abort(400)
        user_id = session.get("uid")
        g.user = db.get_profile(g.db, user_id) if user_id else None
        if user_id and g.user is None:
            session.clear()

    @app.teardown_request
    def close_db(_error):
        connection = g.pop("db", None)
        if connection is not None:
            connection.close()

    @app.context_processor
    def inject_globals():
        return {
            "csrf_token": csrf_token(),
            "current_user": getattr(g, "user", None),
            "research_areas": RESEARCH_AREAS,
            "suggested_skills": SUGGESTED_SKILLS,
            "suggested_interests": SUGGESTED_INTERESTS,
        }

    @app.template_filter("given_name")
    def given_name(full_name, fallback):
        parts = [part for part in (full_name or "").split() if part]
        honorific = {"dr", "dr.", "prof", "prof.", "professor"}
        return next((part for part in parts if part.lower() not in honorific), fallback)

    @app.template_filter("initials")
    def initials(full_name):
        parts = [part for part in (full_name or "").split() if part]
        letters = "".join(part[0] for part in parts[:2]).upper()
        return letters or "U"

    @app.template_filter("shortdate")
    def shortdate(value):
        if not value:
            return ""
        return str(value)[:10]

    @app.template_filter("percent")
    def percent(value):
        if value is None:
            return ""
        return f"{round(value * 100)}%"

    @app.errorhandler(400)
    def bad_request(_error):
        return render_template("error.html", message="That form expired. Go back and try again."), 400

    @app.errorhandler(404)
    def missing(_error):
        return render_template("error.html", message="That page is not on ScholarSync."), 404

    register_routes(app)
    return app


def csrf_token():
    token = session.get("_csrf")
    if not token:
        token = secrets.token_urlsafe(32)
        session["_csrf"] = token
    return token


def local_path(value):
    if not value or not value.startswith("/") or value.startswith("//") or "\\" in value:
        return None
    return value


def require_user():
    if not g.user:
        return redirect(url_for("login", next=request.path))
    return None


def require_ready():
    missing = require_user()
    if missing:
        return missing
    if not db.profile_complete(g.user):
        return redirect(url_for("profile_setup"))
    return None


def clean_list(values):
    seen = []
    for value in values:
        item = value.strip()
        if item and item not in seen:
            seen.append(item)
    return seen


def optional_number(value, kind):
    text = (value or "").strip()
    if not text:
        return None
    try:
        return kind(text)
    except ValueError:
        return None


def profile_fields():
    skills = clean_list(request.form.getlist("skills") + split_extra(request.form.get("custom_skills")))
    interests = clean_list(request.form.getlist("interests") + split_extra(request.form.get("custom_interests")))
    areas = clean_list(request.form.getlist("research_areas") + split_extra(request.form.get("custom_areas")))
    return {
        "full_name": request.form.get("full_name", "").strip(),
        "university": request.form.get("university", "").strip() or None,
        "department": request.form.get("department", "").strip() or None,
        "bio": request.form.get("bio", "").strip() or None,
        "major": request.form.get("major", "").strip() or None,
        "graduation_year": optional_number(request.form.get("graduation_year"), int),
        "gpa": optional_number(request.form.get("gpa"), float),
        "skills": skills,
        "interests": interests,
        "linkedin_url": request.form.get("linkedin_url", "").strip() or None,
        "github_url": request.form.get("github_url", "").strip() or None,
        "title": request.form.get("title", "").strip() or None,
        "lab_name": request.form.get("lab_name", "").strip() or None,
        "research_areas": areas,
        "website_url": request.form.get("website_url", "").strip() or None,
    }


def split_extra(value):
    if not value:
        return []
    return [part.strip() for part in value.split(",")]


def register_routes(app):
    @app.get("/")
    def home():
        if g.user:
            if db.profile_complete(g.user):
                return redirect(url_for("dashboard"))
            return redirect(url_for("profile_setup"))
        return render_template("landing.html")

    @app.route("/auth/login", methods=["GET", "POST"])
    def login():
        if g.user:
            return redirect(url_for("dashboard"))
        error = None
        if request.method == "POST":
            email = request.form.get("email", "")
            password = request.form.get("password", "")
            user = db.get_user_by_email(g.db, email)
            if not user or not db.verify_password(password, user["password_hash"]):
                error = "Invalid email or password"
            else:
                session.clear()
                session.permanent = True
                session["uid"] = user["id"]
                session["_csrf"] = secrets.token_urlsafe(32)
                return redirect(local_path(request.form.get("next")) or url_for("dashboard"))
        return render_template("auth/login.html", error=error, next_path=request.args.get("next", ""))

    @app.route("/auth/sign-up", methods=["GET", "POST"])
    def signup():
        if g.user:
            return redirect(url_for("dashboard"))
        error = None
        selected = request.args.get("role", "student")
        if request.method == "POST":
            full_name = request.form.get("full_name", "").strip()
            email = request.form.get("email", "").strip().lower()
            password = request.form.get("password", "")
            confirm = request.form.get("confirm_password", "")
            role = "professor" if request.form.get("role") == "professor" else "student"
            university = request.form.get("university", "").strip() or None
            selected = role
            if not full_name or not email:
                error = "Name and email are required"
            elif "@" not in email or "." not in email.split("@")[-1]:
                error = "Enter a valid email address"
            elif password != confirm:
                error = "Passwords do not match"
            elif len(password) < 6:
                error = "Password must be at least 6 characters"
            else:
                try:
                    user_id = db.create_user(g.db, email, password, full_name, role, university)
                except sqlite3.IntegrityError:
                    error = "An account with this email already exists"
                else:
                    session.clear()
                    session.permanent = True
                    session["uid"] = user_id
                    session["_csrf"] = secrets.token_urlsafe(32)
                    return redirect(url_for("profile_setup"))
        return render_template("auth/signup.html", error=error, selected_role=selected)

    @app.route("/auth/forgot-password", methods=["GET", "POST"])
    def forgot_password():
        error = None
        if request.method == "POST":
            email = request.form.get("email", "")
            password = request.form.get("password", "")
            confirm = request.form.get("confirm_password", "")
            if password != confirm:
                error = "Passwords do not match"
            elif len(password) < 6:
                error = "Password must be at least 6 characters"
            else:
                error = db.reset_password(g.db, email, password)
                if not error:
                    flash("Password updated. Sign in with the new password.", "success")
                    return redirect(url_for("login"))
        return render_template("auth/forgot.html", error=error)

    @app.post("/auth/logout")
    def logout():
        session.clear()
        return redirect(url_for("home"))

    @app.route("/profile/setup", methods=["GET", "POST"])
    def profile_setup():
        missing = require_user()
        if missing:
            return missing
        if db.profile_complete(g.user):
            return redirect(url_for("dashboard"))
        error = None
        if request.method == "POST":
            fields = profile_fields()
            if not fields["full_name"]:
                error = "Full name is required"
            elif g.user["role"] == "student" and not (fields["skills"] or fields["interests"]):
                error = "Add at least one skill or research interest"
            elif g.user["role"] == "professor" and not fields["research_areas"]:
                error = "Select at least one research area"
            else:
                db.save_profile(g.db, g.user, fields)
                return redirect(url_for("dashboard"))
        return render_template("profile/setup.html", error=error)

    @app.get("/profile")
    def profile_view():
        missing = require_ready()
        if missing:
            return missing
        return render_template("profile/view.html")

    @app.route("/profile/edit", methods=["GET", "POST"])
    def profile_edit():
        missing = require_ready()
        if missing:
            return missing
        error = None
        if request.method == "POST":
            fields = profile_fields()
            if not fields["full_name"]:
                error = "Full name is required"
            elif g.user["role"] == "student" and not (fields["skills"] or fields["interests"]):
                error = "Keep at least one skill or research interest"
            elif g.user["role"] == "professor" and not fields["research_areas"]:
                error = "Keep at least one research area"
            else:
                db.save_profile(g.db, g.user, fields)
                flash("Profile saved.", "success")
                return redirect(url_for("profile_view"))
        return render_template("profile/edit.html", error=error)

    @app.get("/dashboard")
    def dashboard():
        missing = require_ready()
        if missing:
            return missing
        if g.user["role"] == "student":
            opportunities = annotate(g.user, db.list_open_opportunities(g.db))
            ranked = sorted(opportunities, key=lambda item: item["match_score"], reverse=True)
            applications = db.list_student_applications(g.db, g.user["id"])
            return render_template(
                "dashboard/student.html",
                recommended=ranked[:4],
                top_match_count=sum(1 for item in ranked[:6] if item["match_score"] > 0.3),
                recent=sorted(opportunities, key=lambda item: item["created_at"], reverse=True)[:4],
                saved_ids=db.list_saved_ids(g.db, g.user["id"]),
                applications=applications[:5],
                pending_count=sum(1 for item in applications if item["status"] == "pending"),
                available_count=len(opportunities),
            )
        opportunities = db.list_professor_opportunities(g.db, g.user["id"])
        applications = db.list_professor_applications(g.db, g.user["id"])
        return render_template(
            "dashboard/professor.html",
            opportunities=opportunities,
            applications=applications,
            open_count=sum(1 for item in opportunities if item["status"] == "open"),
        )

    @app.get("/dashboard/explore")
    def explore():
        missing = require_ready()
        if missing:
            return missing
        if g.user["role"] != "student":
            return redirect(url_for("dashboard"))
        query = request.args.get("q", "").strip()
        area = request.args.get("area", "all")
        sort = request.args.get("sort", "match")
        selected_skills = request.args.getlist("skill")
        opportunities = annotate(g.user, db.list_open_opportunities(g.db))
        skill_options = sorted({skill for item in opportunities for skill in item["skills_needed"]})
        filtered = []
        for opportunity in opportunities:
            if query:
                blob = " ".join(
                    [
                        opportunity["title"],
                        opportunity["description"],
                        opportunity["professor"]["full_name"] or "",
                        opportunity["professor"]["university"] or "",
                        " ".join(opportunity["skills_needed"]),
                        " ".join(opportunity["research_areas"]),
                    ]
                ).lower()
                if query.lower() not in blob:
                    continue
            if area and area != "all" and area not in opportunity["research_areas"]:
                continue
            if selected_skills and not any(skill in opportunity["skills_needed"] for skill in selected_skills):
                continue
            filtered.append(opportunity)
        if sort == "recent":
            filtered.sort(key=lambda item: item["created_at"], reverse=True)
        elif sort == "deadline":
            filtered.sort(key=lambda item: item["application_deadline"] or "9999")
        else:
            filtered.sort(key=lambda item: item["match_score"], reverse=True)
        return render_template(
            "dashboard/explore.html",
            opportunities=filtered,
            saved_ids=db.list_saved_ids(g.db, g.user["id"]),
            query=query,
            area=area,
            sort=sort,
            selected_skills=selected_skills,
            skill_options=skill_options,
        )

    @app.get("/dashboard/saved")
    def saved():
        missing = require_ready()
        if missing:
            return missing
        if g.user["role"] != "student":
            return redirect(url_for("dashboard"))
        opportunities = annotate(g.user, db.list_saved_opportunities(g.db, g.user["id"]))
        return render_template(
            "dashboard/saved.html",
            opportunities=opportunities,
            saved_ids={item["id"] for item in opportunities},
        )

    @app.post("/dashboard/opportunities/<opportunity_id>/save")
    def toggle_save(opportunity_id):
        missing = require_ready()
        if missing:
            return missing
        if g.user["role"] != "student":
            abort(403)
        saved_now = db.toggle_saved(g.db, g.user["id"], opportunity_id)
        if saved_now is None:
            abort(404)
        flash("Saved to your list." if saved_now else "Removed from saved.", "success")
        return redirect(local_path(request.form.get("next")) or url_for("saved"))

    @app.get("/dashboard/applications")
    def applications():
        missing = require_ready()
        if missing:
            return missing
        if g.user["role"] == "student":
            return render_template(
                "dashboard/applications.html",
                applications=db.list_student_applications(g.db, g.user["id"]),
            )
        status = request.args.get("status", "all")
        opportunity_id = request.args.get("opportunity", "all")
        selected_id = request.args.get("id", "")
        rows = db.list_professor_applications(g.db, g.user["id"])
        visible = [
            row
            for row in rows
            if (status == "all" or row["status"] == status)
            and (opportunity_id == "all" or row["opportunity_id"] == opportunity_id)
        ]
        selected = next((row for row in visible if row["id"] == selected_id), None)
        return render_template(
            "dashboard/applications.html",
            applications=visible,
            all_applications=rows,
            opportunities=db.list_professor_opportunities(g.db, g.user["id"]),
            status=status,
            opportunity_filter=opportunity_id,
            selected=selected,
        )

    @app.post("/dashboard/applications/<application_id>/status")
    def update_application(application_id):
        missing = require_ready()
        if missing:
            return missing
        if g.user["role"] != "professor":
            abort(403)
        error = db.update_application_status(
            g.db,
            application_id,
            g.user["id"],
            request.form.get("status", ""),
        )
        if error:
            flash(error, "error")
        else:
            flash("Application updated.", "success")
        return redirect(local_path(request.form.get("next")) or url_for("applications"))

    @app.get("/dashboard/opportunities")
    def opportunities():
        missing = require_ready()
        if missing:
            return missing
        if g.user["role"] != "professor":
            return redirect(url_for("dashboard"))
        return render_template(
            "dashboard/opportunities.html",
            opportunities=db.list_professor_opportunities(g.db, g.user["id"]),
        )

    @app.route("/dashboard/opportunities/new", methods=["GET", "POST"])
    def new_opportunity():
        missing = require_ready()
        if missing:
            return missing
        if g.user["role"] != "professor":
            return redirect(url_for("dashboard"))
        error = None
        if request.method == "POST":
            title = request.form.get("title", "").strip()
            description = request.form.get("description", "").strip()
            positions = optional_number(request.form.get("positions"), int) or 1
            if not title:
                error = "Title is required"
            elif not description:
                error = "Description is required"
            elif positions < 1:
                error = "Positions must be at least 1"
            else:
                opportunity_id = db.create_opportunity(
                    g.db,
                    g.user["id"],
                    {
                        "title": title,
                        "description": description,
                        "requirements": request.form.get("requirements", "").strip() or None,
                        "skills": clean_list(
                            request.form.getlist("skills") + split_extra(request.form.get("custom_skills"))
                        ),
                        "research_areas": clean_list(request.form.getlist("research_areas")),
                        "duration": request.form.get("duration", "").strip() or None,
                        "compensation": request.form.get("compensation", "").strip() or None,
                        "positions": positions,
                        "deadline": request.form.get("deadline", "").strip() or None,
                    },
                )
                return redirect(url_for("opportunity_detail", opportunity_id=opportunity_id))
        return render_template(
            "dashboard/new_opportunity.html",
            error=error,
            durations=DURATIONS,
            compensations=COMPENSATIONS,
        )

    @app.get("/dashboard/opportunities/<opportunity_id>")
    def opportunity_detail(opportunity_id):
        missing = require_ready()
        if missing:
            return missing
        opportunity = db.get_opportunity(g.db, opportunity_id)
        if not opportunity:
            abort(404)
        annotate(g.user, [opportunity])
        application = None
        saved_now = False
        applicants = []
        if g.user["role"] == "student":
            application = db.get_application_for_opportunity(g.db, opportunity_id, g.user["id"])
            saved_now = opportunity_id in db.list_saved_ids(g.db, g.user["id"])
        elif opportunity["professor_id"] == g.user["id"]:
            applicants = [
                row
                for row in db.list_professor_applications(g.db, g.user["id"])
                if row["opportunity_id"] == opportunity_id
            ]
        return render_template(
            "dashboard/opportunity.html",
            opportunity=opportunity,
            application=application,
            saved=saved_now,
            applicants=applicants,
        )

    @app.post("/dashboard/opportunities/<opportunity_id>/apply")
    def apply(opportunity_id):
        missing = require_ready()
        if missing:
            return missing
        if g.user["role"] != "student":
            abort(403)
        opportunity = db.get_opportunity(g.db, opportunity_id)
        if not opportunity:
            abort(404)
        error = db.apply_to_opportunity(
            g.db,
            opportunity,
            g.user["id"],
            request.form.get("cover_letter", "").strip() or None,
        )
        if error:
            flash(error, "error")
        else:
            flash("Application submitted.", "success")
        return redirect(url_for("opportunity_detail", opportunity_id=opportunity_id))
