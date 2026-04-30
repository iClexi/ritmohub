import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/admin-guard";
import { getSessionFromCookie } from "@/lib/auth/session";
import { createJobRecord, listJobApplicationsByUser, listJobs } from "@/lib/db";

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
    const body = await request.json();
    if (!body?.title || !body?.city) {
      return NextResponse.json({ message: "Titulo y ciudad son requeridos." }, { status: 400 });
    }
    const job = await createJobRecord({
      title: String(body.title),
      type: String(body.type ?? "Evento"),
      city: String(body.city),
      imageUrl: String(body.imageUrl ?? "https://source.unsplash.com/900x600/?music,musician"),
      pay: String(body.pay ?? "A convenir"),
      summary: String(body.summary ?? ""),
      description: body.description ? String(body.description) : "",
      requiresCv: Boolean(body.requiresCv),
      requesterName: body.requesterName ? String(body.requesterName) : "",
      requesterRole: body.requesterRole ? String(body.requesterRole) : "",
      requirements: Array.isArray(body.requirements) ? body.requirements.map(String) : [],
      deadline: body.deadline ? String(body.deadline) : "",
      posterUserId: guard.userId,
    });
    return NextResponse.json({ message: "Oportunidad publicada.", job });
  } catch (err) {
    console.error("create job error", err);
    return NextResponse.json({ message: "No pudimos crear la oportunidad." }, { status: 500 });
  }
}
