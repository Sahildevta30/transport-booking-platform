import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bus,
  Car,
  Lock,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { RouteSearchForm } from "@/components/marketplace/route-search-form";
import { BookingModeTabs } from "@/components/marketplace/booking-mode-tabs";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Book cabs, buses & group rides" };

const WHY_TRANSITBOOK = [
  {
    icon: Lock,
    title: "Seats that are actually yours",
    body: "Selecting a seat places a time-boxed hold on it — no one else can take it while you check out, and it's released automatically if you don't.",
  },
  {
    icon: ShieldCheck,
    title: "Bookings reviewed by operators",
    body: "Your request goes to the transport operator. You can track its status from your bookings page.",
  },
  {
    icon: Ticket,
    title: "Real availability, always",
    body: "What you see is what's actually scheduled by the operator. No placeholder trips, no inflated inventory.",
  },
] as const;

const BOOKING_MODES = [
  {
    icon: Users,
    title: "Book a seat",
    body: "Traveling solo or in a small group? Pick individual seats on a scheduled trip, alongside other passengers.",
  },
  {
    icon: Car,
    title: "Book the whole vehicle",
    body: "Planning with a larger group? Reserve the entire vehicle for just your party — no shared seating.",
  },
] as const;

type Location = { id: string; name: string; city: string | null };
type UpcomingTrip = {
  id: string;
  departure_at: string;
  base_price: number;
  route_id: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const params = await searchParams;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/customer/dashboard`);
  }

  const supabase = await createClient();

  // Real, live inventory only: vehicle types that currently have at least
  // one active vehicle attached. An empty result renders an honest empty
  // state below rather than a hardcoded category list that might not
  // correspond to anything actually bookable today.
  const { data: activeVehicles } = await supabase
    .from("vehicles")
    .select("vehicle_type_id, vehicle_types(id,name,booking_mode)")
    .eq("status", "active");

  const typeCounts = new Map<
    string,
    { id: string; name: string; bookingMode: string; count: number }
  >();
  for (const row of activeVehicles ?? []) {
    const type = row.vehicle_types as unknown as
      | { id: string; name: string; booking_mode: string }
      | null;
    if (!type) continue;
    const existing = typeCounts.get(type.id);
    if (existing) existing.count += 1;
    else
      typeCounts.set(type.id, {
        id: type.id,
        name: type.name,
        bookingMode: type.booking_mode,
        count: 1,
      });
  }
  const vehicleTypes = Array.from(typeCounts.values()).sort((a, b) => b.count - a.count);

  // Upcoming departures: real scheduled trips, soonest first. This is the
  // "browse what's actually available" section — every price and time
  // shown here is a live trips row, not sample data.
  const { data: trips } = await supabase
    .from("trips")
    .select("id,departure_at,base_price,route_id")
    .eq("status", "scheduled")
    .gte("departure_at", new Date().toISOString())
    .order("departure_at")
    .limit(6);
  const upcomingTrips = (trips ?? []) as UpcomingTrip[];

  const routeIds = [...new Set(upcomingTrips.map((t) => t.route_id))];
  const { data: routesData } = routeIds.length
    ? await supabase
        .from("routes")
        .select("id,origin_location_id,destination_location_id")
        .in("id", routeIds)
    : { data: [] };
  const routes = routesData ?? [];

  const locationIds = [
    ...new Set(routes.flatMap((r) => [r.origin_location_id, r.destination_location_id])),
  ];
  const { data: locationsData } = locationIds.length
    ? await supabase.from("locations").select("id,name,city").in("id", locationIds)
    : { data: [] };
  const locations = new Map(((locationsData ?? []) as Location[]).map((l) => [l.id, l]));
  const routeMap = new Map(routes.map((r) => [r.id, r]));

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Real trips, real seats
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">
            Go anywhere, your way.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Cabs, buses, cars and group vehicles from verified operators — book
            a seat or take the whole ride.
          </p>

          <div className="mt-8 rounded-[1.75rem] bg-background p-4 text-foreground shadow-elevated sm:p-6">
            <BookingModeTabs routePanel={<RouteSearchForm />} />
          </div>
        </div>
      </section>

      {/* BROWSE BY VEHICLE TYPE — real inventory, or an honest empty state */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-primary">
              Browse
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              What&apos;s on the road right now
            </h2>
          </div>
          <Link
            href="/vehicles"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
          >
            See all vehicles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {vehicleTypes.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {vehicleTypes.slice(0, 8).map((type) => (
              <Link
                key={type.id}
                href={`/search?type=${encodeURIComponent(type.name)}`}
                className="group rounded-[1.5rem] border border-border bg-card p-6 shadow-card outline-none transition hover:-translate-y-1 hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Bus className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-5 text-lg font-bold">{type.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {type.count} {type.count === 1 ? "vehicle" : "vehicles"} active
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-border p-10 text-center">
            <p className="font-bold">Vehicle listings are coming online.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Partners are onboarding their fleets — check back soon, or
              search directly below.
            </p>
          </div>
        )}
      </section>

      {/* UPCOMING DEPARTURES — real scheduled trips */}
      {upcomingTrips.length ? (
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-xs font-black uppercase tracking-[.2em] text-primary">
              Departing soon
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Upcoming departures
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingTrips.map((trip) => {
                const route = routeMap.get(trip.route_id);
                const origin = route ? locations.get(route.origin_location_id) : undefined;
                const destination = route
                  ? locations.get(route.destination_location_id)
                  : undefined;
                return (
                  <article
                    key={trip.id}
                    className="rounded-[1.5rem] border border-border bg-card p-6 shadow-card"
                  >
                    <p className="text-lg font-bold">
                      {origin?.name ?? "Origin"} <ArrowRight className="mx-1 inline h-4 w-4" />{" "}
                      {destination?.name ?? "Destination"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(trip.departure_at).toLocaleString(undefined, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        From{" "}
                        <span className="text-lg font-black text-foreground">
                          ₹{Number(trip.base_price).toFixed(0)}
                        </span>
                      </p>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/booking?trip=${trip.id}`}>View</Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* SEAT VS FULL VEHICLE */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[.2em] text-primary">
          How booking works
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          Two ways to travel
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {BOOKING_MODES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-[1.5rem] border border-border bg-card p-7 shadow-card"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[.2em] text-primary">
          Why TransitBook
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {WHY_TRANSITBOOK.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PARTNER CTA */}
      <section className="border-t border-border bg-gradient-accent text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Run a fleet? Put it on TransitBook.
            </h2>
            <p className="mt-2 max-w-xl text-white/90">
              List vehicles, publish routes and trips, and manage bookings
              from your own partner workspace.
            </p>
          </div>
          <Button size="lg" variant="secondary" asChild className="shrink-0">
            <Link href="/partner">
              Partner with us <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
