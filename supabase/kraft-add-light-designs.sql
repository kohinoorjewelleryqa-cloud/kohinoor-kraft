-- Kohinoor Kraft: adds 3 light sample designs (so the "Under QAR 500" budget has designs).
-- Safe to run more than once. Edit or delete them later in Admin → Designs.

insert into kraft_designs (slug, category, name_en, name_ar, description_en, description_ar, karats, colors, weight_min, weight_max, making_per_g, stones, engraving, engraving_max, sizes, is_featured, sort_order, art_variant) values
 ('gold-studs', 'earrings', 'Gold stud earrings', 'أقراط ذهبية صغيرة', 'Small, light studs for every day: round, heart or star.', 'أقراط صغيرة وخفيفة للاستخدام اليومي: دائرة أو قلب أو نجمة.', '{"21","18"}', '{"yellow","rose","white"}', 1, 2.5, 50, '[]'::jsonb, false, 0, '{}', false, 17, 1),
 ('baby-ring', 'rings', 'Baby gold ring', 'خاتم ذهب للمولود', 'A tiny first ring for a baby, plain or with an initial.', 'خاتم صغير للمولود، سادة أو بحرف من اسمه.', '{"21","18"}', '{"yellow","rose"}', 1, 2, 55, '[]'::jsonb, true, 1, '{"Baby","Child"}', false, 18, 0),
 ('initial-charm', 'pendants', 'Initial charm', 'دلاية بالحرف الأول', 'A single letter in English or Arabic, light and easy to wear.', 'حرف واحد بالعربية أو الإنجليزية، خفيف وسهل الارتداء.', '{"22","21","18"}', '{"yellow","rose","white"}', 1, 2, 60, '[]'::jsonb, true, 1, '{"16\"","18\"","20\"","22\""}', false, 19, 1)
on conflict (slug) do nothing;

select count(*) as designs from kraft_designs;
