import { MobileNav } from "@/components/layout/mobile-nav";
import { ADMIN_NAV } from "@/components/admin/sidebar";
import type { SessionUser } from "@/lib/auth/session";

const ADMIN_MOBILE_NAV = ADMIN_NAV.map(({ href, label }) => ({ href, label }));

// The notification bell previously did nothing on click — no destination,
// no real unread state, a dead control per the no-fabricated-UI rule.
// There is no admin-facing notification system in this schema (the
// notifications table is scoped to a customer's own user_id), so rather
// than fake a bell with an invented badge, it is left out until a real
// admin notification feed exists to back it.
export function AdminTopbar({ user }: { user: SessionUser | null }) {
  return (
    <header className="relative flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <MobileNav links={ADMIN_MOBILE_NAV} />
        <span className="text-sm font-medium text-muted-foreground">
          {user?.email ?? "Admin"}
        </span>
      </div>
    </header>
  );
}
