import Link from "next/link";
import type { Metadata } from "next";
import { Bus, Car, ShieldCheck, Ticket, Timer, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Search & Book Trips",
};

/**
 * Vehicle categories are structural placeholders for Phase 1 layout only.
 * The real list will come from the `vehicle_types` table (see
 * docs/database/domain-model.md) — nothing here is booking-ready data.
 */
const VEHICLE_CATEGORIES = [
  { icon: Car, label: "Taxi / Cab", mode: "Seat or full vehicle" },
  { icon: Bus, label: "Bus", mode: "Seat booking" },
  { icon: Car, label: "Car", mode: "Full vehicle" },
  { icon: Users, label: "Tempo Traveller", mode: "Seat or full vehicle" },
] as const;

const HOW_IT_WORKS = [
  {
    icon: Ticket,
    title: "Search your route",
    body: "Pick where you're starting from, where you're headed, and when.",
  },
  {
    icon: Users,
    title: "Choose seats or the whole vehicle",
    body: "Book individual seats, or reserve the entire vehicle for your group.",
  },
  {
    icon: ShieldCheck,
    title: "Confirm and travel",
    body: "Review your details, confirm the booking, and track it from your dashboard.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* Hero / search area — the real search form lands with the search
          engine in a later phase; this establishes layout and intent. */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Book your next trip, your way
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Reserve a single seat or the whole vehicle — taxis, buses, cars,
              and tempo travellers, all in one place.
            </p>
          </div>

          <Card className="mx-auto mt-10 max-w-3xl">
            <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  From
                </span>
                <span className="text-sm text-muted-foreground/70">
                  Search coming in Phase 2
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  To
                </span>
                <span className="text-sm text-muted-foreground/70">
                  Search coming in Phase 2
                </span>
              </div>
              <div className="flex items-end">
                <Button asChild className="w-full">
                  <Link href="/search">Search trips</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Vehicle type categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold">Travel your way</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VEHICLE_CATEGORIES.map(({ icon: Icon, label, mode }) => (
            <Card key={label}>
              <CardHeader>
                <Icon className="h-6 w-6 text-primary" />
                <CardTitle className="mt-2 text-base">{label}</CardTitle>
                <CardDescription>{mode}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="flex flex-col gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {i + 1}
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / safety — deliberately makes no unverified claims */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-8 sm:flex-row sm:items-center">
          <ShieldCheck className="h-10 w-10 shrink-0 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Built for reliable travel</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every booking runs through the same verified route, schedule,
              and pricing engine — no placeholder numbers, no guesswork.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 lg:px-8">
          <Timer className="h-8 w-8" />
          <h2 className="text-2xl font-semibold">Ready to plan your trip?</h2>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/search">Start searching</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
