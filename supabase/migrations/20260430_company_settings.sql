create table if not exists company_settings (
  id int primary key,
  company_name text,
  tagline text,
  website text,
  phone text,
  email text,
  address text,
  logo_url text,
  primary_color text,
  updated_at timestamp default now()
);

insert into company_settings (id, company_name)
values (1, 'Track Build')
on conflict (id) do nothing;
