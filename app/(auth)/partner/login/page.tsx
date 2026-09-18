import type { Metadata } from "next";
import Link from "next/link";

import { RoleLoginForm } from "@/components/auth/role-login-form";
import { safeInternalPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Partner login",
  description: "Log in to your TransitBook partner workspace to manage your fleet.",
};

/**
 * Partner/operator entry point.
 *
 * Deliberately NOT a second authentication system — it signs in against
 * the same Supabase Auth users table as /login. "Partner" is an
 * authorization fact (profiles.account_type of ADMIN or STAFF, backed by
 * a partner organization), not a separate credential store.
 *
 * A signed-in account with no partner organization is sent to
 * /partner/apply by /auth/redirect rather than being shown an error —
 * that is the onboarding path, not a failure.
 */
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * `next` and `error` are read and validated HERE, on the server, and passed
 * down as props — the form never reads window.location. That keeps the
 * open-redirect check server-side and avoids a client-side search-param
 * read during render.
 */
export default async function PartnerLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextParam = typeof params.next === "string" ? params.next : null;
  const errorParam = typeof params.error === "string" ? params.error : null;

  return (
    <RoleLoginForm
      area="partner"
      next={safeInternalPath(nextParam)}
      errorCode={errorParam}
      title="Partner login"
      description="Access your fleet, routes, trips and bookings."
      signupHref="/register"
      signupLabel="Create an account"
      footer={
        <p className="text-center text-xs text-muted-foreground">
          New to TransitBook?{" "}
          <Link href="/partner/apply" className="font-medium hover:text-foreground hover:underline">
            List your fleet
          </Link>{" "}
          ·{" "}
          <Link href="/login" className="font-medium hover:text-foreground hover:underline">
            Customer login
          </Link>
        </p>
      }
    />
  );
}
