# CG / Odisha location catalog

`supabase/migrations/202609240005_cg_odisha_geography_catalog.sql` seeds the official 33 CG and 30 Odisha administrative districts. This is geography for discovery, not 63 passenger boarding stops.

PIN codes and post offices belong in `geo_post_offices`, never directly in `locations`: several offices share a PIN and a post office is not necessarily a safe pickup point. Obtain the current official India Post PIN directory for both states, check publication date and administrative naming, and import through reviewed SQL batches. The India Post source is https://www.indiapost.gov.in/rti/pincodelist ; the OGD catalog is https://data.gov.in/catalog/all-india-pincode-directory-through-webservice . Neither page guarantees that all local landmarks or operating pickup spots are covered.

Add pickup/drop-off spots to `locations` only after a partner verifies the name, road access, and service availability. Avoid creating routes, trip times, prices, or booking inventory from the district or postal catalog. After manually running the migration, verify `select state_code,count(*) from public.geo_districts group by state_code;` (CG 33, OD 30), and confirm `geo_post_offices` is empty until the official source has been reviewed.
