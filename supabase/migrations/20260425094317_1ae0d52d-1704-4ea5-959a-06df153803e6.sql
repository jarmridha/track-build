CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  requested_role app_role;
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'phone'
  );

  -- Honor requested role from signup metadata, but never allow self-assigning admin
  requested_role := case
    when new.raw_user_meta_data->>'requested_role' in ('engineer', 'supervisor')
      then (new.raw_user_meta_data->>'requested_role')::app_role
    else 'engineer'::app_role
  end;

  insert into public.user_roles (user_id, role) values (new.id, requested_role);
  return new;
end;
$function$;