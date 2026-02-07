-- Migration: add gender column to profiles and pre_*_profiles

alter table if exists public.profiles
add column if not exists gender text;

alter table if exists public.pre_oauth_profiles
add column if not exists gender text;

alter table if exists public.pre_email_profiles
add column if not exists gender text;

create index if not exists on public.pre_oauth_profiles (gender);

create index if not exists on public.pre_email_profiles (gender);