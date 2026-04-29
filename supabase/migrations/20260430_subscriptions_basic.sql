create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plan text default 'free',
  status text default 'active',
  created_at timestamp default now()
);
