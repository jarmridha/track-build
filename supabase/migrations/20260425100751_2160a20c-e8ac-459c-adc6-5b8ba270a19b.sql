-- Helper: can current user manage details for a given project?
create or replace function public.can_manage_project(_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'supervisor')
    or exists (
      select 1 from public.projects
      where id = _project_id and assigned_user_id = auth.uid()
    )
$$;

-- =========================
-- project_notes
-- =========================
create table public.project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  title text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_notes enable row level security;

create policy "Notes viewable by authenticated"
  on public.project_notes for select to authenticated using (true);

create policy "Managers insert notes"
  on public.project_notes for insert to authenticated
  with check (user_id = auth.uid() and public.can_manage_project(project_id));

create policy "Managers update notes"
  on public.project_notes for update to authenticated
  using (public.can_manage_project(project_id))
  with check (public.can_manage_project(project_id));

create policy "Managers delete notes"
  on public.project_notes for delete to authenticated
  using (public.can_manage_project(project_id));

create trigger trg_project_notes_updated
  before update on public.project_notes
  for each row execute function public.set_updated_at();

create index idx_project_notes_project on public.project_notes(project_id);

-- =========================
-- project_documents (metadata for files in storage)
-- =========================
create table public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  kind text not null check (kind in ('image','document')),
  name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

alter table public.project_documents enable row level security;

create policy "Documents viewable by authenticated"
  on public.project_documents for select to authenticated using (true);

create policy "Managers insert documents"
  on public.project_documents for insert to authenticated
  with check (user_id = auth.uid() and public.can_manage_project(project_id));

create policy "Managers delete documents"
  on public.project_documents for delete to authenticated
  using (public.can_manage_project(project_id));

create index idx_project_documents_project on public.project_documents(project_id, kind);

-- =========================
-- project_personnel
-- =========================
create table public.project_personnel (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid,
  full_name text not null,
  role_title text,
  phone text,
  email text,
  notes text,
  added_by uuid not null,
  created_at timestamptz not null default now()
);

alter table public.project_personnel enable row level security;

create policy "Personnel viewable by authenticated"
  on public.project_personnel for select to authenticated using (true);

create policy "Managers insert personnel"
  on public.project_personnel for insert to authenticated
  with check (added_by = auth.uid() and public.can_manage_project(project_id));

create policy "Managers update personnel"
  on public.project_personnel for update to authenticated
  using (public.can_manage_project(project_id))
  with check (public.can_manage_project(project_id));

create policy "Managers delete personnel"
  on public.project_personnel for delete to authenticated
  using (public.can_manage_project(project_id));

create index idx_project_personnel_project on public.project_personnel(project_id);

-- =========================
-- Storage buckets
-- =========================
insert into storage.buckets (id, name, public) values
  ('project-images', 'project-images', true),
  ('project-documents', 'project-documents', false)
on conflict (id) do nothing;

-- Helper: extract project_id from path "<project_id>/<filename>"
create or replace function public.path_project_id(_path text)
returns uuid
language sql
immutable
as $$
  select nullif(split_part(_path, '/', 1), '')::uuid
$$;

-- project-images policies (public bucket: anyone can read)
create policy "Public read project images"
  on storage.objects for select
  using (bucket_id = 'project-images');

create policy "Managers upload project images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-images'
    and public.can_manage_project(public.path_project_id(name))
  );

create policy "Managers delete project images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-images'
    and public.can_manage_project(public.path_project_id(name))
  );

-- project-documents policies (private bucket)
create policy "Authenticated read project documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'project-documents');

create policy "Managers upload project documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-documents'
    and public.can_manage_project(public.path_project_id(name))
  );

create policy "Managers delete project documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-documents'
    and public.can_manage_project(public.path_project_id(name))
  );