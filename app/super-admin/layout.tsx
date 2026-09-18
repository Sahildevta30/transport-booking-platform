import { redirect } from "next/navigation";
import { Eye, ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { canAccessSupervisionArea } from "@/lib/auth/roles";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/super-admin");
  if (!canAccessSupervisionArea(user.accountType)) redirect("/");
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3"><div className="rounded-xl border bg-card p-2 shadow-sm"><ShieldCheck className="h-5 w-5" /></div><div><p className="font-semibold tracking-tight">TransitBook Supervision</p><p className="text-xs text-muted-foreground">Read-only platform intelligence</p></div></div>
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"><Eye className="h-3.5 w-3.5" />Observation only</div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
