import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={LayoutDashboard}
      title="Dashboard"
      description="Bookings, revenue, active trips, and operational metrics at a glance."
      note="No fabricated analytics — this populates once real booking/payment data exists."
    />
  );
}
