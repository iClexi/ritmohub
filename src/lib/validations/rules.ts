// Shared validation patterns and field-level validator.
// Safe to import in both server (Zod schemas) and client (React components).

export const patterns = {
  /** Letters (incl. accented), numbers, spaces and basic punctuation .,'-() */
  name: /^[\p{L}\p{N} .,'\-()\u00C0-\u024F]+$/u,
  /** Letters + spaces + hyphens/commas – good for location, city, studies */
  location: /^[\p{L} .,\-]+$/u,
  /** Musical key: C, Am, F#, Bb, Gmaj7 etc. */
  musicalKey: /^[A-Ga-g][#b]?(?:m|maj|min|dim|aug|sus2|sus4)?(?:7|9|11|13)?$/,
  /** Instagram/social handle (with or without leading @) */
  handle: /^@?[a-zA-Z0-9_.]{1,60}$/,
  /** Numeric string – digits only */
  numeric: /^\d+$/,
  /** URL – must start with https:// */
  url: /^https:\/\/.{3,}$/,
};

export type FieldRule =
  | { type: "required"; message: string }
  | { type: "min"; value: number; message: string }
  | { type: "max"; value: number; message: string }
  | { type: "pattern"; regex: RegExp; message: string }
  | { type: "numeric"; message: string }
  | { type: "url"; message: string }
  | { type: "email"; message: string }
  | { type: "range"; min: number; max: number; message: string };

/** Run a list of rules against a value. Returns first error message or null. */
export function validateField(value: string, rules: FieldRule[]): string | null {
  const v = value.trim();
  for (const rule of rules) {
    switch (rule.type) {
      case "required":
        if (!v) return rule.message;
        break;
      case "min":
        if (v.length < rule.value) return rule.message;
        break;
      case "max":
        if (v.length > rule.value) return rule.message;
        break;
      case "pattern":
        if (v && !rule.regex.test(v)) return rule.message;
        break;
      case "numeric":
        if (v && !/^\d+$/.test(v)) return rule.message;
        break;
      case "url":
        if (v && !/^https:\/\/.{3,}$/.test(v)) return rule.message;
        break;
      case "email":
        if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return rule.message;
        break;
      case "range": {
        const n = Number(v);
        if (v && (Number.isNaN(n) || n < rule.min || n > rule.max)) return rule.message;
        break;
      }
    }
  }
  return null;
}

// ── Pre-built rule sets for reuse across forms ───────────────────────────────

export const nameRules: FieldRule[] = [
  { type: "required", message: "El nombre es obligatorio." },
  { type: "min", value: 2, message: "Al menos 2 caracteres." },
  { type: "max", value: 80, message: "Máximo 80 caracteres." },
  { type: "pattern", regex: patterns.name, message: "Solo letras, números y signos básicos." },
];

export const titleRules: FieldRule[] = [
  { type: "required", message: "El título es obligatorio." },
  { type: "min", value: 3, message: "Al menos 3 caracteres." },
  { type: "max", value: 120, message: "Máximo 120 caracteres." },
];

export const urlRules: FieldRule[] = [
  { type: "url", message: "Debe ser una URL válida que empiece con https://." },
  { type: "max", value: 400, message: "URL demasiado larga." },
];

export const optionalUrlRules: FieldRule[] = [
  { type: "url", message: "Debe ser una URL válida que empiece con https://." },
  { type: "max", value: 400, message: "URL demasiado larga." },
];

export const capacityRules: FieldRule[] = [
  { type: "required", message: "La capacidad es obligatoria." },
  { type: "numeric", message: "Solo se permiten números." },
  { type: "min", value: 1, message: "Ingresa la capacidad." },
  { type: "max", value: 10, message: "Número demasiado largo." },
];

export const bpmRules: FieldRule[] = [
  { type: "required", message: "El tempo es obligatorio." },
  { type: "numeric", message: "Solo se permiten números." },
  { type: "range", min: 40, max: 240, message: "El BPM debe estar entre 40 y 240." },
];

export const handleRules: FieldRule[] = [
  { type: "pattern", regex: patterns.handle, message: "Solo letras, números, puntos y guiones bajos." },
  { type: "max", value: 80, message: "Máximo 80 caracteres." },
];

export const locationRules: FieldRule[] = [
  { type: "pattern", regex: patterns.location, message: "Solo letras, espacios y guiones." },
  { type: "max", value: 80, message: "Máximo 80 caracteres." },
];

export const cityRules: FieldRule[] = [
  { type: "required", message: "La ciudad es obligatoria." },
  { type: "pattern", regex: patterns.location, message: "Solo letras, espacios y guiones." },
  { type: "min", value: 2, message: "Al menos 2 caracteres." },
  { type: "max", value: 80, message: "Máximo 80 caracteres." },
];

export const venueRules: FieldRule[] = [
  { type: "required", message: "El venue es obligatorio." },
  { type: "min", value: 2, message: "Al menos 2 caracteres." },
  { type: "max", value: 120, message: "Máximo 120 caracteres." },
  { type: "pattern", regex: patterns.name, message: "Solo letras, números y signos básicos." },
];

export const instrumentRules: FieldRule[] = [
  { type: "pattern", regex: patterns.name, message: "Solo letras, números y signos básicos." },
  { type: "max", value: 80, message: "Máximo 80 caracteres." },
];

export const musicalKeyRules: FieldRule[] = [
  { type: "required", message: "La tonalidad es obligatoria." },
  { type: "pattern", regex: patterns.musicalKey, message: "Ej: C, Am, F#, Bb, Gmaj7." },
  { type: "max", value: 12, message: "Máximo 12 caracteres." },
];
