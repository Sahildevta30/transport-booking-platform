import type { Metadata } from "next";
import { Ticket } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "My Bookings" };

export default function CustomerBookingsPage() {
  return (
    <PagePlaceholder
      icon={Ticket}
      title="My Bookings"
      description="Every trip you've booked, its status, and live tracking will show up here."
      note="Connected to real bookings once the booking engine ships in Phase 2."
    />
  );
}
