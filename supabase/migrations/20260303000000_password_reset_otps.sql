create table if not exists public.password_reset_otps (
  email text primary key,
  otp text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Only the service role can read/write this table
alter table public.password_reset_otps enable row level security;

-- No public access
create policy "No public access" on public.password_reset_otps
  for all using (false);
