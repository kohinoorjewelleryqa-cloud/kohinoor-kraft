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

insert into kraft_categories (slug, name_en, name_ar, art, sort_order) values
 ('name-jewellery', 'Name jewellery', 'مجوهرات بالأسماء', 'pendants:2', 1),
 ('rings', 'Rings', 'خواتم', 'rings:1', 2),
 ('bangles', 'Bangles & bracelets', 'أساور وبناجر', 'bangles:2', 3),
 ('earrings', 'Earrings', 'أقراط', 'earrings:0', 4),
 ('pendants', 'Pendants', 'دلايات', 'pendants:0', 5),
 ('sets', 'Bridal sets', 'أطقم العرائس', 'sets:1', 6),
 ('men', 'For men', 'للرجال', 'chains:2', 7)
on conflict (slug) do nothing;

-- Sample designs (no photos yet: the site shows a drawing until you upload photos in the admin panel).
insert into kraft_designs (slug, category, name_en, name_ar, description_en, description_ar, karats, colors, weight_min, weight_max, making_per_g, stones, engraving, engraving_max, sizes, is_featured, sort_order, art_variant) values
 ('arabic-name-necklace', 'name-jewellery', 'Arabic name necklace', 'قلادة اسم بالخط العربي', 'Your name, or a loved one''s, cut in flowing Arabic calligraphy and finished with a fine chain.', 'اسمك أو اسم من تحب بخط عربي انسيابي، مع سلسلة رفيعة.', '{"22","21","18"}', '{"yellow","rose","white"}', 3, 6, 60, '[]'::jsonb, true, 14, '{"16\"","18\"","20\"","22\""}', true, 1, 2),
 ('script-name-necklace', 'name-jewellery', 'Script name necklace', 'قلادة اسم بخط إنجليزي', 'A classic script nameplate in English, polished to a mirror shine.', 'لوحة اسم كلاسيكية بخط إنجليزي مزخرف ولمعة كالمرآة.', '{"22","21","18"}', '{"yellow","rose","white"}', 3, 5, 60, '[]'::jsonb, true, 12, '{"16\"","18\"","20\"","22\""}', true, 2, 2),
 ('name-bracelet', 'name-jewellery', 'Name bracelet', 'سوار بالاسم', 'A slim bracelet with a name or date at the centre.', 'سوار رفيع يتوسطه اسم أو تاريخ.', '{"22","21","18"}', '{"yellow","rose","white"}', 5, 9, 55, '[]'::jsonb, true, 12, '{"16 cm","17 cm","18 cm","19 cm"}', true, 3, 3),
 ('baby-name-bracelet', 'name-jewellery', 'Baby name bracelet', 'سوار مولود بالاسم', 'A first piece of gold for a newborn, with the baby''s name.', 'أول قطعة ذهب للمولود، تحمل اسمه.', '{"21","18"}', '{"yellow","rose"}', 2, 4, 60, '[]'::jsonb, true, 10, '{"11 cm","12 cm","13 cm"}', false, 4, 0),
 ('signet-ring', 'rings', 'Initial signet ring', 'خاتم بالأحرف الأولى', 'A solid signet ring engraved with your initials.', 'خاتم متين محفور بالأحرف الأولى من اسمك.', '{"22","21","18"}', '{"yellow","rose","white"}', 6, 12, 45, '[]'::jsonb, true, 3, '{"6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22"}', true, 5, 1),
 ('wedding-bands', 'rings', 'Wedding bands, engraved inside', 'دبل زواج محفورة من الداخل', 'A matching pair, engraved inside with your names or wedding date. Price is for the pair.', 'زوج متطابق، يُحفر من الداخل بالأسماء أو تاريخ الزواج. السعر للزوج.', '{"22","21","18"}', '{"yellow","rose","white"}', 8, 14, 40, '[]'::jsonb, true, 20, '{"6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22"}', true, 6, 0),
 ('solitaire-ring', 'rings', 'Solitaire ring', 'خاتم سوليتير', 'A single stone held high in a fine band. Choose the stone you like.', 'حجر واحد مرفوع على حلقة رفيعة. اختر الحجر الذي تحبه.', '{"18","21"}', '{"yellow","rose","white"}', 3, 5, 70, '[{"id":"cz","name_en":"Cubic zirconia","name_ar":"زركون","price":60},{"id":"ruby","name_en":"Ruby","name_ar":"ياقوت أحمر","price":280},{"id":"emerald","name_en":"Emerald","name_ar":"زمرد","price":280},{"id":"diamond","name_en":"Natural diamond (about 0.10 ct)","name_ar":"ألماس طبيعي (حوالي ٠٫١٠ قيراط)","price":1200}]'::jsonb, false, 0, '{"6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22"}', false, 7, 2),
 ('classic-kada', 'bangles', 'Classic kada bangle', 'بنجرة كلاسيكية', 'A solid bangle with a hand-finished edge, made to your wrist size.', 'بنجرة متينة بحافة مشغولة يدويًا، تُصنع على مقاس معصمك.', '{"22","21"}', '{"yellow","rose"}', 15, 30, 35, '[]'::jsonb, true, 20, '{"2.2","2.4","2.6","2.8","2.10"}', true, 8, 0),
 ('engraved-bangle-set', 'bangles', 'Engraved bangle set', 'طقم بناجر محفورة', 'A set of slim bangles with traditional engraving. Wear them together or apart.', 'طقم بناجر رفيعة بنقوش تقليدية، تُلبس معًا أو منفردة.', '{"22","21"}', '{"yellow"}', 25, 45, 35, '[]'::jsonb, false, 0, '{"2.2","2.4","2.6","2.8","2.10"}', false, 9, 2),
 ('gold-hoops', 'earrings', 'Gold hoops', 'أقراط حلقية', 'Light everyday hoops in the size and thickness you choose.', 'أقراط حلقية خفيفة للاستخدام اليومي بالمقاس والسماكة التي تختارها.', '{"22","21","18"}', '{"yellow","rose","white"}', 4, 8, 45, '[]'::jsonb, false, 0, '{"15 mm","20 mm","30 mm","40 mm"}', false, 10, 2),
 ('drop-earrings', 'earrings', 'Drop earrings', 'أقراط متدلية', 'Elegant drops for occasions, plain or set with stones.', 'أقراط متدلية أنيقة للمناسبات، سادة أو مرصعة بالأحجار.', '{"22","21","18"}', '{"yellow","rose","white"}', 6, 12, 50, '[{"id":"cz","name_en":"Cubic zirconia","name_ar":"زركون","price":60},{"id":"ruby","name_en":"Ruby","name_ar":"ياقوت أحمر","price":280},{"id":"emerald","name_en":"Emerald","name_ar":"زمرد","price":280},{"id":"diamond","name_en":"Natural diamond (about 0.10 ct)","name_ar":"ألماس طبيعي (حوالي ٠٫١٠ قيراط)","price":1200}]'::jsonb, false, 0, '{}', true, 11, 0),
 ('calligraphy-pendant', 'pendants', 'Calligraphy pendant', 'دلاية بالخط العربي', 'A word or phrase that matters to you, in Arabic calligraphy: Mashallah, a name or a verse.', 'كلمة أو عبارة تهمك بالخط العربي: ما شاء الله، اسم أو آية.', '{"22","21","18"}', '{"yellow","rose","white"}', 3, 7, 60, '[]'::jsonb, true, 16, '{"16\"","18\"","20\"","22\""}', true, 12, 3),
 ('heart-pendant', 'pendants', 'Heart pendant with initials', 'دلاية قلب بالأحرف الأولى', 'A heart engraved with two initials, a lasting gift.', 'قلب محفور بحرفين، هدية تدوم.', '{"22","21","18"}', '{"yellow","rose","white"}', 2, 4, 55, '[{"id":"cz","name_en":"Cubic zirconia","name_ar":"زركون","price":60},{"id":"ruby","name_en":"Ruby","name_ar":"ياقوت أحمر","price":280},{"id":"emerald","name_en":"Emerald","name_ar":"زمرد","price":280},{"id":"diamond","name_en":"Natural diamond (about 0.10 ct)","name_ar":"ألماس طبيعي (حوالي ٠٫١٠ قيراط)","price":1200}]'::jsonb, true, 5, '{"16\"","18\"","20\"","22\""}', false, 13, 0),
 ('bridal-set', 'sets', 'Bridal necklace set', 'طقم عروس', 'Necklace and earrings designed with you for your wedding day. Bangles and ring can be added.', 'قلادة وأقراط نصممها معك ليوم زفافك، ويمكن إضافة بناجر وخاتم.', '{"22","21"}', '{"yellow"}', 60, 120, 30, '[{"id":"cz","name_en":"Cubic zirconia","name_ar":"زركون","price":60},{"id":"ruby","name_en":"Ruby","name_ar":"ياقوت أحمر","price":280},{"id":"emerald","name_en":"Emerald","name_ar":"زمرد","price":280},{"id":"diamond","name_en":"Natural diamond (about 0.10 ct)","name_ar":"ألماس طبيعي (حوالي ٠٫١٠ قيراط)","price":1200}]'::jsonb, false, 0, '{}', true, 14, 1),
 ('mens-chain', 'men', 'Men''s chain', 'سلسلة رجالية', 'A strong chain in the link style and length you choose.', 'سلسلة متينة بنوع الحلقات والطول الذي تختاره.', '{"22","21","18"}', '{"yellow","white"}', 20, 40, 25, '[]'::jsonb, false, 0, '{"20\"","22\"","24\""}', false, 15, 2),
 ('mens-ring', 'men', 'Men''s ring', 'خاتم رجالي', 'A bold ring for him, plain, engraved, or set with a stone.', 'خاتم رجالي بارز، سادة أو محفور أو مرصع بحجر.', '{"21","18"}', '{"yellow","white"}', 8, 14, 45, '[{"id":"cz","name_en":"Cubic zirconia","name_ar":"زركون","price":60},{"id":"ruby","name_en":"Ruby","name_ar":"ياقوت أحمر","price":280},{"id":"emerald","name_en":"Emerald","name_ar":"زمرد","price":280},{"id":"diamond","name_en":"Natural diamond (about 0.10 ct)","name_ar":"ألماس طبيعي (حوالي ٠٫١٠ قيراط)","price":1200}]'::jsonb, true, 10, '{"6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22"}', false, 16, 3),
 ('gold-studs', 'earrings', 'Gold stud earrings', 'أقراط ذهبية صغيرة', 'Small, light studs for every day: round, heart or star.', 'أقراط صغيرة وخفيفة للاستخدام اليومي: دائرة أو قلب أو نجمة.', '{"21","18"}', '{"yellow","rose","white"}', 1, 2.5, 50, '[]'::jsonb, false, 0, '{}', false, 17, 1),
 ('baby-ring', 'rings', 'Baby gold ring', 'خاتم ذهب للمولود', 'A tiny first ring for a baby, plain or with an initial.', 'خاتم صغير للمولود، سادة أو بحرف من اسمه.', '{"21","18"}', '{"yellow","rose"}', 1, 2, 55, '[]'::jsonb, true, 1, '{"Baby","Child"}', false, 18, 0),
 ('initial-charm', 'pendants', 'Initial charm', 'دلاية بالحرف الأول', 'A single letter in English or Arabic, light and easy to wear.', 'حرف واحد بالعربية أو الإنجليزية، خفيف وسهل الارتداء.', '{"22","21","18"}', '{"yellow","rose","white"}', 1, 2, 60, '[]'::jsonb, true, 1, '{"16\"","18\"","20\"","22\""}', false, 19, 1)
on conflict (slug) do nothing;

-- Kohinoor Kraft: stone types (Admin → Stones). Safe to run more than once; it never removes stones you added.
create table if not exists kraft_stones (
  id text primary key,                         -- e.g. ruby, pink-sapphire (design stone options use this id)
  name_en text not null,
  name_ar text not null default '',
  color text not null default '#FFFFFF',       -- the stone's colour, used for icons and the 3D ring
  kind text not null default 'gem' check (kind in ('brilliant','gem','pearl')),
  about_en text not null default '',
  about_ar text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table kraft_stones enable row level security;
drop policy if exists "kraft public read stones" on kraft_stones;
create policy "kraft public read stones" on kraft_stones for select using (true);
drop policy if exists "kraft admin write stones" on kraft_stones;
create policy "kraft admin write stones" on kraft_stones for all using (is_admin()) with check (is_admin());

insert into kraft_stones (id, name_en, name_ar, color, kind, about_en, about_ar, sort_order) values
 ('diamond', 'Diamond', 'ألماس', '#FFFFFF', 'brilliant', 'The hardest natural stone, for a lifetime of sparkle. April''s birthstone.', 'أصلب الأحجار الطبيعية، لبريق يدوم مدى الحياة. حجر شهر أبريل.', 1),
 ('ruby', 'Ruby', 'ياقوت أحمر', '#E0103F', 'gem', 'Deep red, the stone of love and passion. July''s birthstone.', 'أحمر عميق، حجر الحب والشغف. حجر شهر يوليو.', 2),
 ('emerald', 'Emerald', 'زمرد', '#12B05E', 'gem', 'Rich green, linked with renewal and growth. May''s birthstone.', 'أخضر غني، رمز التجدد والنماء. حجر شهر مايو.', 3),
 ('sapphire', 'Sapphire', 'ياقوت أزرق', '#2350D8', 'gem', 'Royal blue, the stone of wisdom. September''s birthstone.', 'أزرق ملكي، حجر الحكمة. حجر شهر سبتمبر.', 4),
 ('pearl', 'Pearl', 'لؤلؤ', '#F4EEE3', 'pearl', 'Soft and timeless, a classic for brides. June''s birthstone.', 'ناعم وخالد، اختيار كلاسيكي للعرائس. حجر شهر يونيو.', 5),
 ('amethyst', 'Amethyst', 'جمشت', '#9A4BE0', 'gem', 'A calming purple. February''s birthstone.', 'بنفسجي هادئ. حجر شهر فبراير.', 6),
 ('cz', 'Cubic zirconia', 'زركون', '#FBFBFF', 'brilliant', 'Diamond-like sparkle at a gentle price.', 'بريق يشبه الألماس بسعر مناسب.', 7)
on conflict (id) do nothing;

commit;

-- Check: should show 7 categories and 19 designs.
select (select count(*) from kraft_categories) as categories, (select count(*) from kraft_designs) as designs;
