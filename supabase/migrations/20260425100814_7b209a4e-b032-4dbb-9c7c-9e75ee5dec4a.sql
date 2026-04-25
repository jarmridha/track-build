create or replace function public.path_project_id(_path text)
returns uuid
language sql
immutable
set search_path = public
as $$
  select nullif(split_part(_path, '/', 1), '')::uuid
$$;