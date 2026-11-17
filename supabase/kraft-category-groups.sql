-- Kohinoor Kraft: main categories with subcategories
--   Women · Men · Kids · Gifting · Bridal sets, each with its own subcategories.
-- Run once in Supabase → SQL Editor. Safe to run again (nothing is duplicated).
-- Existing designs are kept and moved into the new structure.

begin;

-- 1. Categories can now belong to a main category.
alter table kraft_categories add column if not exists parent text references kraft_categories(slug) on update cascade on delete restrict;

-- 2. The old "For men" category becomes Men → Necklaces (its designs move with it).
update kraft_portfolio set category = 'men-necklaces' where category = 'men'
  and exists (select 1 from kraft_categories where slug = 'men' and name_en <> 'Men')
  and not exists (select 1 from kraft_categories where slug = 'men-necklaces');
update kraft_categories set slug = 'men-necklaces', name_en = 'Necklaces', name_ar = 'قلائد'
  where slug = 'men' and name_en <> 'Men'
  and not exists (select 1 from kraft_categories where slug = 'men-necklaces');

-- 3. Main categories (Bridal sets uses the existing "sets" category).
insert into kraft_categories (slug, name_en, name_ar, art, sort_order) values
  ('women',   'Women',   'للنساء',   'necklaces:0', 1),
  ('men',     'Men',     'للرجال',   'chains:2',    2),
  ('kids',    'Kids',    'للأطفال',  'bracelets:0', 3),
  ('gifting', 'Gifting', 'هدايا',    'pendants:3',  4),
  ('sets',    'Bridal sets', 'أطقم العرائس', 'sets:1', 5)
on conflict (slug) do nothing;
update kraft_categories set parent = null, sort_order = 5, name_en = 'Bridal sets', name_ar = 'أطقم العرائس' where slug = 'sets';

-- 4. Subcategories.
insert into kraft_categories (slug, name_en, name_ar, art, sort_order, parent) values
  ('name-jewellery', 'Custom necklaces',    'قلائد مخصصة',  'pendants:2',  1, 'women'),
  ('earrings',       'Earrings',            'أقراط',         'earrings:0',  2, 'women'),
  ('rings',          'Rings',               'خواتم',         'rings:1',     3, 'women'),
  ('bangles',        'Bracelets & bangles', 'أساور وبناجر',  'bangles:2',   4, 'women'),
  ('women-anklets',  'Anklets',             'خلاخيل',        'anklets:0',   5, 'women'),
  ('men-necklaces',  'Necklaces',           'قلائد',         'chains:2',    1, 'men'),
  ('men-rings',      'Rings',               'خواتم',         'rings:3',     2, 'men'),
  ('men-bracelets',  'Bracelets',           'أساور',         'bracelets:1', 3, 'men'),
  ('men-cuffs',      'Hand cuffs',          'أساور كف',      'bangles:0',   4, 'men'),
  ('kids-necklaces', 'Necklaces',           'قلائد',         'pendants:0',  1, 'kids'),
  ('kids-earrings',  'Earrings',            'أقراط',         'earrings:1',  2, 'kids'),
  ('kids-rings',     'Rings',               'خواتم',         'rings:2',     3, 'kids'),
  ('kids-bracelets', 'Bracelets & bangles', 'أساور وبناجر',  'bracelets:0', 4, 'kids'),
  ('kids-brooches',  'Brooches',            'بروشات',        'pendants:1',  5, 'kids'),
  ('kids-anklets',   'Anklets',             'خلاخيل',        'anklets:1',   6, 'kids')
on conflict (slug) do nothing;

-- Existing categories move under Women (only if not already placed).
update kraft_categories set parent = 'women', name_en = 'Custom necklaces', name_ar = 'قلائد مخصصة', sort_order = 1 where slug = 'name-jewellery' and parent is null;
update kraft_categories set parent = 'women', sort_order = 2 where slug = 'earrings' and parent is null;
update kraft_categories set parent = 'women', sort_order = 3 where slug = 'rings' and parent is null;
update kraft_categories set parent = 'women', name_en = 'Bracelets & bangles', name_ar = 'أساور وبناجر', sort_order = 4 where slug = 'bangles' and parent is null;
update kraft_categories set parent = 'women', sort_order = 6 where slug = 'pendants' and parent is null;
-- An "Anklets" category added earlier from the admin panel goes under Women too.
update kraft_categories set parent = 'women' where slug = 'anklets' and parent is null;
update kraft_categories set parent = 'men', sort_order = 1 where slug = 'men-necklaces' and parent is null;

-- 5. Move the sample designs to where they now belong (only if they haven't been moved by hand).
update kraft_designs set category = 'bangles'        where slug = 'name-bracelet'      and category = 'name-jewellery';
update kraft_designs set category = 'kids-bracelets' where slug = 'baby-name-bracelet' and category = 'name-jewellery';
update kraft_designs set category = 'kids-rings'     where slug = 'baby-ring'          and category = 'rings';
update kraft_designs set category = 'men-rings'      where slug = 'mens-ring'          and category = 'men-necklaces';

commit;

-- Check: main categories with their subcategories.
select coalesce(p.name_en, c.name_en) as main, case when c.parent is null then '' else c.name_en end as sub,
  (select count(*) from kraft_designs d where d.category = c.slug) as designs
from kraft_categories c left join kraft_categories p on p.slug = c.parent
order by coalesce(p.sort_order, c.sort_order), c.parent nulls first, c.sort_order;
