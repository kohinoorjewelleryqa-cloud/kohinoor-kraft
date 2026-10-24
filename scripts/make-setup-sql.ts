// Builds supabase/kraft-setup.sql = kraft-schema.sql + starting categories and designs from lib/demo.ts.
// Run: npx -y tsx@4.19.2 scripts/make-setup-sql.ts
import fs from "node:fs";
import { DEMO_CATEGORIES, DEMO_DESIGNS } from "../lib/demo";

const q = (s: unknown) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const arr = (a: string[]) => `'{${a.map((x) => `"${x.replace(/"/g, '\\"')}"`).join(",")}}'`;

let out = fs.readFileSync("supabase/kraft-schema.sql", "utf8");
out += "\ninsert into kraft_categories (slug, name_en, name_ar, art, sort_order) values\n";
out += DEMO_CATEGORIES.map((c) => ` (${q(c.slug)}, ${q(c.name_en)}, ${q(c.name_ar)}, ${q(c.art)}, ${c.sort_order})`).join(",\n");
out += "\non conflict (slug) do nothing;\n\n-- Sample designs (no photos yet: the site shows a drawing until you upload photos in the admin panel).\n";
out += "insert into kraft_designs (slug, category, name_en, name_ar, description_en, description_ar, karats, colors, weight_min, weight_max, making_per_g, stones, engraving, engraving_max, sizes, is_featured, sort_order, art_variant) values\n";
out += DEMO_DESIGNS.map((d) => ` (${q(d.slug)}, ${q(d.category)}, ${q(d.name_en)}, ${q(d.name_ar)}, ${q(d.description_en)}, ${q(d.description_ar)}, ${arr(d.karats)}, ${arr(d.colors)}, ${d.weight_min}, ${d.weight_max}, ${d.making_per_g}, ${q(JSON.stringify(d.stones))}::jsonb, ${d.engraving}, ${d.engraving_max}, ${arr(d.sizes)}, ${d.is_featured}, ${d.sort_order}, ${d.art_variant})`).join(",\n");
out += "\non conflict (slug) do nothing;\n\n" + fs.readFileSync("supabase/kraft-stones.sql", "utf8").split("\n-- Check:")[0] + "\ncommit;\n\n-- Check: should show 7 categories and 19 designs.\nselect (select count(*) from kraft_categories) as categories, (select count(*) from kraft_designs) as designs;\n";
fs.writeFileSync("supabase/kraft-setup.sql", out);
console.log("wrote supabase/kraft-setup.sql", out.length, "chars");
