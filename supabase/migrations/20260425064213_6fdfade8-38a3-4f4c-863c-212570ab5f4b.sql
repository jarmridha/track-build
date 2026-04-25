
-- Enums
create type public.app_role as enum ('admin', 'engineer', 'supervisor');
create type public.project_status as enum ('not_started', 'running', 'completed', 'delayed', 'on_hold');
create type public.user_status as enum ('active', 'inactive');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  status user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- Security definer role check
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.get_my_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid() order by
    case role when 'admin' then 1 when 'supervisor' then 2 else 3 end
  limit 1
$$;

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client text,
  location text,
  start_date date,
  end_date date,
  progress integer not null default 0 check (progress between 0 and 100),
  status project_status not null default 'not_started',
  remarks text,
  assigned_user_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;

-- Daily updates
create table public.daily_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  work_completed text,
  manpower_count integer default 0,
  materials_used text,
  issues text,
  next_day_plan text,
  progress_percent integer check (progress_percent between 0 and 100),
  remarks text,
  created_at timestamptz not null default now()
);
alter table public.daily_updates enable row level security;

-- Activity logs
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  action_type text not null,
  description text not null,
  created_at timestamptz not null default now()
);
alter table public.activity_logs enable row level security;

-- Trigger: auto-create profile + engineer role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'phone'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'engineer');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();
create trigger trg_projects_updated before update on public.projects
for each row execute function public.set_updated_at();

-- Auto-mark project delayed
create or replace function public.auto_mark_delayed()
returns trigger language plpgsql as $$
begin
  if new.end_date is not null and new.end_date < current_date and new.status not in ('completed','delayed') then
    new.status := 'delayed';
  end if;
  if new.progress = 100 and new.status <> 'completed' then
    new.status := 'completed';
  end if;
  return new;
end; $$;

create trigger trg_projects_auto_status before insert or update on public.projects
for each row execute function public.auto_mark_delayed();

-- RLS Policies
-- profiles
create policy "Profiles viewable by authenticated" on public.profiles for select to authenticated using (true);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Admins manage profiles" on public.profiles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- user_roles
create policy "Roles viewable by authenticated" on public.user_roles for select to authenticated using (true);
create policy "Admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- projects
create policy "Projects viewable by authenticated" on public.projects for select to authenticated using (true);
create policy "Admins manage projects" on public.projects for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Assigned users update progress" on public.projects for update to authenticated using (assigned_user_id = auth.uid()) with check (assigned_user_id = auth.uid());

-- daily_updates
create policy "Daily updates viewable" on public.daily_updates for select to authenticated using (true);
create policy "Users insert own updates" on public.daily_updates for insert to authenticated with check (user_id = auth.uid());
create policy "Users edit own updates" on public.daily_updates for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Owners or admins delete updates" on public.daily_updates for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- activity_logs
create policy "Logs viewable" on public.activity_logs for select to authenticated using (true);
create policy "Authenticated insert logs" on public.activity_logs for insert to authenticated with check (auth.uid() = user_id);

-- indexes
create index on public.daily_updates (project_id, date desc);
create index on public.activity_logs (created_at desc);
create index on public.projects (status);
