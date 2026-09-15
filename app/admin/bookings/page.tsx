import type { Metadata } from "next";
import { Ticket } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Bookings",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={Ticket}
      title="Bookings"
      description="Search, filter, and manage every booking across the platform."
      note="Ships with the booking engine in Phase 2."
    />
  );
}
