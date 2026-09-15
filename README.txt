RFDS Careers EOI - conference build

Files:
- index.html : approved map/form frontend; only submission transport changed to POST /api/eoi
- api/eoi.js  : Vercel serverless endpoint that stores each EOI in Supabase
- rfds-eoi-schema.sql : creates the Supabase table and locks it to backend use

Vercel environment variables required:
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...

Do not put SUPABASE_SECRET_KEY in index.html, GitHub source, or the browser.
