-- Run in Supabase SQL editor (Dashboard → SQL → New query)

create table if not exists public.daily_overrides (
  schedule_date date primary key,
  overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.daily_overrides enable row level security;

-- No public policies — only service role reads/writes from the admin API.
