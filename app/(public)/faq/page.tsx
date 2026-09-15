import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={HelpCircle}
      title="Frequently Asked Questions"
      description="Answers to common questions about booking, cancellations, and payments."
      note=""
    />
  );
}
