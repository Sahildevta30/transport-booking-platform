import { redirect } from "next/navigation";
import { Eye, ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { canAccessSupervisionArea } from "@/lib/auth/roles";
import { AREA_LOGIN_PATH, dashboardForAccountType } from "@/lib/auth/redirects";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  // Supervision is the most restricted area: unauthenticated visitors go
  // to the dedicated super-admin login (not the customer one), and a
  // signed-in but unauthorized account is quietly returned to its own
  // dashboard — never told that it merely lacked the role.
  const user = await getSessionUser();
  if (!user) redirect(`${AREA_LOGIN_PATH["super-admin"]}?next=/super-admin`);
  if (!canAccessSupervisionArea(user.accountType)) {
    redirect(dashboardForAccountType(user.accountType));
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3"><div className="rounded-xl border bg-card p-2 shadow-card"><ShieldCheck className="h-5 w-5" /></div><div><p className="font-semibold tracking-tight">TransitBook Supervision</p><p className="text-xs text-muted-foreground">Read-only platform intelligence</p></div></div>
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"><Eye className="h-3.5 w-3.5" />Observation only</div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
