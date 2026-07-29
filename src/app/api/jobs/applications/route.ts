import { NextResponse } from "next/server";

import { getSessionFromCookie } from "@/lib/auth/session";
import {
  createJobApplication,
  createMediaUploadRecord,
  getJobApplicationByJobAndUser,
  getJobById,
} from "@/lib/db";
import { requestContentLengthExceeds } from "@/lib/security/request-limits";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { rateLimitExceededResponse } from "@/lib/security/rate-limit-response";
import { validateCvFile } from "@/lib/uploads/file-signatures";
import { applyJobFormDataSchema, applyJobSchema } from "@/lib/validations/workspace";

export async function POST(request: Request) {
  const sessionPayload = await getSessionFromCookie();

  if (!sessionPayload) {
    return NextResponse.json({ message: "Debes iniciar sesion." }, { status: 401 });
  }

  if (requestContentLengthExceeds(request, 12 * 1024 * 1024)) {
    return NextResponse.json({ message: "La solicitud supera el limite permitido." }, { status: 413 });
  }

  const rateLimit = consumeRateLimit({
    key: `jobs:apply:${sessionPayload.session.user.id}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    let jobId = "";
    let cvFile: File | null = null;

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
      cvFile = parsed.data.cv ?? null;
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

    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ message: "Trabajo no encontrado." }, { status: 404 });
    }

    const existing = await getJobApplicationByJobAndUser({
      jobId,
      userId: sessionPayload.session.user.id,
    });
    if (existing && (!job.requiresCv || existing.cvUrl)) {
      return NextResponse.json({ message: "Ya habias enviado esta postulacion.", application: existing });
    }

    if (job.requiresCv && !cvFile) {
      return NextResponse.json(
        { message: "Este trabajo requiere adjuntar un CV.", errors: { cv: ["Adjunta un CV."] } },
        { status: 400 },
      );
    }

    let cvUploadId: string | undefined;
    if (cvFile) {
      const binary = Buffer.from(await cvFile.arrayBuffer());
      const validation = validateCvFile({
        fileName: cvFile.name,
        mimeType: cvFile.type,
        data: binary,
      });
      if (!validation.ok) {
        return NextResponse.json(
          { message: validation.message, errors: { cv: [validation.message] } },
          { status: 400 },
        );
      }

      const stored = await createMediaUploadRecord({
        userId: sessionPayload.session.user.id,
        kind: "cv",
        mimeType: validation.mimeType,
        sizeBytes: binary.length,
        data: binary,
      });
      cvUploadId = stored.id;
    }

    const application = await createJobApplication({
      jobId,
      userId: sessionPayload.session.user.id,
      status: "applied",
      cvUploadId,
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
