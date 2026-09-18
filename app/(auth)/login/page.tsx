import type { Metadata } from "next";
import Link from "next/link";

import { RoleLoginForm } from "@/components/auth/role-login-form";
import { safeInternalPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your TransitBook account to manage trips and bookings.",
};

/**
 * Customer entry point — the login the public site links to.
 *
 * It is not customer-ONLY: an admin or super admin who logs in here is
 * routed to their own dashboard by /auth/redirect rather than being
 * rejected, because the underlying Supabase Auth account is the same one
 * either way. The role decision happens server-side, never here.
 */
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * `next` and `error` are read and validated HERE, on the server, and passed
 * down as props — the form never reads window.location. That keeps the
 * open-redirect check server-side and avoids a client-side search-param
 * read during render.
 */
export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextParam = typeof params.next === "string" ? params.next : null;
  const errorParam = typeof params.error === "string" ? params.error : null;

  return (
    <RoleLoginForm
      area="customer"
      next={safeInternalPath(nextParam)}
      errorCode={errorParam}
      title="Log in"
      description="Welcome back. Enter your details to continue."
      signupHref="/register"
      footer={
        <p className="text-center text-xs text-muted-foreground">
          Run a transport business?{" "}
          <Link href="/partner" className="font-medium hover:text-foreground hover:underline">
            Partner login
          </Link>
        </p>
      }
    />
  );
}
