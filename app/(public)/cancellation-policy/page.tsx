import type { Metadata } from "next";
import { RotateCcw } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Cancellation Policy",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={RotateCcw}
      title="Cancellation Policy"
      description="Rules and timelines for cancelling or refunding a booking."
      note="Finalized once the refunds domain and payment provider are selected."
    />
  );
}
