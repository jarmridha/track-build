-- Refined auto status logic for projects
create or replace function public.auto_mark_delayed()
returns trigger language plpgsql
security definer set search_path = public as $$
begin
  -- Respect manual on_hold: never override
  if new.status = 'on_hold' then
    return new;
  end if;

  -- Completed at 100% (unless on_hold handled above)
  if new.progress >= 100 then
    new.status := 'completed';
    if new.progress > 100 then new.progress := 100; end if;
    return new;
  end if;

  -- Progress dropped below 100 on a completed project: revert
  if new.status = 'completed' and new.progress < 100 then
    if new.end_date is not null and new.end_date < current_date then
      new.status := 'delayed';
    elsif new.start_date is not null and new.start_date > current_date then
      new.status := 'not_started';
    else
      new.status := 'running';
    end if;
    return new;
  end if;

  -- Future start date and no progress: not_started
  if new.start_date is not null and new.start_date > current_date and new.progress = 0 then
    new.status := 'not_started';
    return new;
  end if;

  -- Past end_date and not completed: delayed
  if new.end_date is not null and new.end_date < current_date then
    new.status := 'delayed';
    return new;
  end if;

  -- Delayed but end_date now in the future (extended): revert to running/not_started
  if new.status = 'delayed' and (new.end_date is null or new.end_date >= current_date) then
    if new.start_date is not null and new.start_date > current_date and new.progress = 0 then
      new.status := 'not_started';
    else
      new.status := 'running';
    end if;
    return new;
  end if;

  -- not_started but progress > 0 and within dates: running
  if new.status = 'not_started' and new.progress > 0 then
    new.status := 'running';
    return new;
  end if;

  -- Clamp progress
  if new.progress < 0 then new.progress := 0; end if;

  return new;
end; $$;

-- Daily sweep function: re-evaluate all projects (touches updated_at to fire trigger)
create or replace function public.sweep_project_statuses()
returns void language plpgsql
security definer set search_path = public as $$
begin
  -- Touch rows whose computed status would change due to date passing
  update public.projects
     set updated_at = now()
   where status not in ('completed','on_hold')
     and (
       (end_date is not null and end_date < current_date and status <> 'delayed')
       or (status = 'delayed' and (end_date is null or end_date >= current_date))
       or (start_date is not null and start_date > current_date and progress = 0 and status <> 'not_started')
     );
end; $$;

-- Schedule daily sweep at 00:05 UTC
create extension if not exists pg_cron;
do $$
begin
  perform cron.unschedule('daily_project_status_sweep');
exception when others then null;
end $$;
select cron.schedule(
  'daily_project_status_sweep',
  '5 0 * * *',
  $$select public.sweep_project_statuses();$$
);