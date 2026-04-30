import { LandingShowcase } from "@/components/home/landing-showcase";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function Home() {
  const user = await getCurrentUser();

  return <LandingShowcase user={user} />;
}
