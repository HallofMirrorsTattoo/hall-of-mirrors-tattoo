import { google } from 'googleapis';
import { Readable } from 'stream';
import pkg from 'pg';
const { Client } = pkg;

// Single studio for now — every row uses this primary key. Matches the
// 'default-studio' convention used everywhere else in the codebase (Booking,
// Studio table seeds, etc.). If a second studio is ever added the schema is
// already keyed correctly.
export const DEFAULT_STUDIO_ID = 'default-studio';

const DRIVE_CALLBACK_URL =
  process.env.GOOGLE_DRIVE_CALLBACK_URL ??
  process.env.GOOGLE_CALLBACK_URL_DRIVE ??
  'https://hall-of-mirrors-tattoo-production.up.railway.app/api/studio/drive/callback';

const DEFAULT_FOLDER_NAME = 'Hall of Mirrors — Consent Forms';

// drive.file gives this app permission ONLY to the files it creates — it
// cannot list or touch anything else in the studio's Drive. Safest scope.
const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'email',
];

export function createDriveOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    DRIVE_CALLBACK_URL,
  );
}

export function getDriveAuthUrl(state: string): string {
  const client = createDriveOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: DRIVE_SCOPES,
    state,
    prompt: 'consent', // always request refresh_token
  });
}

export interface StoredDriveTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number | null;
  google_email: string | null;
  folder_id: string | null;
  folder_name: string | null;
}

export async function getDriveTokens(studioId: string = DEFAULT_STUDIO_ID): Promise<StoredDriveTokens | null> {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const { rows } = await db.query(
      `SELECT access_token, refresh_token, expiry_date, google_email, folder_id, folder_name
       FROM "StudioGoogleDriveToken" WHERE studio_id = $1`,
      [studioId],
    );
    return rows[0] ?? null;
  } finally {
    await db.end();
  }
}

export async function saveDriveTokens(
  studioId: string,
  tokens: { access_token: string; refresh_token?: string | null; expiry_date?: number | null },
  googleEmail?: string,
) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query(
      `INSERT INTO "StudioGoogleDriveToken" (studio_id, access_token, refresh_token, expiry_date, google_email, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (studio_id) DO UPDATE SET
         access_token  = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, "StudioGoogleDriveToken".refresh_token),
         expiry_date   = EXCLUDED.expiry_date,
         google_email  = COALESCE(EXCLUDED.google_email, "StudioGoogleDriveToken".google_email),
         updated_at    = NOW()`,
      [studioId, tokens.access_token, tokens.refresh_token ?? null, tokens.expiry_date ?? null, googleEmail ?? null],
    );
  } finally {
    await db.end();
  }
}

export async function setDriveFolder(studioId: string, folderId: string, folderName: string | null) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query(
      `UPDATE "StudioGoogleDriveToken" SET folder_id = $1, folder_name = $2, updated_at = NOW() WHERE studio_id = $3`,
      [folderId, folderName, studioId],
    );
  } finally {
    await db.end();
  }
}

export async function deleteDriveTokens(studioId: string = DEFAULT_STUDIO_ID) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query('DELETE FROM "StudioGoogleDriveToken" WHERE studio_id = $1', [studioId]);
  } finally {
    await db.end();
  }
}

// Hydrate an OAuth2 client with the studio's stored tokens, attaching the
// auto-refresh listener so any refreshed access_token gets persisted back to
// the DB (same pattern as googleCalendarService).
async function authorisedClient(studioId: string) {
  const stored = await getDriveTokens(studioId);
  if (!stored) return null;

  const oauth2Client = createDriveOAuth2Client();
  oauth2Client.setCredentials({
    access_token:  stored.access_token,
    refresh_token: stored.refresh_token,
    expiry_date:   stored.expiry_date,
  });
  oauth2Client.on('tokens', async (newTokens) => {
    if (newTokens.access_token) {
      await saveDriveTokens(studioId, {
        access_token:  newTokens.access_token,
        refresh_token: newTokens.refresh_token ?? null,
        expiry_date:   newTokens.expiry_date   ?? null,
      });
    }
  });

  return { oauth2Client, stored };
}

/**
 * Look up (or create) a folder by name in the studio's Drive root, persist
 * the resulting folder_id, and return it. Called once after a successful
 * OAuth connect.
 */
export async function ensureDefaultFolder(studioId: string = DEFAULT_STUDIO_ID): Promise<{ id: string; name: string } | null> {
  const auth = await authorisedClient(studioId);
  if (!auth) return null;
  const drive = google.drive({ version: 'v3', auth: auth.oauth2Client });

  // Reuse an existing folder of the same name if the studio already created
  // one (e.g. after a disconnect → reconnect). drive.file scope only sees
  // files the app created, so this is essentially a self-check.
  const existing = await drive.files.list({
    q: `name = '${DEFAULT_FOLDER_NAME.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 1,
  });
  const found = existing.data.files?.[0];
  if (found?.id) {
    await setDriveFolder(studioId, found.id, found.name ?? DEFAULT_FOLDER_NAME);
    return { id: found.id, name: found.name ?? DEFAULT_FOLDER_NAME };
  }

  const created = await drive.files.create({
    requestBody: {
      name: DEFAULT_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id, name',
  });
  if (!created.data.id) return null;
  await setDriveFolder(studioId, created.data.id, created.data.name ?? DEFAULT_FOLDER_NAME);
  return { id: created.data.id, name: created.data.name ?? DEFAULT_FOLDER_NAME };
}

/**
 * Verify a pasted folder ID exists and is writable. Used by the override
 * endpoint so the user doesn't accidentally point us at a deleted folder.
 */
export async function verifyAndSetFolder(
  studioId: string,
  folderId: string,
): Promise<{ id: string; name: string } | null> {
  const auth = await authorisedClient(studioId);
  if (!auth) return null;
  const drive = google.drive({ version: 'v3', auth: auth.oauth2Client });

  try {
    const meta = await drive.files.get({ fileId: folderId, fields: 'id, name, mimeType, trashed' });
    if (meta.data.trashed || meta.data.mimeType !== 'application/vnd.google-apps.folder') {
      return null;
    }
    const name = meta.data.name ?? 'Drive folder';
    await setDriveFolder(studioId, folderId, name);
    return { id: folderId, name };
  } catch {
    return null;
  }
}

/**
 * Upload a PDF buffer to the studio's configured Drive folder.
 * Returns { id, webViewLink } on success, or null if no tokens are stored
 * (i.e. Drive isn't connected yet). All other failures throw.
 */
export async function uploadPDFToDrive(
  studioId: string,
  filename: string,
  buffer: Buffer,
): Promise<{ id: string; webViewLink: string | null } | null> {
  const auth = await authorisedClient(studioId);
  if (!auth) return null;
  const { stored } = auth;

  // If we somehow have tokens but no folder configured, create the default one
  // on the fly rather than uploading into the user's Drive root.
  let folderId = stored.folder_id;
  if (!folderId) {
    const folder = await ensureDefaultFolder(studioId);
    folderId = folder?.id ?? null;
  }
  if (!folderId) {
    throw new Error('Drive folder is not configured.');
  }

  const drive = google.drive({ version: 'v3', auth: auth.oauth2Client });
  const safeFilename = filename.replace(/[^\w.\-]/g, '_'); // never trust caller-shaped names
  const result = await drive.files.create({
    requestBody: {
      name: safeFilename,
      parents: [folderId],
      mimeType: 'application/pdf',
    },
    media: {
      mimeType: 'application/pdf',
      body: Readable.from(buffer),
    },
    fields: 'id, webViewLink',
  });
  if (!result.data.id) {
    throw new Error('Drive upload returned no file id.');
  }
  return { id: result.data.id, webViewLink: result.data.webViewLink ?? null };
}

/**
 * Lightweight status view used by the dashboard — returns null when Drive
 * isn't connected.
 */
export async function getDriveStatus(studioId: string = DEFAULT_STUDIO_ID) {
  const stored = await getDriveTokens(studioId);
  if (!stored) return null;
  return {
    connected: true,
    google_email: stored.google_email,
    folder_id: stored.folder_id,
    folder_name: stored.folder_name,
  };
}
