import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { getSessionUser } from "@/lib/auth/session";
import { canAccessAdminArea } from "@/lib/auth/roles";

/**
 * Explicit, server-side authorization check for the admin area.
 *
 * Middleware only confirms "is someone logged in" — this layout is where
 * "is this someone allowed in the admin area" actually gets decided.
 * `canAccessAdminArea` currently has nothing to check against
 * (accountType is null until Phase 2's `profiles` table exists), so this
 * intentionally fails closed: nobody gets into /admin until that lookup
 * is real. Do not loosen this to "unblock" testing — wire up the real
 * profiles lookup instead.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canAccessAdminArea(user.accountType)) redirect("/");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminTopbar user={user} />
        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
