const PDF_MIME = "application/pdf";
const DOC_MIME = "application/msword";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const CV_MIME_BY_EXTENSION = new Map([
  [".pdf", PDF_MIME],
  [".doc", DOC_MIME],
  [".docx", DOCX_MIME],
]);

function startsWith(data: Buffer, signature: number[]) {
  return (
    data.length >= signature.length &&
    signature.every((value, index) => data[index] === value)
  );
}

function hasAsciiAt(data: Buffer, value: string, offset: number) {
  return data.length >= offset + value.length && data.subarray(offset, offset + value.length).toString("ascii") === value;
}

function isIsoBaseMedia(data: Buffer) {
  return data.length >= 12 && hasAsciiAt(data, "ftyp", 4);
}

function isPdf(data: Buffer) {
  return (
    data.length >= 16 &&
    hasAsciiAt(data, "%PDF-", 0) &&
    data.lastIndexOf(Buffer.from("%%EOF")) >= 0
  );
}

function isLegacyWord(data: Buffer) {
  return (
    data.length >= 512 &&
    startsWith(data, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
  );
}

function isDocx(data: Buffer) {
  const isZip =
    startsWith(data, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(data, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(data, [0x50, 0x4b, 0x07, 0x08]);

  return (
    isZip &&
    data.indexOf(Buffer.from("[Content_Types].xml")) >= 0 &&
    data.indexOf(Buffer.from("word/")) >= 0
  );
}

export function mimeMatchesFileSignature(data: Buffer, mimeType: string) {
  const mime = mimeType.trim().toLowerCase();

  switch (mime) {
    case "image/jpeg":
      return data.length >= 4 && startsWith(data, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/gif":
      return data.length >= 13 && (hasAsciiAt(data, "GIF87a", 0) || hasAsciiAt(data, "GIF89a", 0));
    case "image/webp":
      return data.length >= 16 && hasAsciiAt(data, "RIFF", 0) && hasAsciiAt(data, "WEBP", 8);
    case "video/mp4":
    case "audio/mp4":
      return isIsoBaseMedia(data);
    case "video/quicktime":
      return isIsoBaseMedia(data) && hasAsciiAt(data, "qt  ", 8);
    case "video/webm":
    case "audio/webm":
      return startsWith(data, [0x1a, 0x45, 0xdf, 0xa3]);
    case "audio/mpeg":
      return (
        hasAsciiAt(data, "ID3", 0) ||
        (data.length >= 2 && data[0] === 0xff && (data[1] & 0xe0) === 0xe0)
      );
    case "audio/ogg":
      return hasAsciiAt(data, "OggS", 0);
    case "audio/wav":
      return data.length >= 12 && hasAsciiAt(data, "RIFF", 0) && hasAsciiAt(data, "WAVE", 8);
    case PDF_MIME:
      return isPdf(data);
    case DOC_MIME:
      return isLegacyWord(data);
    case DOCX_MIME:
      return isDocx(data);
    default:
      return false;
  }
}

export function validateCvFile(input: {
  fileName: string;
  mimeType: string;
  data: Buffer;
}) {
  const normalizedName = input.fileName.trim().toLowerCase();
  const extension = [...CV_MIME_BY_EXTENSION.keys()].find((candidate) =>
    normalizedName.endsWith(candidate),
  );

  if (!extension) {
    return { ok: false as const, message: "El CV debe tener extension PDF, DOC o DOCX." };
  }

  const expectedMime = CV_MIME_BY_EXTENSION.get(extension);
  const declaredMime = input.mimeType.trim().toLowerCase();
  if (!expectedMime || declaredMime !== expectedMime) {
    return { ok: false as const, message: "La extension y el tipo declarado del CV no coinciden." };
  }

  if (!mimeMatchesFileSignature(input.data, declaredMime)) {
    return { ok: false as const, message: "El contenido del CV no coincide con un PDF o Word valido." };
  }

  return { ok: true as const, mimeType: declaredMime };
}
