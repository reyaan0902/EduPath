-- Run this once in Supabase: SQL Editor > New query > paste > Run
create table public.edupath_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Lock the table. With no policies, browsers can't read it directly;
-- only our backend (using the secret key) can.
alter table public.edupath_data enable row level security;
