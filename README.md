# ScholarSync

ScholarSync connects medical students, technology students, and students working across both with research labs. A professor posts a role with a country, a field, and whether it is remote, hybrid, or on-site. A student profile stores the same facts. The app ranks open roles by shared skills, research interests, field, and whether the student can actually join.

Running `npm run dev` only serves the app on your own computer. Anyone else reaches it after the Next.js app is hosted and the Supabase project is reachable on the internet.

## What a match uses

- **Field:** medical, technology, or both. A medical profile still sees digital-health roles marked as both.
- **Skills and interests:** overlap with the skills and research areas on the listing.
- **Place:** remote roles rank well for students who are open to remote work. On-site roles in another country rank well only when the lab accepts international students and the student can relocate. A lab can also say whether visa support is available.

Filters on Explore cover field, work arrangement, lab country, research area, and skill.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Put your Supabase URL and anon key in `.env.local`. In the Supabase SQL editor, run `scripts/001_create_schema.sql` for a new project. If the tables already exist, run `scripts/002_global_fields.sql` instead. That second script adds country, field, work arrangement, and international-student columns.

## Put it on the public internet

The database and login already live in Supabase, which is hosted. The missing piece is a public URL for this Next.js app. [Vercel](https://vercel.com) is the direct host for this project: it builds Next.js, serves it from a global CDN, and gives you an `https://` address.

1. Create a Supabase project at [supabase.com](https://supabase.com) if you do not have one.
2. In the Supabase SQL editor, run `scripts/001_create_schema.sql` on a new database, or `scripts/002_global_fields.sql` if you already ran the first script.
3. In Supabase, open Project Settings → API and copy the project URL and the `anon` public key.
4. Push this repository to GitHub.
5. Import the repository at [vercel.com/new](https://vercel.com/new).
6. Add these environment variables in the Vercel project before the first deploy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Deploy. Vercel prints a URL such as `https://scholarsync.vercel.app`. You can attach your own domain in Project Settings → Domains.
8. In Supabase, open Authentication → URL Configuration:
   - Set **Site URL** to the Vercel URL (or your custom domain).
   - Add `https://YOUR_DOMAIN/auth/callback` under **Redirect URLs**.
   - Leave `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` unset in production. Signup already falls back to the live site origin.

After that, a student in one country and a professor in another use the same site. Supabase stores the accounts and listings. Vercel serves the pages. Neither one depends on your laptop staying on.

Do not put the Supabase service-role key in `NEXT_PUBLIC_` variables. The anon key is the one this app expects.
