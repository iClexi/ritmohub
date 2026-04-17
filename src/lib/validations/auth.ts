import { z } from "zod";

const namePattern = /^[\p{L}]+(?:\s+[\p{L}]+)*$/u;
const usernamePattern = /^[a-z0-9_]{3,30}$/;

export function normalizePersonName(value: string) {
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (!collapsed) {
    return "";
  }

  const lower = collapsed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function sanitizePersonNameInput(value: string) {
  const onlyLettersAndSpaces = value.replace(/[^\p{L}\s]/gu, "");
  return normalizePersonName(onlyLettersAndSpaces);
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function sanitizeUsernameInput(value: string) {
  return normalizeUsername(value).replace(/[^a-z0-9_]/g, "");
}

const usernameSchema = z
  .string({ error: "El username es obligatorio." })
  .trim()
  .min(3, "El username debe tener al menos 3 caracteres.")
  .max(30, "El username debe tener maximo 30 caracteres.")
  .regex(usernamePattern, "Solo letras minusculas, numeros y guion bajo (_).")
  .transform(normalizeUsername);

const personNameSchema = z
  .string({ error: "Este campo es obligatorio." })
  .trim()
  .min(2, "Debe tener al menos 2 caracteres.")
  .max(80, "Debe tener maximo 80 caracteres.")
  .regex(namePattern, "Solo se permiten letras.");

const passwordSchema = z
  .string({ error: "La contrasena es obligatoria." })
  .min(8, "Debe tener al menos 8 caracteres.")
  .max(64, "Debe tener 64 caracteres o menos.")
  .regex(/[a-z]/, "Incluye al menos una letra minuscula.")
  .regex(/[A-Z]/, "Incluye al menos una letra mayuscula.")
  .regex(/[0-9]/, "Incluye al menos un numero.")
  .regex(/[^A-Za-z0-9]/, "Incluye al menos un simbolo.");

export const registerSchema = z
  .object({
    firstName: personNameSchema,
    lastName: personNameSchema,
    username: usernameSchema,
    email: z
      .string({ error: "El correo es obligatorio." })
      .trim()
      .email("Ingresa un correo valido."),
    password: passwordSchema,
    confirmPassword: z
      .string({ error: "Confirma tu contrasena." })
      .min(1, "Confirma tu contrasena."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las contrasenas no coinciden.",
        path: ["confirmPassword"],
      });
    }
  });

export const loginSchema = z.object({
  email: z
    .string({ error: "El correo es obligatorio." })
    .trim()
    .email("Ingresa un correo valido."),
  password: z
    .string({ error: "La contrasena es obligatoria." })
    .min(1, "Ingresa tu contrasena."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;