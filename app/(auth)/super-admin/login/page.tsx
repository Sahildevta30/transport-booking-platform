import type { Metadata } from "next";

import { RoleLoginForm } from "@/components/auth/role-login-form";
import { safeInternalPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Platform supervision login",
  robots: { index: false, follow: false },
};

/**
 * Super admin entry point.
 *
 * Directly openable by URL on purpose — but there is deliberately NO
 * signup link, NO "become a super admin" path, and nothing on this page
 * that can change an account's role. It only signs in against the normal
 * Supabase Auth users table; /auth/redirect then checks the
 * server-authoritative profiles.account_type and lets the request through
 * only if it is already SUPER_ADMIN.
 *
 * SUPER_ADMIN can therefore only be granted out of band (secure database
 * / platform configuration). A customer or partner who signs in here is
 * refused, with no hint as to why.
 */
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * `next` and `error` are read and validated HERE, on the server, and passed
 * down as props — the form never reads window.location. That keeps the
 * open-redirect check server-side and avoids a client-side search-param
 * read during render.
 */
export default async function SuperAdminLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextParam = typeof params.next === "string" ? params.next : null;
  const errorParam = typeof params.error === "string" ? params.error : null;

  return (
    <RoleLoginForm
      area="super-admin"
      next={safeInternalPath(nextParam)}
      errorCode={errorParam}
      title="Platform supervision"
      description="Authorized platform staff only."
      footer={
        <p className="text-center text-xs text-muted-foreground">
          Access is granted by the platform administrator. There is no self-service signup.
        </p>
      }
    />
  );
}
