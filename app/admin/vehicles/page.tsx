import type { Metadata } from "next";
import { Bus } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Vehicles",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={Bus}
      title="Vehicles"
      description="Manage vehicle types, individual vehicles, seat layouts, amenities, and maintenance."
      note="Ships with the vehicles domain in Phase 2."
    />
  );
}
