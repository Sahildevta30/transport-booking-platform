import type { Metadata } from "next";
import { Info } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "About Us",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={Info}
      title="About Us"
      description="Who we are and what this platform is built to do."
      note=""
    />
  );
}
