# Lesana trial deployment — Vercel + Neon Free

1. Create a Neon Free database through https://vercel.com/marketplace/neon and attach **only** to Vercel project `lesana-independent-trial`. Verify the selected plan is **Free / $0** before accepting. Disable optional paid add-ons.
2. In Neon SQL Editor execute `database/schema.sql` against the new isolated database.
3. Verify Vercel project has `DATABASE_URL` supplied by the Neon integration (never share its value).
4. Deploy `reconstruction/` as the project root, with Node 24.x and Next.js build `npm run build`.
5. Test `/api/state` and personal progress saving across refresh and a second browser session; inspect runtime logs.
6. Do not point `APP_ORIGIN` to an unrelated domain; omit it for a single default deployment hostname.

No database was created and no deployment was executed as part of this prepared archive.
