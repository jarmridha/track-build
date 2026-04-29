-- Enable tables
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text,
  progress int,
  status text,
  created_at timestamp default now()
);

create table if not exists daily_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  work_completed text,
  created_at timestamp default now()
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  description text,
  created_at timestamp default now()
);
