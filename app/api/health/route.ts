import { NextResponse } from "next/server";

/**
 * Basic liveness check. Deliberately does not touch Supabase or any other
 * dependency — this only confirms the Next.js server itself is up, which
 * is what deploy tooling (Vercel, uptime monitors) typically wants.
 */
export function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
