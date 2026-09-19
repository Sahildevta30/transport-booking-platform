"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface MobileNavLink {
  href: string;
  label: string;
}

/**
 * Accessible mobile navigation disclosure. Props intentionally contain only
 * serializable data because this component is a client boundary and callers
 * may be Server Components.
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
          className="absolute inset-x-3 top-[4.5rem] z-30 overflow-hidden rounded-3xl border border-border bg-background/95 shadow-2xl backdrop-blur-2xl"
        >
          <ul className="flex flex-col gap-1.5 p-3">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
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
