import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={Mail}
      title="Contact Us"
      description="Get in touch with our support team."
      note=""
    />
  );
}
