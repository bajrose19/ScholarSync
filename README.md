# ScholarSync

ScholarSync matches students with research opportunities. The app is Python, HTML, CSS, and a small amount of JavaScript. Accounts, profiles, applications, and listings live in a local SQLite file at `.data/scholarsync.db`. It does not call an external database, auth provider, or analytics service.

```bash
python3 -m pip install -r requirements.txt
python3 -m scholarsync
```

Open http://localhost:3000. The first launch creates a demo professor account:

- Email: `maya.chen@university.edu`
- Password: `demo1234`

Run the local flow test with:

```bash
python3 -m unittest tests.test_flow
```
