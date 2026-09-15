import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Settings",
};

export default function Page() {
  return (
    <PagePlaceholder
      icon={Settings}
      title="Settings"
      description="Admin users, roles and permissions, site settings, and audit logs."
      note="Ships alongside the roles/permissions domain in Phase 2."
    />
  );
}
