-- Allow authenticated users to select login_events (for admin UI/testing)

alter table public.login_events enable row level security;

create policy "allow-auth-select" on public.login_events
  for select using (auth.role() = 'authenticated');

-- If you want admins only, replace the 'using' expression with a check against a user_roles table or an edge function.
