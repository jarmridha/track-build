-- Automatically make the first registered user an admin.
-- Later users become engineer by default unless changed by an admin.

create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_role_count integer;
begin
  select count(*) into existing_role_count from public.user_roles;

  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case when existing_role_count = 0 then 'admin'::app_role else 'engineer'::app_role end
  )
  on conflict do nothing;

  insert into public.profiles (id, email, full_name, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'User'),
    'active'::user_status
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_role on auth.users;

create trigger on_auth_user_created_role
after insert on auth.users
for each row execute function public.handle_new_user_role();
