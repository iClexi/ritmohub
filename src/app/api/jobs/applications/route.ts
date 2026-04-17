import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import { createJobApplication } from "@/lib/db";
import { applyJobFormDataSchema, applyJobSchema } from "@/lib/validations/workspace";

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    let jobId = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const rawCv = formData.get("cv");

      if (rawCv !== null && !(rawCv instanceof File)) {
        return NextResponse.json(
          {
            message: "Solicitud invalida.",
            errors: { cv: ["CV inválido."] },
          },
          { status: 400 },
        );
      }

      const parsed = applyJobFormDataSchema.safeParse({
        jobId: formData.get("jobId"),
        cv: rawCv instanceof File ? rawCv : undefined,
      });

      if (!parsed.success) {
        return NextResponse.json(
          {
            message: "Solicitud invalida.",
            errors: parsed.error.flatten().fieldErrors,
          },
          { status: 400 },
        );
      }

      jobId = parsed.data.jobId;
    } else {
      const body = await request.json().catch(() => null);
      const parsed = applyJobSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            message: "Solicitud invalida.",
            errors: parsed.error.flatten().fieldErrors,
          },
          { status: 400 },
        );
      }

      jobId = parsed.data.jobId;
    }

    const application = await createJobApplication({
      jobId,
      userId: sessionPayload.session.user.id,
      status: "applied",
    });

    if (!application) {
      return NextResponse.json({ message: "Trabajo no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ message: "Postulacion enviada.", application });
  } catch (error) {
    console.error("job application error", error);
    return NextResponse.json({ message: "No pudimos registrar la postulacion." }, { status: 500 });
  }
}
