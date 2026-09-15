import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ADMIN_NAV } from "@/components/admin/sidebar";
import type { SessionUser } from "@/lib/auth/session";

export function AdminTopbar({ user }: { user: SessionUser | null }) {
  return (
    <header className="relative flex h-16 items-center justify-between border-b border-border px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <MobileNav links={ADMIN_NAV} />
        {/* Identity display, not a page title — deliberately not a heading. */}
        <span className="text-sm font-medium text-muted-foreground">
          {user?.email ?? "Admin"}
        </span>
      </div>
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="h-4 w-4" />
      </Button>
    </header>
  );
}
