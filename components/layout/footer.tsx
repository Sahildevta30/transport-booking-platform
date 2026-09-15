import Link from "next/link";

const FOOTER_SECTIONS = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/cancellation-policy", label: "Cancellation Policy" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            TB
          </span>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            A transport booking platform for seat and whole-vehicle reservations
            across taxis, buses, cars, and tempo travellers.
          </p>
        </div>

        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold">{section.title}</h3>
            <ul className="mt-4 space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TransitBook. All rights reserved.
      </div>
    </footer>
  );
}
