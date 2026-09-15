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
      description="Browse available vehicle types, seat layouts, and amenities."
      note="Vehicle listings populate once the vehicles domain is implemented."
    />
  );
}
