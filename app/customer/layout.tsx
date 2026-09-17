import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Ticket, User } from "lucide-react";

import { getSessionUser } from "@/lib/auth/session";
import { MobileNav } from "@/components/layout/mobile-nav";

const CUSTOMER_NAV = [
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer/bookings", label: "My Bookings", icon: Ticket },
  { href: "/customer/profile", label: "Profile", icon: User },
] as const;

const CUSTOMER_MOBILE_NAV = CUSTOMER_NAV.map(({ href, label }) => ({ href, label }));

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <header className="relative flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
        <Link href="/customer/dashboard" className="font-semibold">
          TransitBook
        </Link>
        <MobileNav links={CUSTOMER_MOBILE_NAV} />
      </header>

      <aside className="hidden w-60 shrink-0 border-r border-border bg-muted/20 md:block">
        <div className="p-6">
          <Link href="/" className="font-semibold">
            TransitBook
          </Link>
        </div>
        <nav aria-label="Customer" className="flex flex-col gap-1 px-3">
          {CUSTOMER_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 sm:p-8">{children}</main>
    </div>
  );
}
