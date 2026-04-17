import { redirect } from "next/navigation";

import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { requireUser } from "@/lib/auth/current-user";

export default async function AdminUsersPage() {
  const user = await requireUser();

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminUsersPanel />;
}
