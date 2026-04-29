-- Multi-company / SaaS foundation

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid,
  plan text default 'free',
  status text default 'active',
  created_at timestamp default now()
);

create table if not exists company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid not null,
  role app_role not null default 'engineer',
  status user_status not null default 'active',
  created_at timestamp default now(),
  unique(company_id, user_id)
);

create table if not exists user_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  email text not null,
  role app_role not null default 'engineer',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending',
  invited_by uuid,
  expires_at timestamp default (now() + interval '7 days'),
  created_at timestamp default now()
);

alter table projects add column if not exists company_id uuid references companies(id);
alter table daily_updates add column if not exists company_id uuid references companies(id);
alter table activity_logs add column if not exists company_id uuid references companies(id);
alter table project_documents add column if not exists company_id uuid references companies(id);
alter table site_purchases add column if not exists company_id uuid references companies(id);
alter table company_settings add column if not exists company_id uuid references companies(id);

create or replace function public.create_company_for_first_user(_user_id uuid, _email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _company_id uuid;
begin
  select id into _company_id from companies where owner_id = _user_id limit 1;
  if _company_id is null then
    insert into companies (name, owner_id)
    values (coalesce(split_part(_email, '@', 1), 'My Company'), _user_id)
    returning id into _company_id;

    insert into company_users (company_id, user_id, role, status)
    values (_company_id, _user_id, 'admin'::app_role, 'active'::user_status)
    on conflict do nothing;
  end if;
  return _company_id;
end;
$$;
