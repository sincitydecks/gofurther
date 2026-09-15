RFDS Conference EOI - Supabase capture

Files:
- index.html = approved map/form with simplified EOI fields
- api/eoi.js = Vercel serverless endpoint that inserts each submission into Supabase table pin_to_win_eois

Vercel Environment Variables:
SUPABASE_URL=https://pzpymyhudenvdfvqkebg.supabase.co
SUPABASE_SECRET_KEY=<your real Supabase sb_secret_... key>
Optional:
RFDS_EOI_CLIENT_ID=RFDS-CAREERS-CONFERENCE-2026

Deployment layout:
/
  index.html
  /api/eoi.js

The browser never receives the Supabase secret key.
Every successful form submission creates a new row in pin_to_win_eois.
Expected table columns:
ID text
Client_ID text
Submitted_at timestamptz
full_name text
email text
phone text
role text
state_id text
state_name text
source_url text
user_agent text
