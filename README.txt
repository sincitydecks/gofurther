RFDS EOI — Vercel + Supabase capture

FILES
- index.html = approved frontend with simplified EOI form
- api/eoi.js = serverless endpoint that writes each EOI to pin_to_win_eois

VERCEL ENVIRONMENT VARIABLE
Set only this required variable:

SUPABASE_SECRET_KEY = your real Supabase sb_secret_... key

Optional:
RFDS_EOI_CLIENT_ID = RFDS-CAREERS-CONFERENCE-2026

The Supabase project URL is built into api/eoi.js and does not need an environment variable.

IMPORTANT
Add the variable to Production (and Preview if testing), then create a NEW deployment.
Do not put the secret key into index.html or GitHub.

TEST
Submit three test EOIs and check Supabase > Table Editor > pin_to_win_eois.
You should see three separate rows.
