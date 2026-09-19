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
    title: "Partners",
    links: [
      { href: "/partner", label: "Partner With Us" },
      { href: "/partner/login", label: "Partner Login" },
      { href: "/partner/apply", label: "List Your Fleet" },
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
    <footer className="mt-auto border-t border-border bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-5 lg:px-8">
        <div className="md:col-span-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent text-white text-sm font-black">
            TB
          </span>
          <p className="mt-4 max-w-sm text-sm text-background/60">
            One place for seats, cabs and whole-vehicle travel — built for
            customers and transport partners.
          </p>
        </div>

        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-bold text-background">
              {section.title}
            </h3>
            <ul className="mt-4 space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/60 transition-colors hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-background/10 py-6 text-center text-xs text-background/50">
        © {new Date().getFullYear()} TransitBook. All rights reserved.
      </div>
    </footer>
  );
}
