import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/max";
import { z } from "zod";

const namePattern = /^[\p{L}]+(?:\s+[\p{L}]+)*$/u;
const usernamePattern = /^[a-z0-9_]{3,30}$/;
const phoneAllowedCharactersPattern = /^\+?[\d\s()-]+$/;

function toCountryCode(value: string | undefined): CountryCode | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return undefined;
  }

  return normalized as CountryCode;
}

function parsePhone(value: string, countryIso2?: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return parsePhoneNumberFromString(trimmed, toCountryCode(countryIso2));
}

export function normalizePersonName(value: string) {
  const collapsed = value.replaceAll(/\s+/g, " ").trim();
  if (!collapsed) {
    return "";
  }

  const lower = collapsed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function sanitizePersonNameInput(value: string) {
  const onlyLettersAndSpaces = value.replaceAll(/[^\p{L}\s]/gu, "");
  return normalizePersonName(onlyLettersAndSpaces);
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function sanitizeUsernameInput(value: string) {
  return normalizeUsername(value).replaceAll(/[^a-z0-9_]/g, "");
}

export function normalizePhoneNumber(value: string, countryIso2?: string) {
  const parsed = parsePhone(value, countryIso2);

  if (!parsed || !parsed.isValid()) {
    return "";
  }

  return parsed.number;
}

export function sanitizePhoneInput(value: string) {
  return value.replaceAll(/[^\d+]/g, "");
}

export function isStrictPhoneNumberForCountry(value: string, countryIso2?: string) {
  const parsed = parsePhone(value, countryIso2);

  if (!parsed || !parsed.isValid()) {
    return false;
  }

  const expectedCountry = countryIso2?.trim().toLowerCase();
  if (!expectedCountry) {
    return true;
  }

  const parsedCountry = parsed.country?.toLowerCase();
  if (!parsedCountry) {
    return true;
  }

  return parsedCountry === expectedCountry;
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

const phoneInputSchema = z
  .string({ error: "El numero de celular es obligatorio." })
  .trim()
  .min(6, "Ingresa un numero de celular valido.")
  .max(32, "Ingresa un numero de celular valido.")
  .regex(phoneAllowedCharactersPattern, "Solo puedes ingresar numeros en el celular.");

const phoneCountrySchema = z
  .string({ error: "Selecciona un pais." })
  .trim()
  .toLowerCase()
  .regex(/^[a-z]{2}$/, "Selecciona un pais valido.");

function validateStrictPhone(
  phone: string,
  phoneCountry: string,
  ctx: z.RefinementCtx,
  phoneFieldPath: (string | number)[] = ["phone"],
) {
  if (!isStrictPhoneNumberForCountry(phone, phoneCountry)) {
    ctx.addIssue({
      code: "custom",
      path: phoneFieldPath,
      message: "Ingresa un numero valido para el pais seleccionado.",
    });
  }
}

export const passwordSchema = z
  .string({ error: "La contrasena es obligatoria." })
  .min(8, "Debe tener al menos 8 caracteres.")
  .max(64, "Debe tener 64 caracteres o menos.")
  .regex(/[a-z]/, "Incluye al menos una letra minuscula.")
  .regex(/[A-Z]/, "Incluye al menos una letra mayuscula.")
  .regex(/\d/, "Incluye al menos un numero.")
  .regex(/[^A-Za-z0-9]/, "Incluye al menos un simbolo.");

export const registerSchema = z
  .object({
    firstName: personNameSchema,
    lastName: personNameSchema,
    username: usernameSchema,
    email: z
      .string({ error: "El correo es obligatorio." })
      .trim()
      .pipe(z.email({ error: "Ingresa un correo valido." })),
    phone: phoneInputSchema,
    phoneCountry: phoneCountrySchema,
    password: passwordSchema,
    confirmPassword: z
      .string({ error: "Confirma tu contrasena." })
      .min(1, "Confirma tu contrasena."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Las contrasenas no coinciden.",
        path: ["confirmPassword"],
      });
    }

    validateStrictPhone(data.phone, data.phoneCountry, ctx);
  });

export const loginSchema = z.object({
  email: z
    .string({ error: "El correo es obligatorio." })
    .trim()
    .pipe(z.email({ error: "Ingresa un correo valido." })),
  password: z
    .string({ error: "La contrasena es obligatoria." })
    .min(1, "Ingresa tu contrasena."),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ error: "El correo es obligatorio." })
    .trim()
    .pipe(z.email({ error: "Ingresa un correo valido." })),
});

export const forgotPasswordSmsSchema = z
  .object({
    phone: phoneInputSchema,
    phoneCountry: phoneCountrySchema,
  })
  .superRefine((data, ctx) => {
    validateStrictPhone(data.phone, data.phoneCountry, ctx);
  });

export const verifyPasswordResetSmsSchema = z.object({
  phone: phoneInputSchema.refine((value) => Boolean(normalizePhoneNumber(value)), "Ingresa un numero de celular valido."),
  code: z
    .string({ error: "El codigo es obligatorio." })
    .trim()
    .regex(/^\d{6}$/, "Ingresa el codigo de 6 digitos."),
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string({ error: "El token de recuperacion es obligatorio." })
      .trim()
      .min(32, "El token de recuperacion no es valido."),
    password: passwordSchema,
    confirmPassword: z
      .string({ error: "Confirma tu contrasena." })
      .min(1, "Confirma tu contrasena."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Las contrasenas no coinciden.",
        path: ["confirmPassword"],
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ForgotPasswordSmsInput = z.infer<typeof forgotPasswordSmsSchema>;
export type VerifyPasswordResetSmsInput = z.infer<typeof verifyPasswordResetSmsSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const accountVerificationStartSchema = z.object({
  channel: z.enum(["email", "sms"], { error: "Selecciona email o SMS." }),
});

export const verifyAccountVerificationSmsSchema = z.object({
  code: z
    .string({ error: "El codigo es obligatorio." })
    .trim()
    .regex(/^\d{6}$/, "Ingresa el codigo de 6 digitos."),
});

export type AccountVerificationStartInput = z.infer<typeof accountVerificationStartSchema>;
export type VerifyAccountVerificationSmsInput = z.infer<typeof verifyAccountVerificationSmsSchema>;
