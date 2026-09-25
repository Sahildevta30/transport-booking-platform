import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { getSessionUser } from "@/lib/auth/session";
import { canAccessAdminArea, canAccessSupervisionArea } from "@/lib/auth/roles";
import { AREA_LOGIN_PATH } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

/**
 * Explicit, server-side authorization check for the partner/admin area.
 *
 * The proxy only answers "is anyone logged in"; this layout answers "is
 * THIS someone allowed to operate a fleet". Every /admin/* page renders
 * inside it, so there is no route in the area that can skip the check.
 *
 * Deliberate redirect behaviour for the deny cases:
 *  - not signed in      → the partner login page, carrying `next`
 *  - super admin        → /super-admin. Supervision is read-only by
 *                         design; a super admin must never silently pick
 *                         up a partner's operational write permissions.
 *  - everyone else      → /partner/apply, because "customer without a
 *                         partner organization" is an onboarding state,
 *                         not an error.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect(`${AREA_LOGIN_PATH.partner}?next=/admin/dashboard`);

  if (!canAccessAdminArea(user.accountType)) {
    if (canAccessSupervisionArea(user.accountType)) redirect("/super-admin");
    redirect("/partner/apply");
  }

  // An ADMIN or STAFF profile alone does not grant access to a company's
  // workspace. The account must belong to an actual partner organization.
  const supabase = await createClient();
  const { data: membership, error } = await supabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .in("role", ["OWNER", "ADMIN", "STAFF"])
    .limit(1);
  if (error || !membership?.length) redirect("/partner/apply");

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
