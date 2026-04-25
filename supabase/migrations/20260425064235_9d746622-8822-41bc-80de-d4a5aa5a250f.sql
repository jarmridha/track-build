
create or replace function public.set_updated_at()
returns trigger language plpgsql
security definer set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.auto_mark_delayed()
returns trigger language plpgsql
security definer set search_path = public
as $$
begin
  if new.end_date is not null and new.end_date < current_date and new.status not in ('completed','delayed') then
    new.status := 'delayed';
  end if;
  if new.progress = 100 and new.status <> 'completed' then
    new.status := 'completed';
  end if;
  return new;
end; $$;
