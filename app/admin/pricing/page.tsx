import type { Metadata } from "next";
import { Tag } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Pricing",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={Tag}
      title="Pricing"
      description="Configure pricing rules and coupons."
      note="Ships with the pricing domain in Phase 2."
    />
  );
}
