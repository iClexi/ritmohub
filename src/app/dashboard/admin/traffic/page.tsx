import { redirect } from "next/navigation";

import { AdminTrafficPanel } from "@/components/admin/admin-traffic-panel";
import { requireUser } from "@/lib/auth/current-user";

export default async function AdminTrafficPage() {
  const user = await requireUser();

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminTrafficPanel />;
}
