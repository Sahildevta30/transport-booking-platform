#!/usr/bin/env python3
"""Convert an official India Post CSV export to reviewable, idempotent SQL.

Run locally: python3 scripts/location-data/import_india_post.py directory.csv > postal_import.sql
Review the source and output before manually executing SQL in Supabase.
"""
import csv
import re
import sys
from pathlib import Path

ALIASES = {
    "officename": ("officename", "office name", "post office", "postofficename"),
    "pincode": ("pincode", "pin code", "pin", "postal code"),
    "division": ("division", "postal division", "postaldivision"),
    "state": ("statename", "state name", "state"),
}
STATES = {"chhattisgarh": "CG", "chattisgarh": "CG", "odisha": "OD", "orissa": "OD"}


def sql(value):
    return "'" + value.replace("'", "''") + "'"


def main(path):
    with Path(path).open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        columns = {re.sub(r"\s+", " ", name.strip().lower()): name for name in (reader.fieldnames or [])}
        fields = {}
        for key, alternatives in ALIASES.items():
            fields[key] = next((columns[name] for name in alternatives if name in columns), None)
            if not fields[key]:
                raise ValueError(f"Missing {key} column; available: {reader.fieldnames}")
        rows = set()
        invalid = 0
        for record in reader:
            state = STATES.get((record[fields["state"]] or "").strip().lower())
            if not state:
                continue
            name = (record[fields["officename"]] or "").strip()
            division = (record[fields["division"]] or "").strip()
            pin = (record[fields["pincode"]] or "").strip()
            if not name or not division or not re.fullmatch(r"\d{6}", pin):
                invalid += 1
                continue
            rows.add((state, division, name, pin))
    if invalid:
        raise ValueError(f"{invalid} CG/OD records missing valid office, division or PIN; source needs review")
    if not rows:
        raise ValueError("No valid Chhattisgarh/Odisha records in file")
    print("-- Verify source date and state/postal-division spelling before running.")
    print("begin;")
    ordered = sorted(rows)
    for offset in range(0, len(ordered), 500):
        values = [f"({sql(state)},{sql(division)},{sql(name)},{sql(pin)},'INDIA_POST')"
                  for state, division, name, pin in ordered[offset:offset + 500]]
        print("insert into public.geo_post_offices (state_code,postal_division,office_name,pincode,source) values\n"
              + ",\n".join(values) + " on conflict do nothing;")
    print("commit;")
    print(f"-- Records: {len(rows)} (CG/OD only)", file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: import_india_post.py official-directory.csv > postal_import.sql")
    main(sys.argv[1])
