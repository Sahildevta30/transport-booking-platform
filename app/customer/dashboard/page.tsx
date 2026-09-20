import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bus,
  CalendarDays,
  Car,
  Sparkles,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteSearchForm } from "@/components/marketplace/route-search-form";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "Dashboard" };

// Real, backed distinctions only (booking_mode is an actual column) —
// this previously hardcoded "Cab / Bus / Traveller" as three categories
// that all linked to the same unfiltered /search, the exact honesty
// issue already fixed on the public homepage/header. Reusing the same
// real mode filter PHASE C added to /search instead of a second
// unrelated fabricated taxonomy.
const MODES = [
  { label: "Seat booking", sub: "Join a scheduled trip", icon: Users, href: "/search?mode=SEAT_BOOKING" },
  { label: "Full vehicle", sub: "Reserve the whole ride", icon: Car, href: "/search?mode=FULL_VEHICLE_BOOKING" },
  { label: "Browse all", sub: "See every scheduled trip", icon: Bus, href: "/search" },
] as const;

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/customer/dashboard");
  const [{ data: profile }, { data: bookings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("id,status,amount,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const rows = bookings ?? [],
    active = rows.filter(
      (b) => !["COMPLETED", "CANCELLED"].includes(String(b.status)),
    ).length,
    value = rows.reduce((n, b) => n + Number(b.amount ?? 0), 0),
    name =
      profile?.full_name?.trim() || user.email?.split("@")[0] || "Traveller";
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-hero p-7 text-white shadow-elevated sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_80%_0%,white,transparent_35%)]" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Your next journey starts here
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            Where are we going, {name.split(" ")[0]}?
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
            Find a seat, book a cab or reserve the whole vehicle. One search,
            multiple ways to travel.
          </p>
          <div className="mt-7 max-w-2xl rounded-2xl bg-background p-3 text-foreground shadow-elevated sm:p-4">
            <RouteSearchForm />
          </div>
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
              Travel your way
            </p>
            <h2 className="mt-1 text-2xl font-bold">Choose your ride</h2>
          </div>
          <Link href="/search" className="text-sm font-medium text-primary">
            See all →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {MODES.map(({ label, sub, icon: Icon, href }) => (
            <Link
              href={href}
              key={label}
              className="group rounded-2xl border bg-card p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <p className="mt-5 font-semibold">{label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <Ticket className="h-5 w-5 text-primary" />
          <p className="mt-4 text-3xl font-bold">{rows.length}</p>
          <p className="text-sm text-muted-foreground">Recent bookings</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <CalendarDays className="h-5 w-5 text-primary" />
          <p className="mt-4 text-3xl font-bold">{active}</p>
          <p className="text-sm text-muted-foreground">Active / upcoming</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <Wallet className="h-5 w-5 text-primary" />
          <p className="mt-4 text-3xl font-bold">₹{value.toFixed(0)}</p>
          <p className="text-sm text-muted-foreground">Recent booked value</p>
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your journeys</h2>
            <p className="text-sm text-muted-foreground">
              Latest reservations at a glance.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/customer/bookings">View all</Link>
          </Button>
        </div>
        {!rows.length ? (
          <div className="rounded-[1.75rem] border border-dashed bg-card/60 p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Ticket className="h-6 w-6" />
            </span>
            <p className="mt-4 text-lg font-semibold">
              Your travel story starts here
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              No bookings yet. Explore available trips and make your first
              reservation.
            </p>
            <Button asChild className="mt-5 rounded-xl">
              <Link href="/search">Explore trips</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.map((b) => (
              <Link
                key={b.id}
                href={`/customer/bookings/${b.id}`}
                className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div>
                  <p className="font-semibold">
                    Booking {b.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(b.created_at).toLocaleDateString()} · {b.status}
                  </p>
                </div>
                <p className="font-bold">₹{Number(b.amount).toFixed(2)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
