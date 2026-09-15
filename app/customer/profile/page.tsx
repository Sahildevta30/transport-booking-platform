import type { Metadata } from "next";
import { User } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata: Metadata = { title: "Profile" };

export default function CustomerProfilePage() {
  return (
    <PagePlaceholder
      icon={User}
      title="Profile"
      description="Manage your name, contact details, and account preferences."
      note="Editable profile form ships once the profiles table lands in Phase 2."
    />
  );
}
