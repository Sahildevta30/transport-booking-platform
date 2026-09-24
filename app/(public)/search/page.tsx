import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

import { RouteSearchForm } from "@/components/marketplace/route-search-form";
import { ResultCard, type TripResult } from "@/components/marketplace/result-card";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Find a Ride" };

type Props = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    date?: string;
    passengers?: string;
    type?: string;
    mode?: string;
    sort?: string;
  }>;
};

type Location = { id: string; name: string; city: string | null; state: string | null; pincode: string | null };

function locationLabel(location: Location) {
  return [location.name, location.city, location.state, location.pincode].filter(Boolean).join(", ");
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function matchLocation(locations: Location[], query: string) {
  const q = normalize(query);
  if (!q) return { location: undefined, matches: [] as Location[] };
  const full = locations.filter((l) => normalize(locationLabel(l)) === q);
  if (full.length === 1) return { location: full[0], matches: full };
  const exact = locations.filter(
    (l) =>
      normalize(l.name) === q ||
      normalize(l.city ?? "") === q ||
      normalize(`${l.name} ${l.city ?? ""}`) === q,
  );
  if (exact.length === 1) return { location: exact[0], matches: exact };
  if (exact.length > 1) return { location: undefined, matches: exact };
  const fuzzy = locations.filter((l) => normalize(locationLabel(l)).includes(q));
  return { location: fuzzy.length === 1 ? fuzzy[0] : undefined, matches: fuzzy };
}

function displayName(location: Location | undefined) {
  if (!location) return "";
  return locationLabel(location);
}

/** A GET-link filter chip — no JavaScript required, preserves every other
 * current query param so applying one filter never resets the others. */
function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-primary/40",
      )}
    >
      {children}
    </Link>
  );
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const from = params.from?.trim() ?? "";
  const to = params.to?.trim() ?? "";
  const date = params.date ?? "";
  const typeFilter = params.type?.trim() ?? "";
  const modeFilter =
    params.mode === "SEAT_BOOKING" || params.mode === "FULL_VEHICLE_BOOKING" ? params.mode : "";
  const sort = params.sort === "price_asc" || params.sort === "price_desc" ? params.sort : "soonest";
  const rawPassengers = Number(params.passengers);
  const passengers = Number.isInteger(rawPassengers) ? Math.min(50, Math.max(1, rawPassengers)) : 1;

  const supabase = await createClient();

  const { data: locationsData } = await supabase.from("locations").select("id,name,city,state,pincode").order("name");
  const allLocations = (locationsData ?? []) as Location[];
  const originMatch = matchLocation(allLocations, from);
  const destinationMatch = matchLocation(allLocations, to);
  const origin = originMatch.location;
  const destination = destinationMatch.location;

  type RawTrip = {
    id: string;
    route_id: string;
    vehicle_id: string;
    departure_at: string;
    arrival_at: string | null;
    status: string;
    base_price: number;
  };
  let allResults: RawTrip[] = [];

  if (origin && destination && origin.id !== destination.id) {
    const { data: routes } = await supabase
      .from("routes")
      .select("id")
      .eq("origin_location_id", origin.id)
      .eq("destination_location_id", destination.id);
    const routeIds = (routes ?? []).map((r) => r.id);
    if (routeIds.length) {
      let query = supabase
        .from("trips")
        .select("id,route_id,vehicle_id,departure_at,arrival_at,status,base_price")
        .in("route_id", routeIds)
        .eq("status", "scheduled")
        .gte("departure_at", new Date().toISOString())
        .order("departure_at");
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00+05:30`))) {
        // A selected calendar day refers to local service time in India.
        const start = new Date(`${date}T00:00:00+05:30`).toISOString();
        const next = new Date(start);
        next.setUTCDate(next.getUTCDate() + 1);
        query = query.gte("departure_at", start).lt("departure_at", next.toISOString());
      }
      const { data } = await query;
      allResults = data ?? [];
    }
  }

  const vehicleIds = [...new Set(allResults.map((r) => r.vehicle_id))];
  type RawVehicle = {
    id: string;
    label: string;
    registration_number: string;
    seat_capacity: number | null;
    vehicle_type_id: string;
    vehicle_types: { id: string; name: string; booking_mode: string } | null;
  };
  const { data: vehiclesData } = vehicleIds.length
    ? await supabase
        .from("vehicles")
        .select("id,label,registration_number,seat_capacity,vehicle_type_id,vehicle_types(id,name,booking_mode)")
        .in("id", vehicleIds)
    : { data: [] };
  const vehicleMap = new Map(
    ((vehiclesData ?? []) as unknown as RawVehicle[]).map((v) => [v.id, v]),
  );

  // Real filters only: vehicle type is matched against the actual
  // free-text vehicle_types.name a partner entered (no invented
  // taxonomy — see docs/design-system.md), and booking mode against the
  // actual stored value. A vehicle type marked BOTH always satisfies
  // either mode filter, since it genuinely supports both.
  let filtered = allResults.filter((trip) => {
    const vehicle = vehicleMap.get(trip.vehicle_id);
    if (typeFilter && !normalize(vehicle?.vehicle_types?.name ?? "").includes(normalize(typeFilter))) {
      return false;
    }
    if (modeFilter) {
      const bookingMode = vehicle?.vehicle_types?.booking_mode;
      if (bookingMode !== modeFilter && bookingMode !== "BOTH") return false;
    }
    return true;
  });

  if (sort === "price_asc") filtered = [...filtered].sort((a, b) => a.base_price - b.base_price);
  else if (sort === "price_desc") filtered = [...filtered].sort((a, b) => b.base_price - a.base_price);

  const unmatched = Boolean(from) && Boolean(to) && (!origin || !destination);
  const ambiguous = originMatch.matches.length > 1 || destinationMatch.matches.length > 1;
  const sameLocation = Boolean(origin) && Boolean(destination) && origin!.id === destination!.id;
  const hasBaseRoute = Boolean(origin) && Boolean(destination) && !sameLocation;
  const filtersActive = Boolean(typeFilter) || Boolean(modeFilter);

  // Preserve from/to/date/passengers on every filter/sort link so
  // toggling one control never loses the others or the original search.
  const baseQuery = new URLSearchParams();
  if (from) baseQuery.set("from", from);
  if (to) baseQuery.set("to", to);
  if (date) baseQuery.set("date", date);
  baseQuery.set("passengers", String(passengers));
  function linkWith(extra: Record<string, string>) {
    const q = new URLSearchParams(baseQuery);
    for (const [k, v] of Object.entries(extra)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    return `/search?${q.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-12 lg:px-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Find your ride</h1>
        <p className="mt-1.5 text-muted-foreground">
          Real scheduled trips from the network — nothing shown here is sample data.
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-border bg-card p-4 shadow-card sm:p-5">
        <RouteSearchForm
          defaultFrom={from}
          defaultTo={to}
          defaultDate={date}
          defaultPassengers={passengers}
        />
      </div>

      {hasBaseRoute ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <FilterChip href={linkWith({ mode: "" })} active={!modeFilter}>
              Any booking style
            </FilterChip>
            <FilterChip href={linkWith({ mode: "SEAT_BOOKING" })} active={modeFilter === "SEAT_BOOKING"}>
              Seat booking
            </FilterChip>
            <FilterChip
              href={linkWith({ mode: "FULL_VEHICLE_BOOKING" })}
              active={modeFilter === "FULL_VEHICLE_BOOKING"}
            >
              Full vehicle
            </FilterChip>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:justify-end sm:pb-0">
            <FilterChip href={linkWith({ sort: "" })} active={sort === "soonest"}>
              Soonest
            </FilterChip>
            <FilterChip href={linkWith({ sort: "price_asc" })} active={sort === "price_asc"}>
              Cheapest
            </FilterChip>
            <FilterChip href={linkWith({ sort: "price_desc" })} active={sort === "price_desc"}>
              Priciest
            </FilterChip>
          </div>
        </div>
      ) : null}

      {typeFilter ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtering by vehicle type:</span>
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-semibold">
            {typeFilter}
            <Link href={linkWith({ type: "" })} className="text-muted-foreground hover:text-foreground" aria-label="Clear vehicle type filter">
              ×
            </Link>
          </span>
        </div>
      ) : null}

      {unmatched ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          {ambiguous
            ? "Multiple stops match your search. Select the exact stop below."
            : "We could not match one of those locations. Try a city or location available in the network."}
          {([ ["From", originMatch.matches, "from"], ["To", destinationMatch.matches, "to"] ] as const).map(([label, matches, field]) =>
            matches.length > 1 ? <div key={field} className="mt-4"><p className="font-semibold text-foreground">{label} — choose a stop</p><ul className="mt-2 flex flex-wrap gap-2">{matches.slice(0, 20).map((location) => <li key={location.id}><Link className="inline-flex rounded-full border px-3 py-1.5 text-foreground hover:border-primary" href={linkWith({ [field]: locationLabel(location) })}>{locationLabel(location)}</Link></li>)}</ul>{matches.length > 20 ? <p className="mt-2 text-xs">Showing 20 matches. Enter more of the stop name or PIN to narrow the list.</p> : null}</div> : null)}
        </div>
      ) : null}

      {sameLocation ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Origin and destination must be different.
        </div>
      ) : null}

      {hasBaseRoute && !allResults.length ? (
        <div className="rounded-[1.75rem] border border-dashed border-border p-10 text-center">
          <p className="font-bold">No trips found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another date or route. Availability is never fabricated.
          </p>
        </div>
      ) : null}

      {hasBaseRoute && allResults.length > 0 && !filtered.length ? (
        <div className="rounded-[1.75rem] border border-dashed border-border p-10 text-center">
          <p className="font-bold">No trips match your filters</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {allResults.length} trip{allResults.length === 1 ? "" : "s"} run this route —{" "}
            <Link href={linkWith({ type: "", mode: "" })} className="text-primary hover:underline">
              clear filters
            </Link>{" "}
            to see all of them.
          </p>
        </div>
      ) : null}

      {filtered.length ? (
        <div className="grid gap-4">
          {filtered.map((trip) => {
            const vehicle = vehicleMap.get(trip.vehicle_id);
            const result: TripResult = {
              id: trip.id,
              departureAt: trip.departure_at,
              arrivalAt: trip.arrival_at,
              basePrice: trip.base_price,
              vehicleLabel: vehicle?.label ?? null,
              seatCapacity: vehicle?.seat_capacity ?? null,
              vehicleTypeName: vehicle?.vehicle_types?.name ?? null,
              bookingMode: (vehicle?.vehicle_types?.booking_mode as TripResult["bookingMode"]) ?? null,
            };
            return (
              <ResultCard
                key={trip.id}
                trip={result}
                origin={displayName(origin)}
                destination={displayName(destination)}
                passengers={passengers}
              />
            );
          })}
          {filtersActive && filtered.length !== allResults.length ? (
            <p className="text-center text-xs text-muted-foreground">
              Showing {filtered.length} of {allResults.length} trips on this route.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
