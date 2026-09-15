"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Menu, X, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface MobileNavLink {
  href: string;
  label: string;
  icon?: LucideIcon;
}

/**
 * Accessible mobile navigation disclosure, used wherever a sidebar/nav is
 * hidden below the `md` breakpoint (site header, customer sidebar, admin
 * sidebar). Built from a plain button + conditional panel rather than a
 * dependency (Radix Dialog/Sheet) — this is a simple show/hide, not a
 * modal, and doesn't need focus-trapping or a portal.
 *
 * Accessibility: the trigger button reports its state via
 * `aria-expanded` and `aria-controls`, points at a visible label via
 * `aria-label`, and the panel is only removed from the DOM (not just
 * visually hidden) when closed, so it never confuses screen readers or
 * accepts keyboard focus while closed.
 */
export function MobileNav({ links }: { links: readonly MobileNavLink[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open ? (
        <nav
          id={panelId}
          className="absolute inset-x-0 top-16 z-30 border-b border-border bg-background shadow-sm"
        >
          <ul className="flex flex-col gap-1 p-4">
            {links.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
