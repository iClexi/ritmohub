import type { Metadata } from "next";

import { LandingShowcase } from "@/components/home/landing-showcase";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const user = await getCurrentUser();

  return <LandingShowcase user={user} />;
}
