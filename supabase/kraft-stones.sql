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

-- Check: should list your stones.
select id, name_en, color, kind from kraft_stones order by sort_order;
