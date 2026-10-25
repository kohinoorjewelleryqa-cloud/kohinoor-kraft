-- Kohinoor Kraft Jewellery: database setup.
-- Runs in the SAME Supabase project as the silver store. It only adds new tables starting with "kraft_"
-- and two new photo buckets; the silver store's tables are not changed. Admin logins are shared.
-- Run once: Supabase → SQL Editor → New query → paste this whole file → Run. Safe to run again.

begin;

-- Shared admin list (already exists if the silver store is set up in this project).
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;
alter table admins enable row level security;
drop policy if exists "read own admin row" on admins;
create policy "read own admin row" on admins for select using (user_id = auth.uid());

-- ---------------------------------------------------------------- tables
create table if not exists kraft_settings (
  id int primary key default 1 check (id = 1),
  phone text not null default '+974 5068 3626',
  whatsapp text not null default '97450683626',
  email text not null default 'contact@kohinoorjewelleryqa.shop',
  address_en text not null default 'Gold Center, Old Gold Souq (beside Al Fardan), Old Al Ghanim, Doha, Qatar',
  address_ar text not null default 'جولد سنتر، سوق الذهب القديم (بجانب الفردان)، الغانم القديم، الدوحة، قطر',
  hours_en text not null default 'Sat–Thu 10 am–10 pm · Fri 4 pm–10 pm',
  hours_ar text not null default 'السبت–الخميس ١٠ ص–١٠ م · الجمعة ٤ م–١٠ م',
  rates jsonb not null default '{"24":480,"22":440,"21":420,"18":360}',
  rates_updated_at timestamptz,
  advance_pct int not null default 30 check (advance_pct between 0 and 100),
  production_min_days int not null default 14,
  production_max_days int not null default 28
);

create table if not exists kraft_categories (
  slug text primary key,
  name_en text not null,
  name_ar text not null,
  art text not null default 'pendants:0',
  sort_order int not null default 0
);

create table if not exists kraft_designs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null references kraft_categories(slug) on update cascade,
  name_en text not null,
  name_ar text not null,
  description_en text,
  description_ar text,
  images text[] not null default '{}',
  karats text[] not null default '{22,21,18}',
  colors text[] not null default '{yellow,rose,white}',
  weight_min numeric(8,2) not null default 2,
  weight_max numeric(8,2) not null default 5,
  making_per_g numeric(8,2) not null default 50,   -- QAR per gram
  stones jsonb not null default '[]',               -- [{id,name_en,name_ar,price}]
  engraving boolean not null default false,
  engraving_max int not null default 12,
  sizes text[] not null default '{}',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  art_variant int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kraft_designs_cat_idx on kraft_designs(category, sort_order);

-- Customer requests and orders (from request to delivery).
create table if not exists kraft_enquiries (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,                         -- e.g. KK-261022-48213, shown to the customer
  lang text not null default 'en',
  design_id uuid references kraft_designs(id) on delete set null,
  design_name text,                                 -- copy of the design name at request time
  customer_name text not null,
  phone text not null,
  email text,
  karat text,
  color text,
  size text,
  weight_est numeric(8,2),
  stone text,
  engraving_text text,
  engraving_font text,
  notes text,
  reference_images text[] not null default '{}',    -- paths in the private kraft-private bucket
  estimate_lo numeric(12,2),
  estimate_hi numeric(12,2),
  rate_at_request numeric(10,2),
  status text not null default 'new' check (status in ('new','quoted','advance_paid','design_approval','in_production','finishing','ready','delivered','cancelled')),
  quote jsonb,                                      -- karat, weight, rate, making, stones, discount, total, advance, ready_by, note
  quoted_at timestamptz,
  approval_images text[] not null default '{}',     -- drawings for the customer to approve (kraft-private)
  approved_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kraft_enquiries_created_idx on kraft_enquiries(created_at desc);
create index if not exists kraft_enquiries_status_idx on kraft_enquiries(status);

-- Timeline shown to the customer on the tracking page.
create table if not exists kraft_events (
  id bigint generated always as identity primary key,
  enquiry_id uuid not null references kraft_enquiries(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists kraft_events_enquiry_idx on kraft_events(enquiry_id, created_at);

create table if not exists kraft_portfolio (
  id uuid primary key default gen_random_uuid(),
  title_en text not null default '',
  title_ar text not null default '',
  image text not null,
  category text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create or replace function kraft_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists kraft_designs_touch on kraft_designs;
create trigger kraft_designs_touch before update on kraft_designs for each row execute function kraft_touch();
drop trigger if exists kraft_enquiries_touch on kraft_enquiries;
create trigger kraft_enquiries_touch before update on kraft_enquiries for each row execute function kraft_touch();

-- ---------------------------------------------------------------- security
alter table kraft_settings enable row level security;
alter table kraft_categories enable row level security;
alter table kraft_designs enable row level security;
alter table kraft_enquiries enable row level security;
alter table kraft_events enable row level security;
alter table kraft_portfolio enable row level security;

drop policy if exists "kraft public read settings" on kraft_settings;
create policy "kraft public read settings" on kraft_settings for select using (true);
drop policy if exists "kraft admin update settings" on kraft_settings;
create policy "kraft admin update settings" on kraft_settings for update using (is_admin()) with check (is_admin());

drop policy if exists "kraft public read categories" on kraft_categories;
create policy "kraft public read categories" on kraft_categories for select using (true);
drop policy if exists "kraft admin write categories" on kraft_categories;
create policy "kraft admin write categories" on kraft_categories for all using (is_admin()) with check (is_admin());

drop policy if exists "kraft public read designs" on kraft_designs;
create policy "kraft public read designs" on kraft_designs for select using (is_active or is_admin());
drop policy if exists "kraft admin write designs" on kraft_designs;
create policy "kraft admin write designs" on kraft_designs for all using (is_admin()) with check (is_admin());

drop policy if exists "kraft public read portfolio" on kraft_portfolio;
create policy "kraft public read portfolio" on kraft_portfolio for select using (true);
drop policy if exists "kraft admin write portfolio" on kraft_portfolio;
create policy "kraft admin write portfolio" on kraft_portfolio for all using (is_admin()) with check (is_admin());

-- Requests are created and looked up by the website server; only admins can read or change them directly.
drop policy if exists "kraft admin manage enquiries" on kraft_enquiries;
create policy "kraft admin manage enquiries" on kraft_enquiries for all using (is_admin()) with check (is_admin());
drop policy if exists "kraft admin manage events" on kraft_events;
create policy "kraft admin manage events" on kraft_events for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------- photo storage
-- kraft-public: design and portfolio photos (anyone can view).
-- kraft-private: customers' reference photos and design drawings (only admins, or via short-lived links).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kraft-public', 'kraft-public', true, 10485760, '{image/jpeg,image/png,image/webp,image/avif}')
on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kraft-private', 'kraft-private', false, 10485760, '{image/jpeg,image/png,image/webp,image/heic,image/heif}')
on conflict (id) do nothing;

drop policy if exists "kraft admin write public photos" on storage.objects;
create policy "kraft admin write public photos" on storage.objects for all to authenticated
  using (bucket_id = 'kraft-public' and is_admin()) with check (bucket_id = 'kraft-public' and is_admin());
drop policy if exists "kraft admin manage private photos" on storage.objects;
create policy "kraft admin manage private photos" on storage.objects for all to authenticated
  using (bucket_id = 'kraft-private' and is_admin()) with check (bucket_id = 'kraft-private' and is_admin());

-- live updates in the admin panel when a new request arrives
do $$ begin
  alter publication supabase_realtime add table kraft_enquiries;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- ---------------------------------------------------------------- starting data
insert into kraft_settings (id) values (1) on conflict (id) do nothing;
