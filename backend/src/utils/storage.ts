import multer from 'multer';
import { randomUUID } from 'crypto';

// Allowlist of raster image MIME types. SVG is excluded deliberately — it can
// carry inline <script> tags which would execute when the file is loaded via
// the public Supabase URL.
export const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

function safeExtension(originalName: string, mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
    'image/gif':  'gif',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  if (map[mimeType]) return map[mimeType];
  const raw = originalName.split('.').pop()?.toLowerCase() ?? '';
  // Reject anything that isn't a recognised image extension.
  return ['jpg','jpeg','png','webp','gif','heic','heif'].includes(raw) ? raw : 'jpg';
}

export const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, GIF, or HEIC images are allowed'));
    }
  },
});

export async function uploadToSupabase(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  bucket = 'design-ideas'
): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)');
  }

  // Never trust the user-supplied filename — use a UUID + safe extension only.
  const ext = safeExtension(originalName, mimeType);
  const path = `uploads/${Date.now()}-${randomUUID()}.${ext}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Storage upload failed: ${err}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
