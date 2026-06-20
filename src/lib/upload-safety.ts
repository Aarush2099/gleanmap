// Client-side upload safety: MIME/size validation + EXIF/GPS metadata stripping.
// Storage RLS still enforces per-user folder isolation server-side.

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
]);

export class UploadValidationError extends Error {}

// Strip EXIF/APPn (incl. GPS) segments from a JPEG by walking markers.
// Returns a new Blob with only image data. For non-JPEG, returns the
// original blob (PNG/WebP metadata is removed by the canvas re-encode path
// below for images, and PDFs/text are passed through).
async function stripJpegMetadata(buf: ArrayBuffer): Promise<Blob> {
  const view = new DataView(buf);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
    return new Blob([buf], { type: "image/jpeg" });
  }
  const out: number[] = [0xff, 0xd8];
  let i = 2;
  while (i < view.byteLength) {
    if (view.getUint8(i) !== 0xff) break;
    const marker = view.getUint8(i + 1);
    // SOS — copy the rest verbatim
    if (marker === 0xda) {
      for (let k = i; k < view.byteLength; k++) out.push(view.getUint8(k));
      break;
    }
    const segLen = view.getUint16(i + 2);
    // Drop APP0–APP15 (0xE0–0xEF) and COM (0xFE) — that includes EXIF/GPS/XMP/IPTC.
    const isMeta = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe;
    if (!isMeta) {
      for (let k = i; k < i + 2 + segLen; k++) out.push(view.getUint8(k));
    }
    i += 2 + segLen;
  }
  return new Blob([new Uint8Array(out)], { type: "image/jpeg" });
}

// Re-encode PNG/WebP through a canvas to drop ancillary chunks (tEXt, eXIf, etc.).
async function reencodeImage(file: File, mime: string): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0);
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b ?? file), mime, 0.92),
    );
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function sanitizeUpload(file: File): Promise<File> {
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadValidationError(`File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB)`);
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new UploadValidationError(`File type not allowed: ${file.type || "unknown"}`);
  }
  if (file.type === "image/jpeg") {
    const buf = await file.arrayBuffer();
    const stripped = await stripJpegMetadata(buf);
    return new File([stripped], file.name, { type: "image/jpeg" });
  }
  if (file.type === "image/png" || file.type === "image/webp") {
    const blob = await reencodeImage(file, file.type);
    return new File([blob], file.name, { type: file.type });
  }
  return file;
}
