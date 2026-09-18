"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import type { RoleArea } from "@/lib/auth/redirects";

interface RoleLoginFormProps {
  /** Which entry point this form is. Passed through to /auth/redirect. */
  area: RoleArea;
  title: string;
  description: string;
  /**
   * Already validated server-side by the page (see safeInternalPath), so
   * this component never has to touch window.location during render.
   */
  next: string | null;
  /** `?error=forbidden` from /auth/redirect, resolved server-side. */
  errorCode?: string | null;
  /** Customer + partner entries offer signup; super admin never does. */
  signupHref?: string;
  signupLabel?: string;
  footer?: React.ReactNode;
}

/**
 * One login form, three doors.
 *
 * Password verification happens through Supabase Auth in the browser —
 * there is exactly ONE auth system for all three roles, no separate
 * partner or super-admin credential store. What differs per door is only
 * where the user is sent afterwards, and that decision is deliberately
 * NOT made here: on success we hand off to /auth/redirect, which re-reads
 * the session server-side and resolves the destination from the
 * authoritative account type. A tampered URL or a patched client bundle
 * therefore buys nothing.
 */
export function RoleLoginForm({
  area,
  title,
  description,
  next,
  errorCode,
  signupHref,
  signupLabel = "Sign up",
  footer,
}: RoleLoginFormProps) {
  const [formError, setFormError] = useState<string | null>(
    errorCode === "forbidden" ? "This account is not authorized for this area." : null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      // Intentionally generic — never reveal whether the email exists.
      setFormError("Invalid email or password.");
      return;
    }

    // Full navigation (not router.push) so the freshly written auth
    // cookie is definitely attached to the /auth/redirect request that
    // resolves the role.
    const target = new URL("/auth/redirect", window.location.origin);
    target.searchParams.set("area", area);
    if (next) target.searchParams.set("next", next);
    window.location.assign(target.toString());
  }

  const signupQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email ? (
              <p id="email-error" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password ? (
              <p id="password-error" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in…" : "Log in"}
          </Button>

          {signupHref ? (
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href={`${signupHref}${signupQuery}`}
                className="font-medium text-primary hover:underline"
              >
                {signupLabel}
              </Link>
            </p>
          ) : null}

          {footer}
        </CardFooter>
      </form>
    </Card>
  );
}
