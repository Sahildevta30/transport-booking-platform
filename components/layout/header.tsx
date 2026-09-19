import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";

const NAV_LINKS = [
  { href: "/search", label: "Cabs" },
  { href: "/search", label: "Bikes" },
  { href: "/search", label: "Buses" },
  { href: "/search", label: "Travellers" },
  { href: "/partner", label: "Partner With Us" },
] as const;

/**
 * Top navigation for the public customer-facing site.
 *
 * Every role entry point a visitor could need is reachable from here
 * without typing a URL: "Log in" for customers, "Partner With Us" for
 * operators (which itself offers partner login and fleet listing).
 * Super admin is intentionally absent — /super-admin/login exists for
 * platform staff but is never advertised to ordinary customers.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-black tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-primary-foreground text-sm font-black shadow-lg shadow-primary/20">
            TB
          </span>
          <span>Transit<span className="text-primary">Book</span></span>
        </Link>

        <nav
          aria-label="Main"
          className="hidden md:flex items-center gap-1 text-sm font-semibold text-muted-foreground"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="rounded-full px-3.5 py-2 transition-colors hover:bg-muted hover:text-foreground"
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
              { href: "/partner/login", label: "Partner Login" },
              { href: "/login", label: "Log in" },
              { href: "/register", label: "Sign up" },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
