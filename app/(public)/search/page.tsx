import type { Metadata } from "next";
import { SearchIcon } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Search Trips",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={SearchIcon}
      title="Search Trips"
      description="Search real-time routes, schedules, and availability across every vehicle type."
      note="Search engine ships in Phase 2, wired to real routes and schedules."
    />
  );
}
