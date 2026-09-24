import Link from "next/link";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Bus,
  Milestone,
  MapPin,
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
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/routes", label: "Routes", icon: Milestone },
  { href: "/admin/trips", label: "Trips", icon: Calendar },
  { href: "/admin/pricing", label: "Pricing", icon: Tag },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
      <div className="border-b border-border p-6">
        <Link href="/admin/dashboard" className="text-sm font-black tracking-tight">
          TransitBook <span className="font-normal text-muted-foreground">Partner</span>
        </Link>
      </div>
      <nav aria-label="Admin" className="flex flex-col gap-0.5 px-3 py-4">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
