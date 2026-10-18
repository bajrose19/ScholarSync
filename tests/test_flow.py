import os
import tempfile
import unittest
from pathlib import Path


class ScholarSyncFlowTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        os.environ["SCHOLARSYNC_DB"] = str(Path(self.tmp.name) / "scholarsync.db")
        os.environ["SCHOLARSYNC_SECRET"] = "test-secret"
        from scholarsync.web import create_app

        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self):
        self.tmp.cleanup()

    def csrf(self, path):
        response = self.client.get(path)
        self.assertEqual(response.status_code, 200)
        text = response.get_data(as_text=True)
        marker = 'name="csrf_token" value="'
        start = text.find(marker)
        self.assertGreater(start, -1, path)
        start += len(marker)
        return text[start : text.find('"', start)]

    def post(self, path, data, source=None):
        payload = {"csrf_token": self.csrf(source or path)}
        payload.update(data)
        return self.client.post(path, data=payload, follow_redirects=False)

    def test_student_and_professor_flow(self):
        home = self.client.get("/")
        self.assertEqual(home.status_code, 200)
        self.assertIn(b"match your potential", home.data)

        blocked = self.client.get("/dashboard")
        self.assertEqual(blocked.status_code, 302)
        self.assertIn("/auth/login", blocked.headers["Location"])

        bad_login = self.post("/auth/login", {"email": "maya.chen@university.edu", "password": "nope"})
        self.assertEqual(bad_login.status_code, 200)
        self.assertIn(b"Invalid email or password", bad_login.data)

        created = self.post(
            "/auth/sign-up",
            {
                "full_name": "Ada Student",
                "email": "ada.student@university.edu",
                "university": "State University",
                "role": "student",
                "password": "research1",
                "confirm_password": "research1",
            },
        )
        self.assertEqual(created.status_code, 302)
        self.assertIn("/profile/setup", created.headers["Location"])

        early = self.client.get("/dashboard")
        self.assertEqual(early.status_code, 302)
        self.assertIn("/profile/setup", early.headers["Location"])

        saved_profile = self.post(
            "/profile/setup",
            {
                "full_name": "Ada Student",
                "university": "State University",
                "department": "Computer Science",
                "bio": "I like applied machine learning.",
                "skills": "Python",
                "interests": "Artificial Intelligence",
                "major": "Computer Science",
            },
        )
        self.assertEqual(saved_profile.status_code, 302)
        self.assertTrue(saved_profile.headers["Location"].endswith("/dashboard"))

        dashboard = self.client.get("/dashboard")
        self.assertEqual(dashboard.status_code, 200)
        page = dashboard.get_data(as_text=True)
        self.assertIn("Machine Learning Research Assistant", page)
        self.assertIn("Climate Data Analysis Intern", page)
        self.assertLess(page.find("Machine Learning Research Assistant"), page.find("Climate Data Analysis Intern"))
        self.assertIn("40%", page)

        explore = self.client.get("/dashboard/explore?q=climate")
        self.assertIn(b"Climate Data Analysis Intern", explore.data)
        self.assertNotIn(b"Machine Learning Research Assistant", explore.data)

        detail = self.client.get("/dashboard/opportunities/" + self.opportunity_id("Machine Learning Research Assistant"))
        self.assertEqual(detail.status_code, 200)
        opportunity_id = self.opportunity_id("Machine Learning Research Assistant")
        saved = self.post(
            f"/dashboard/opportunities/{opportunity_id}/save",
            {"next": "/dashboard/saved"},
            source=f"/dashboard/opportunities/{opportunity_id}",
        )
        self.assertEqual(saved.status_code, 302)
        saved_page = self.client.get("/dashboard/saved")
        self.assertIn(b"Machine Learning Research Assistant", saved_page.data)

        applied = self.post(
            f"/dashboard/opportunities/{opportunity_id}/apply",
            {"cover_letter": "I have used Python for data analysis and want to work on matching models."},
            source=f"/dashboard/opportunities/{opportunity_id}",
        )
        self.assertEqual(applied.status_code, 302)
        applications = self.client.get("/dashboard/applications")
        self.assertIn(b"pending", applications.data)
        self.assertIn(b"matching models", applications.data)

        logged_out = self.post("/auth/logout", {}, source="/dashboard")
        self.assertEqual(logged_out.status_code, 302)

        professor = self.post(
            "/auth/login",
            {"email": "maya.chen@university.edu", "password": "demo1234"},
        )
        self.assertEqual(professor.status_code, 302)
        mine = self.client.get("/dashboard/opportunities")
        mine_text = mine.get_data(as_text=True)
        self.assertIn("Machine Learning Research Assistant", mine_text)
        self.assertIn("Climate Data Analysis Intern", mine_text)

        review = self.client.get("/dashboard/applications")
        review_text = review.get_data(as_text=True)
        self.assertIn("Ada Student", review_text)
        application_id = self.application_id(review_text)
        accepted = self.post(
            f"/dashboard/applications/{application_id}/status",
            {"status": "accepted", "next": "/dashboard/applications"},
            source="/dashboard/applications",
        )
        self.assertEqual(accepted.status_code, 302)
        self.assertIn(b"accepted", self.client.get("/dashboard/applications").data)

        posted = self.post(
            "/dashboard/opportunities/new",
            {
                "title": "Graph Algorithms Mentor",
                "description": "Study graph traversal with undergraduates.",
                "requirements": "A discrete math course.",
                "skills": "Python",
                "research_areas": "Computer Science",
                "duration": "1 semester",
                "compensation": "Stipend",
                "positions": "1",
            },
        )
        self.assertEqual(posted.status_code, 302)
        self.assertIn(b"Graph Algorithms Mentor", self.client.get("/dashboard/opportunities").data)

        self.post("/auth/logout", {}, source="/dashboard")
        reset = self.post(
            "/auth/forgot-password",
            {
                "email": "ada.student@university.edu",
                "password": "research2",
                "confirm_password": "research2",
            },
        )
        self.assertEqual(reset.status_code, 302)
        again = self.post(
            "/auth/login",
            {"email": "ada.student@university.edu", "password": "research2"},
        )
        self.assertEqual(again.status_code, 302)
        student_apps = self.client.get("/dashboard/applications")
        self.assertIn(b"accepted", student_apps.data)

    def opportunity_id(self, title):
        page = self.client.get("/dashboard/explore").get_data(as_text=True)
        needle = f">{title}</a>"
        start = page.find(needle)
        self.assertGreater(start, -1, title)
        href = page.rfind('href="', 0, start)
        link = page[href + 6 : page.find('"', href + 6)]
        return link.rstrip("/").split("/")[-1]

    def application_id(self, page):
        marker = "/dashboard/applications/"
        start = page.find(marker)
        self.assertGreater(start, -1)
        start += len(marker)
        return page[start : page.find("/status", start)]


if __name__ == "__main__":
    unittest.main()
