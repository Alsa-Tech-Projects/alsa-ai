-- Migration: create login_events table and policies

create table if not exists public.login_events (
    id uuid default gen_random_uuid () primary key,
    user_id uuid references auth.users (id) on delete cascade,
    event_type text not null default 'login',
    username text,
    name text,
    gender text,
    profile_url text,
    bio text,
    ip inet,
    user_agent text,
    created_at timestamptz default now()
);

create index if not exists on public.login_events (user_id);

create index if not exists on public.login_events (created_at);

alter table public.login_events enable row level security;

create policy "allow-auth-insert" on public.login_events for
insert
    using (
        auth.role () = 'authenticated'
    )
with
    check (auth.uid () = user_id);

-- Admins or service role can select/insert using service key (handled server-side)