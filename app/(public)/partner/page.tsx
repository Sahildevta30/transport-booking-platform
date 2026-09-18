import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Bus, CalendarClock, LogIn, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Partner with us",
  description:
    "List your fleet on TransitBook, manage routes and trips, and take bookings from one operations hub.",
};

/**
 * The partner front door: one page that serves both audiences the brief
 * calls out — an existing partner who just wants to sign in, and a new
 * operator who needs to find the onboarding path. Neither should have to
 * guess a hidden /admin URL.
 */

const FEATURES = [
  {
    icon: Bus,
    title: "Fleet management",
    body: "Add vehicles, seat layouts and vehicle types, and keep availability accurate.",
  },
  {
    icon: CalendarClock,
    title: "Routes & trips",
    body: "Publish routes, schedule departures and control pricing per trip.",
  },
  {
    icon: BarChart3,
    title: "Booking operations",
    body: "See every booking, payment and cancellation for your own organization.",
  },
] as const;

export default function PartnerLandingPage() {
  return (
    <div className="bg-gradient-to-b from-background via-background to-muted/40">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm shadow-sm">
          <ShieldCheck className="h-4 w-4 text-primary" />
          For transport operators
        </div>

        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Put your fleet in front of customers ready to travel.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Run your vehicles, routes, trips and bookings from a partner workspace that stays
          scoped to your own business.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/partner/login">
              <LogIn className="h-4 w-4" />
              Partner login
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/partner/apply">
              List your fleet
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          New here? Create a normal account first, then complete{" "}
          <Link href="/partner/apply" className="font-medium text-primary hover:underline">
            partner onboarding
          </Link>{" "}
          — same login, one account.
        </p>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border bg-card/70 p-5 shadow-sm">
              <div className="mb-3 w-fit rounded-xl bg-primary/10 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">
          <span className="font-medium text-foreground">How onboarding works:</span> register or
          log in with your normal account → open{" "}
          <Link href="/partner/apply" className="text-primary hover:underline">
            /partner/apply
          </Link>{" "}
          → enter your business details and accept the partner terms → your partner workspace is
          activated and you land on your dashboard.
        </div>
      </section>
    </div>
  );
}
