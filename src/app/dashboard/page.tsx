import { IndexWorkspace } from "@/components/home/index-workspace";
import { requireUser } from "@/lib/auth/current-user";

export default async function DashboardPage() {
  const user = await requireUser();

  return <IndexWorkspace user={user} />;
}
