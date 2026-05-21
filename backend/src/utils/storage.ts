import multer from 'multer';
import { randomUUID } from 'crypto';

export const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
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

  const ext = originalName.split('.').pop() || 'jpg';
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
