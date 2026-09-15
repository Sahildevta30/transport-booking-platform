import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";

const NAV_LINKS = [
  { href: "/search", label: "Search Trips" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/routes", label: "Routes" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Top navigation for the public customer-facing site.
 * Auth state (login vs. dashboard link) will be wired in once
 * Supabase Auth session reading lands in a later phase.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            TB
          </span>
          <span>TransitBook</span>
        </Link>

        <nav
          aria-label="Main"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button size="sm" className="hidden md:inline-flex" asChild>
            <Link href="/register">Sign up</Link>
          </Button>
          <MobileNav
            links={[
              ...NAV_LINKS,
              { href: "/login", label: "Log in" },
              { href: "/register", label: "Sign up" },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
