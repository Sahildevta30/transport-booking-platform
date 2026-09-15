import type { Metadata } from "next";
import { Calendar } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Trips",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={Calendar}
      title="Trips"
      description="Schedule trips and manage seat/vehicle availability."
      note="Ships with the trips domain in Phase 2."
    />
  );
}
