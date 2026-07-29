import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { getSessionFromCookie } from "@/lib/auth/session";
import { createJobRecord, listJobApplicationsByUser, listJobs } from "@/lib/db";
import { createJobSchema } from "@/lib/validations/workspace";

export async function GET() {
  const sessionPayload = await getSessionFromCookie();
  const jobs = await listJobs();

  if (!sessionPayload) {
    return NextResponse.json({ jobs, applications: [] });
  }

  return NextResponse.json({
    jobs,
    applications: await listJobApplicationsByUser(sessionPayload.session.user.id),
  });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const parsed = createJobSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Revisa los datos de la oportunidad.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const job = await createJobRecord({
      ...parsed.data,
      posterUserId: guard.userId,
    });
    return NextResponse.json({ message: "Oportunidad publicada.", job });
  } catch (err) {
    console.error("create job error", err);
    return NextResponse.json({ message: "No pudimos crear la oportunidad." }, { status: 500 });
  }
}
