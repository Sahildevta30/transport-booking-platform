-- Sources: https://www.rd.odisha.gov.in/en/about-us/districts
-- https://igod.gov.in/sg/CG/E042/organizations (33 districts)
-- Administrative districts are search geography, not verified boarding points.
create table if not exists public.geo_districts (
  state_code text not null check (state_code in ('CG', 'OD')),
  name text not null,
  primary key (state_code, name)
);
alter table public.geo_districts enable row level security;
grant select on public.geo_districts to anon, authenticated;
drop policy if exists "public can read districts" on public.geo_districts;
create policy "public can read districts" on public.geo_districts for select to anon, authenticated using (true);

insert into public.geo_districts (state_code, name) values
('CG','Balod'),('CG','Balodabazar-Bhatapara'),('CG','Balrampur-Ramanujganj'),
('CG','Bastar'),('CG','Bemetara'),('CG','Bijapur'),('CG','Bilaspur'),
('CG','Dakshin Bastar Dantewada'),('CG','Dhamtari'),('CG','Durg'),
('CG','Gariyaband'),('CG','Gaurela-Pendra-Marwahi'),('CG','Janjgir-Champa'),
('CG','Jashpur'),('CG','Kabeerdham'),('CG','Kanker'),
('CG','Khairagarh-Chhuikhadan-Gandai'),('CG','Kondagaon'),('CG','Korba'),
('CG','Korea'),('CG','Mahasamund'),('CG','Manendragarh-Chirmiri-Bharatpur'),
('CG','Mohla-Manpur-Ambagarh Chouki'),('CG','Mungeli'),('CG','Narayanpur'),
('CG','Raigarh'),('CG','Raipur'),('CG','Rajnandgaon'),('CG','Sakti'),
('CG','Sarangarh-Bilaigarh'),('CG','Sukma'),('CG','Surajpur'),('CG','Surguja'),
('OD','Angul'),('OD','Balangir'),('OD','Balasore'),('OD','Bargarh'),
('OD','Bhadrak'),('OD','Boudh'),('OD','Cuttack'),('OD','Deogarh'),
('OD','Dhenkanal'),('OD','Gajapati'),('OD','Ganjam'),('OD','Jagatsinghpur'),
('OD','Jajpur'),('OD','Jharsuguda'),('OD','Kalahandi'),('OD','Kandhamal'),
('OD','Kendrapara'),('OD','Keonjhar'),('OD','Khordha'),('OD','Koraput'),
('OD','Malkangiri'),('OD','Mayurbhanj'),('OD','Nabarangpur'),
('OD','Nayagarh'),('OD','Nuapada'),('OD','Puri'),('OD','Rayagada'),
('OD','Sambalpur'),('OD','Subarnapur'),('OD','Sundargarh')
on conflict do nothing;

-- PIN codes can be shared by multiple post offices. These are postal areas,
-- not pickup points; do not insert them into public.locations automatically.
create table if not exists public.geo_post_offices (
  state_code text not null check (state_code in ('CG', 'OD')),
  district text not null,
  office_name text not null,
  pincode text not null check (pincode ~ '^[0-9]{6}$'),
  source text not null check (source = 'INDIA_POST'),
  primary key (state_code, district, office_name, pincode)
);
create index if not exists geo_post_offices_pin_idx on public.geo_post_offices (pincode);
create index if not exists geo_post_offices_district_idx on public.geo_post_offices (state_code, district);
alter table public.geo_post_offices enable row level security;
grant select on public.geo_post_offices to anon, authenticated;
drop policy if exists "public can read post offices" on public.geo_post_offices;
create policy "public can read post offices" on public.geo_post_offices for select to anon, authenticated using (true);
