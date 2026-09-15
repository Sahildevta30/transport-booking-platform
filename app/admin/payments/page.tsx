import type { Metadata } from "next";
import { CreditCard } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Payments",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={CreditCard}
      title="Payments"
      description="Track payments and process refunds."
      note="Payment provider stays abstract until a provider is chosen (see docs/architecture/backend-architecture.md)."
    />
  );
}
