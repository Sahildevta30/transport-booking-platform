import type { Metadata } from "next";
import { Ticket } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Booking",
};

export default function BookingPage() {
  return (
    <PagePlaceholder
      icon={Ticket}
      title="Booking"
      description="Seat selection, whole-vehicle booking, passenger details, and checkout will live here."
      note="Full booking flow (seat selection → passenger details → checkout → confirmation) ships in Phase 2."
    />
  );
}
