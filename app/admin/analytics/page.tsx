import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={BarChart3}
      title="Analytics"
      description="Business insights across bookings, revenue, and vehicle utilization."
      note="No fabricated analytics — real dashboards ship once analytics_events data exists."
    />
  );
}
