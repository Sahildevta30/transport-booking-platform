import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={ShieldCheck}
      title="Privacy Policy"
      description="How we collect, use, and protect your data."
      note="Legal copy to be finalized with the project owner before launch."
    />
  );
}
