# ScholarSync

ScholarSync matches students with research opportunities. The app is Python, HTML, CSS, and a small amount of JavaScript. Accounts, profiles, applications, and listings live in a SQLite file at `.data/scholarsync.db` on the computer that is running the app. It does not call an external database, auth provider, or analytics service.

## Run it on your computer

```bat
git clone https://github.com/bajrose19/ScholarSync.git
cd ScholarSync
python -m pip install -r requirements.txt
python -m scholarsync
```

On macOS or Linux, use `python3` instead of `python`. If Windows says `python` is not recognized, use `py -3` in both commands.

Leave that window open and visit http://localhost:3000. That address only works on the computer where the command is running. Closing the window stops the site.

The first launch creates a demo professor account:

- Email: `maya.chen@university.edu`
- Password: `demo1234`

Change that password before you share the site. The demo login is in this public README.

## Share a website link

`localhost:3000` is not a public website. A link other people can open needs the app to stay running somewhere the internet can reach.

For a temporary link from your own PC, start ScholarSync, then in a second window run:

```bat
winget install --id Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:3000
```

Cloudflare prints an address such as `https://something.trycloudflare.com`. That link works only while both windows stay open. The next tunnel gets a new address.

For a lasting name, host the `main` branch (for example on [Render](https://render.com)):

- Build command: `pip install -r requirements.txt`
- Start command: `python -m scholarsync`

The host gives you a stable address such as `https://scholarsync.onrender.com`. A custom name such as `scholarsync.com` is a domain you buy and point at that host. On a free host, the SQLite file can be wiped when the service restarts.

## Tests

```bat
python -m unittest tests.test_flow
```
