import { z } from "zod";

import { patterns } from "./rules";

const optionalUrl = z
  .string()
  .trim()
  .max(400, "URL demasiado larga.")
  .refine((v) => !v || /^https:\/\/.{3,}$/.test(v), {
    message: "Debe ser una URL que empiece con https://.",
  })
  .optional()
  .default("");

export const updateProfileSchema = z.object({
  name: z
    .string({ error: "El nombre es obligatorio." })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80, "El nombre debe tener máximo 80 caracteres.")
    .regex(patterns.name, "Solo se permiten letras, números y signos básicos."),

  bio: z
    .string()
    .trim()
    .max(300, "La bio puede tener máximo 300 caracteres.")
    .optional()
    .default(""),

  musicianType: z.string().trim().max(60).optional().default(""),

  primaryInstrument: z
    .string()
    .trim()
    .max(60, "El instrumento puede tener máximo 60 caracteres.")
    .regex(/^[\p{L}\p{N} .,'()-]*$/u, "Solo letras, números y signos básicos.")
    .optional()
    .default(""),

  orientation: z.string().trim().max(60).optional().default(""),

  studies: z
    .string()
    .trim()
    .max(120, "Los estudios pueden tener máximo 120 caracteres.")
    .regex(/^[\p{L}\p{N} .,'()\n-]*$/u, "Solo letras, números y signos básicos.")
    .optional()
    .default(""),

  avatarUrl: z.string().trim().max(500).optional().default(""),
  coverUrl: z.string().trim().max(500).optional().default(""),

  websiteUrl: z
    .string()
    .trim()
    .max(200, "URL demasiado larga.")
    .refine((v) => !v || /^https?:\/\/.{3,}$/.test(v), {
      message: "Debe ser una URL válida (https://...).",
    })
    .optional()
    .default(""),

  location: z
    .string()
    .trim()
    .max(80, "Máximo 80 caracteres.")
    .regex(/^[\p{L} .,-]*$/u, "Solo letras, espacios y guiones.")
    .optional()
    .default(""),

  socialInstagram: z
    .string()
    .trim()
    .max(80, "Máximo 80 caracteres.")
    .regex(/^@?[a-zA-Z0-9_.]*$/, "Solo letras, números, puntos y guiones bajos.")
    .optional()
    .default(""),

  socialSpotify: optionalUrl,
  socialYoutube: optionalUrl,

  stageName: z
    .string()
    .trim()
    .max(60, "El nombre artístico puede tener máximo 60 caracteres.")
    .regex(/^[\p{L}\p{N} .,'()-]*$/u, "Solo letras, números y signos básicos.")
    .optional()
    .default(""),

  genre: z
    .string()
    .trim()
    .max(60, "El género puede tener máximo 60 caracteres.")
    .regex(/^[\p{L}\p{N} .,'&/-]*$/u, "Solo letras, números y signos básicos.")
    .optional()
    .default(""),

  tagline: z
    .string()
    .trim()
    .max(140, "La frase puede tener máximo 140 caracteres.")
    .optional()
    .default(""),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
