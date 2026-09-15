import Link from "next/link";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Bus,
  Milestone,
  Calendar,
  Tag,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react";

export const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/vehicles", label: "Vehicles", icon: Bus },
  { href: "/admin/routes", label: "Routes", icon: Milestone },
  { href: "/admin/trips", label: "Trips", icon: Calendar },
  { href: "/admin/pricing", label: "Pricing", icon: Tag },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-muted/20 md:block">
      <div className="p-6">
        <Link href="/admin/dashboard" className="font-semibold">
          TransitBook <span className="text-muted-foreground">Admin</span>
        </Link>
      </div>
      <nav aria-label="Admin" className="flex flex-col gap-1 px-3 pb-6">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
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
  );
}
