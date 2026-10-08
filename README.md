# ScholarSync

ScholarSync matches students with research opportunities. Accounts, profiles, applications, and listings live in a local SQLite file at `.data/scholarsync.db`. The app does not call an external database, auth provider, or analytics service.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. The first launch creates a demo professor account:

- Email: `maya.chen@university.edu`
- Password: `demo1234`
