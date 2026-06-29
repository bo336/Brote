/**
 * Client-side image compression for verification photo uploads (§11.3).
 * Downscales to a max edge and re-encodes as JPEG to keep Storage + Gemini
 * payloads small. Returns the original file on any failure (never blocks).
 */
export async function compressImage(
  file: File,
  maxEdge = 1280,
  quality = 0.8,
): Promise<Blob> {
  try {
    if (typeof document === 'undefined') return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
