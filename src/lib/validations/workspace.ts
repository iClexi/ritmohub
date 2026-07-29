import { z } from "zod";

z.config({ jitless: true });

import {
  isSafeHttpsUrl,
  isSafeStoredImageUrl,
  isSafeWebUrl,
  isSafeYouTubeVideoUrl,
} from "@/lib/security/url";

import { patterns } from "./rules";

export const concertStatusSchema = z.enum(["lead", "negotiation", "confirmed", "post_show"]);
const hasLetterRegex = /\p{L}/u;

export const createConcertSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(120, "Máximo 120 caracteres.")
    .regex(patterns.name, "Solo letras, números y signos básicos.")
    .refine((value) => hasLetterRegex.test(value), {
      message: "El título no puede contener solo números.",
    }),

  date: z
    .string()
    .trim()
    .min(8, "La fecha es obligatoria.")
    .max(64),

  venue: z
    .string()
    .trim()
    .min(2, "El venue debe tener al menos 2 caracteres.")
    .max(120, "Máximo 120 caracteres.")
    .regex(patterns.name, "Solo letras, números y signos básicos.")
    .refine((value) => hasLetterRegex.test(value), {
      message: "El venue no puede contener solo números.",
    }),

  city: z
    .string()
    .trim()
    .min(2, "La ciudad debe tener al menos 2 caracteres.")
    .max(80, "Máximo 80 caracteres.")
    .regex(patterns.location, "Solo letras, espacios y guiones.")
    .refine((value) => hasLetterRegex.test(value), {
      message: "La ciudad no puede contener solo números.",
    }),

  flyerUrl: z
    .string()
    .trim()
    .refine((v) => !v || isSafeStoredImageUrl(v), {
      message: "Debe ser una URL https:// o una ruta interna de uploads.",
    })
    .optional()
    .default(""),

  ticketUrl: z
    .string()
    .trim()
    .refine((v) => !v || isSafeHttpsUrl(v), {
      message: "Debe ser una URL que empiece con https://.",
    })
    .optional()
    .default(""),

  capacity: z
    .string()
    .trim()
    .min(1, "La capacidad es obligatoria.")
    .max(10, "Número demasiado largo.")
    .regex(/^[1-9]\d*$/, "La capacidad debe ser un número entero positivo."),
});

export const updateConcertStatusSchema = z.object({
  status: concertStatusSchema,
});

export const forumCategorySchema = z.enum([
  "General",
  "Produccion",
  "Conciertos",
  "Colaboraciones",
  "Gear",
]);

export const createForumPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, "El título debe tener al menos 8 caracteres.")
    .max(140, "Máximo 140 caracteres."),

  body: z
    .string()
    .trim()
    .min(20, "El contenido debe tener al menos 20 caracteres.")
    .max(2000, "Máximo 2000 caracteres."),

  category: forumCategorySchema,

  mediaType: z.enum(["none", "image", "video", "audio"]).default("none"),

  mediaUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => !v || isSafeStoredImageUrl(v), {
      message: "Debe ser una URL https:// o una ruta interna de uploads.",
    })
    .optional()
    .default(""),

  linkUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => !v || isSafeWebUrl(v), {
      message: "Debe ser una URL válida.",
    })
    .optional()
    .default(""),
}).superRefine((value, ctx) => {
  if (value.mediaType !== "none" && !value.mediaUrl) {
    ctx.addIssue({
      code: "custom",
      message: "Debes indicar el enlace del recurso multimedia.",
      path: ["mediaUrl"],
    });
  }
});

export const createForumCommentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(3, "El comentario debe tener al menos 3 caracteres.")
    .max(600, "Máximo 600 caracteres."),
});

export const createChatMessageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "El mensaje no puede estar vacío.")
    .max(1200, "Máximo 1200 caracteres."),
});

export const markChatReadSchema = z.object({
  threadId: z.string().trim().pipe(z.uuid()),
});

const entityIdSchema = z.string().trim().min(2).max(64);

export const createBandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre de la banda debe tener al menos 2 caracteres.")
    .max(80, "El nombre de la banda debe tener máximo 80 caracteres.")
    .regex(patterns.name, "Solo letras, números y signos básicos."),
});

export const deleteBandSchema = z.object({
  action: z.enum(["leave", "disband"]),
  bandId: entityIdSchema,
});

export const updateSoloModeSchema = z.object({
  isSolo: z.boolean(),
});

export const updateBandBrandingSchema = z.object({
  bandId: z.string().trim().min(2).max(64),
  name: z.string().trim().min(2).max(80).regex(patterns.name, "Solo letras, números y signos básicos.").optional(),
  genre: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  logoUrl: z.string().trim().max(400).refine((v) => !v || isSafeStoredImageUrl(v), {
    message: "El logo debe usar HTTPS o una subida interna válida.",
  }).optional(),
  bannerUrl: z.string().trim().max(400).refine((v) => !v || isSafeStoredImageUrl(v), {
    message: "El banner debe usar HTTPS o una subida interna válida.",
  }).optional(),
  bannerFit: z.enum(["cover", "contain"]).optional(),
});

export const sendBandInvitationSchema = z.object({
  userId: entityIdSchema,
});

export const respondBandInvitationSchema = z.object({
  accept: z.boolean(),
});

export const createDirectChatThreadSchema = z.object({
  contactUserId: entityIdSchema,
});

export const createGroupChatSchema = z.object({
  groupName: z
    .string()
    .trim()
    .min(2, "El nombre del grupo debe tener al menos 2 caracteres.")
    .max(80, "El nombre del grupo debe tener máximo 80 caracteres."),
  memberUserIds: z.array(entityIdSchema).max(50).optional().default([]),
});

export const forumVoteSchema = z.object({
  direction: z.enum(["up", "down", "none"]),
});

export const applyJobSchema = z.object({
  jobId: entityIdSchema,
});

const MAX_CV_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_CV_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const applyJobFormDataSchema = z
  .object({
    jobId: entityIdSchema,
    cv: z
      .custom<File>((value) => value instanceof File, "CV inválido.")
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.cv) {
      return;
    }

    if (value.cv.size <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "El CV está vacío.",
        path: ["cv"],
      });
    }

    if (value.cv.size > MAX_CV_FILE_SIZE_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: "El CV supera el límite de 10 MB.",
        path: ["cv"],
      });
    }

    if (!ALLOWED_CV_MIME_TYPES.includes(value.cv.type as (typeof ALLOWED_CV_MIME_TYPES)[number])) {
      ctx.addIssue({
        code: "custom",
        message: "Formato de CV inválido. Usa PDF, DOC o DOCX.",
        path: ["cv"],
      });
    }
  });

const MAX_AVATAR_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FORUM_UPLOAD_SIZE_BYTES = 80 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const ALLOWED_FORUM_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
] as const;

export const avatarUploadSchema = z
  .object({
    file: z.custom<File>((value) => value instanceof File, "No se recibio ninguna imagen."),
    kind: z.enum(["avatar", "cover", "band-logo", "band-banner", "concert-flyer"]).default("avatar"),
  })
  .superRefine((value, ctx) => {
    const mime = value.file.type.toLowerCase();

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mime as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      ctx.addIssue({
        code: "custom",
        message: "Solo se permiten imagenes JPG, PNG, WebP o GIF.",
        path: ["file"],
      });
    }

    if (value.file.size <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "La imagen esta vacia.",
        path: ["file"],
      });
    }

    if (value.file.size > MAX_AVATAR_UPLOAD_SIZE_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: "La imagen supera el limite de 5 MB.",
        path: ["file"],
      });
    }
  });

export const forumUploadSchema = z
  .object({
    file: z.custom<File>((value) => value instanceof File, "No se recibio ningun archivo."),
  })
  .superRefine((value, ctx) => {
    if (value.file.size <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "El archivo esta vacio.",
        path: ["file"],
      });
    }

    if (value.file.size > MAX_FORUM_UPLOAD_SIZE_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: "El archivo supera el limite permitido (80 MB).",
        path: ["file"],
      });
    }

    const mime = value.file.type.toLowerCase();

    if (!ALLOWED_FORUM_MIME_TYPES.includes(mime as (typeof ALLOWED_FORUM_MIME_TYPES)[number])) {
      ctx.addIssue({
        code: "custom",
        message: "Formato no compatible. Usa JPG, PNG, WebP, GIF, MP4, WebM, MOV, MP3, M4A, OGG o WAV.",
        path: ["file"],
      });
    }
  });

export const createCourseCheckoutSchema = z.object({
  courseId: z.string().trim().min(2).max(64),
  provider: z.literal("stripe"),
});

export const confirmCourseCheckoutSchema = z.object({
  purchaseId: z.string().trim().pipe(z.uuid()),
  provider: z.literal("stripe"),
  sessionId: z.string().trim().min(8).max(255).regex(/^cs_(?:test|live)_[A-Za-z0-9]+$/),
});

const courseBaseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  instructor: z.string().trim().min(2).max(120),
  level: z.enum(["Básico", "Intermedio", "Avanzado"]),
  imageUrl: z.string().trim().max(1000).refine(isSafeHttpsUrl, {
    message: "La imagen debe usar una URL HTTPS válida.",
  }),
  summary: z.string().trim().min(3).max(4000),
  priceUsd: z.coerce.number().finite().min(0.5).max(10_000),
});

export const createCourseSchema = courseBaseSchema;
export const updateCourseSchema = courseBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "No hay cambios válidos." },
);

const courseModuleBaseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  lessonType: z.enum(["video", "reading", "practice"]),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  content: z.string().trim().min(1).max(20_000),
  videoUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((value) => !value || isSafeYouTubeVideoUrl(value), {
      message: "El video debe ser una URL HTTPS válida de YouTube.",
    })
    .default(""),
});

export const createCourseModuleSchema = courseModuleBaseSchema;
export const updateCourseModuleSchema = courseModuleBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "No hay cambios válidos." },
);

export const createJobSchema = z.object({
  title: z.string().trim().min(3).max(160),
  type: z.string().trim().min(2).max(80).default("Evento"),
  city: z.string().trim().min(2).max(80),
  imageUrl: z.string().trim().max(1000).refine(isSafeHttpsUrl, {
    message: "La imagen debe usar una URL HTTPS válida.",
  }).default("https://source.unsplash.com/900x600/?music,musician"),
  pay: z.string().trim().min(1).max(120).default("A convenir"),
  summary: z.string().trim().max(1000).default(""),
  description: z.string().trim().max(10_000).default(""),
  requiresCv: z.boolean().default(false),
  requesterName: z.string().trim().max(120).default(""),
  requesterRole: z.string().trim().max(120).default(""),
  requirements: z.array(z.string().trim().min(1).max(240)).max(30).default([]),
  deadline: z.string().trim().max(64).default(""),
});
