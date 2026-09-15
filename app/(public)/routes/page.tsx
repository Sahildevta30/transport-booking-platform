import type { Metadata } from "next";
import { Milestone } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Routes",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={Milestone}
      title="Routes"
      description="Explore serviced routes, pickup points, and drop points."
      note="Route data ships alongside the routes and route_stops domain in Phase 2."
    />
  );
}
