#!/usr/bin/env python3
"""Extract India Post state-circle PDF tables to reviewed, idempotent SQL.

Usage: python3 scripts/location-data/import_india_post_pdf.py CG.pdf OD.pdf OUTPUT_DIR
Does not infer administrative districts or boarding points from postal divisions.
"""
from __future__ import annotations
import hashlib
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROW = re.compile(
    r"^\s*(?P<name>.*?)\s+(?P<pin>\d{6})\s+"
    r"(?P<delivery>Non-Delivery|Delivery)\s+(?P<kind>PO|BO|HO)\s+"
    r"(?P<circle>Chattisgarh Circle|Odisha [Cc]ircle)\s+(?P<rest>.*?)\s*$"
)
STATES = {"CG": "Chattisgarh Circle", "OD": "Odisha Circle"}


def quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def extract(path: Path, state: str):
    data = path.read_bytes()
    if not data.startswith(b"%PDF-"):
        raise ValueError(f"{path}: not a PDF")
    text = subprocess.check_output(["pdftotext", "-layout", str(path), "-"], text=True)
    candidates = [line for line in text.splitlines() if re.search(r"\b\d{6}\b", line)]
    rows = set()
    duplicates = 0
    for line in candidates:
        match = ROW.match(line)
        if not match:
            raise ValueError(f"Unparsed PIN row in {path.name}: {line!r}")
        group = match.groupdict()
        if group["circle"].lower() != STATES[state].lower():
            raise ValueError(f"Wrong circle in {path.name}: {line!r}")
        parts = [p.strip() for p in re.split(r"\s{2,}", group["rest"]) if p.strip()]
        division = parts[-1] if parts else ""
        if not division.endswith(("Division", "Divn")) or not group["name"].strip():
            raise ValueError(f"Invalid division or name in {path.name}: {line!r}")
        row = (state, division, group["name"].strip(), group["pin"])
        if row in rows:
            duplicates += 1
        rows.add(row)
    if len(rows) < 1000:
        raise ValueError(f"Unexpectedly short state-circle PDF: {path.name}")
    return sorted(rows), len(candidates), duplicates, hashlib.sha256(data).hexdigest()


def write_sql(path: Path, rows: list[tuple[str, str, str, str]], source: str, sha: str):
    state = rows[0][0]
    with path.open("w", encoding="utf-8") as out:
        out.write(f"-- Source: India Post {state} Pincode List PDF, https://www.indiapost.gov.in/rti/pincodelist\n")
        out.write(f"-- Input filename: {source}; SHA256: {sha}\n")
        out.write(f"-- Unique offices: {len(rows)}; unique PINs: {len(set(row[3] for row in rows))}.\n")
        out.write("-- Run 202609250001_post_office_pdf_divisions.sql first. Postal divisions are not districts or pickup points.\n")
        out.write("begin;\n")
        for start in range(0, len(rows), 500):
            out.write("insert into public.geo_post_offices (state_code,postal_division,office_name,pincode,source) values\n")
            out.write(",\n".join("(" + ",".join(map(quote, row)) + ",'INDIA_POST')" for row in rows[start:start + 500]))
            out.write("\non conflict (state_code,postal_division,office_name,pincode) do nothing;\n")
        out.write("commit;\n")


def main():
    if len(sys.argv) != 4:
        raise SystemExit("Usage: import_india_post_pdf.py CG.pdf OD.pdf OUTPUT_DIR")
    dest = Path(sys.argv[3]); dest.mkdir(parents=True, exist_ok=True)
    for state, filename in [("CG", sys.argv[1]), ("OD", sys.argv[2])]:
        path = Path(filename)
        rows, raw, duplicates, sha = extract(path, state)
        target = dest / f"{state.lower()}_india_post_offices.sql"
        write_sql(target, rows, path.name, sha)
        print(f"{state}: source_rows={raw}, duplicate_rows={duplicates}, unique_offices={len(rows)}, unique_PINs={len(set(r[3] for r in rows))}, sql={target}")

if __name__ == "__main__":
    main()
