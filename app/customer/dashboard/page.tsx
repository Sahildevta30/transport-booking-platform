import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function CustomerDashboardPage() {
  const user = await getSessionUser();

  return (
    <PagePlaceholder
      title={`Welcome${user?.email ? `, ${user.email}` : ""}`}
      description="Your upcoming trips, recent bookings, and quick actions will appear here."
      note="Populated once the bookings domain ships in Phase 2."
    />
  );
}
