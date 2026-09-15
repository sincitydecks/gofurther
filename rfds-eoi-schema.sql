-- RFDS Careers EOI capture table
-- Run this in Supabase Dashboard > SQL Editor.

create table if not exists public.rfds_eois (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  role text not null,
  why text,
  state_id text not null check (state_id in ('WA', 'SA_NT', 'QLD', 'NSW', 'VIC', 'TAS')),
  state_name text not null,
  source_url text,
  user_agent text
);

-- Keep the table private to the backend.
alter table public.rfds_eois enable row level security;

-- Do not allow browser/public roles to read or write this table.
revoke all on table public.rfds_eois from anon, authenticated;

-- The Vercel serverless function uses the Supabase secret key.
grant usage on schema public to service_role;
grant insert on table public.rfds_eois to service_role;
