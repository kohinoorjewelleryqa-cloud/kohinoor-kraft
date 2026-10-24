// Builds supabase/kraft-stones.sql: the stone types table (Admin → Stones) with the starting list from lib/stones.ts.
// Run: npx -y tsx@4.19.2 scripts/make-stones-sql.ts
import fs from "node:fs";
import { DEFAULT_STONES } from "../lib/stones";

const q = (s: unknown) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);
let out = `-- Kohinoor Kraft: stone types (Admin → Stones). Safe to run more than once; it never removes stones you added.
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
`;
out += DEFAULT_STONES.map((s) => ` (${q(s.id)}, ${q(s.name_en)}, ${q(s.name_ar)}, ${q(s.color)}, ${q(s.kind)}, ${q(s.about_en)}, ${q(s.about_ar)}, ${s.sort_order})`).join(",\n");
out += "\non conflict (id) do nothing;\n\n-- Check: should list your stones.\nselect id, name_en, color, kind from kraft_stones order by sort_order;\n";
fs.writeFileSync("supabase/kraft-stones.sql", out);
console.log("wrote supabase/kraft-stones.sql");
