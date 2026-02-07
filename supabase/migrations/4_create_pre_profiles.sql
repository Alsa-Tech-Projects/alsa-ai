-- Migration: create pre_oauth_profiles and pre_email_profiles tables

create table if not exists public.pre_oauth_profiles (
    id uuid default gen_random_uuid () primary key,
    provider text not null,
    display_name text,
    bio text,
    found_from text,
    user_category text,
    avatar_url text,
    created_at timestamptz default now()
);

create index if not exists on public.pre_oauth_profiles (created_at);

alter table public.pre_oauth_profiles enable row level security;

-- Allow anonymous or authenticated clients to insert pre-oauth profiles (needed before OAuth redirect)
create policy "allow-insert-pre-oauth" on public.pre_oauth_profiles for
insert
    using (
        auth.role () = 'anonymous'
        or auth.role () = 'authenticated'
    )
with
    check (true);

create table if not exists public.pre_email_profiles (
    id uuid default gen_random_uuid () primary key,
    email text not null,
    display_name text,
    bio text,
    found_from text,
    user_category text,
    avatar_url text,
    created_at timestamptz default now()
);

create index if not exists on public.pre_email_profiles (email);

create index if not exists on public.pre_email_profiles (created_at);

alter table public.pre_email_profiles enable row level security;

create policy "allow-insert-pre-email" on public.pre_email_profiles for
insert
    using (
        auth.role () = 'anonymous'
        or auth.role () = 'authenticated'
    )
with
    check (true);