import type { Metadata } from "next";
import { Users } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Customers",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={Users}
      title="Customers"
      description="Look up customer accounts and their booking history."
      note="Ships once the profiles domain exists."
    />
  );
}
