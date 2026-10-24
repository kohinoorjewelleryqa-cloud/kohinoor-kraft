-- Kohinoor Kraft: lets the admin choose 3D ring styles for each design (Admin → Designs → a design → 3D ring preview).
-- Safe to run more than once.
alter table kraft_designs add column if not exists ring_3d text[];

-- Keep the 3D rings that are already live.
update kraft_designs set ring_3d = array['round','oval','emerald','eastwest','princess','halo','threestone','bezel','cluster'] where slug = 'solitaire-ring' and ring_3d is null;
update kraft_designs set ring_3d = array['band','flatband','twist','halfeternity','eternity'] where slug = 'wedding-bands' and ring_3d is null;
update kraft_designs set ring_3d = array['band','flatband','twist'] where slug = 'baby-ring' and ring_3d is null;
-- Every other design shows its photo until a style is ticked.
update kraft_designs set ring_3d = '{}' where ring_3d is null;
