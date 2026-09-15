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
      description="Manage routes, route stops, pickup points, and drop points."
      note="Ships with the routes domain in Phase 2."
    />
  );
}
