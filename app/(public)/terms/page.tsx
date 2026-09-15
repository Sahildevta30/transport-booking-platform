import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={FileText}
      title="Terms of Service"
      description="The terms that govern use of this platform."
      note="Legal copy to be finalized with the project owner before launch."
    />
  );
}
