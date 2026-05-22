import { google } from 'googleapis';
import pkg from 'pg';
const { Client } = pkg;

const CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ??
  'https://hall-of-mirrors-tattoo-production.up.railway.app/api/artist/google-calendar/callback';

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    CALLBACK_URL,
  );
}

export function getAuthUrl(state: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state,
    prompt: 'consent', // always request refresh_token
  });
}

export async function getGoogleTokens(artistId: string) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const { rows } = await db.query(
      'SELECT access_token, refresh_token, expiry_date, google_email FROM "ArtistGoogleToken" WHERE artist_id = $1',
      [artistId],
    );
    return rows[0] ?? null;
  } finally {
    await db.end();
  }
}

export async function saveGoogleTokens(
  artistId: string,
  tokens: { access_token: string; refresh_token?: string | null; expiry_date?: number | null },
  googleEmail?: string,
) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query(
      `INSERT INTO "ArtistGoogleToken" (artist_id, access_token, refresh_token, expiry_date, google_email, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (artist_id) DO UPDATE SET
         access_token  = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, "ArtistGoogleToken".refresh_token),
         expiry_date   = EXCLUDED.expiry_date,
         google_email  = COALESCE(EXCLUDED.google_email, "ArtistGoogleToken".google_email),
         updated_at    = NOW()`,
      [artistId, tokens.access_token, tokens.refresh_token ?? null, tokens.expiry_date ?? null, googleEmail ?? null],
    );
  } finally {
    await db.end();
  }
}

export async function deleteGoogleTokens(artistId: string) {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query('DELETE FROM "ArtistGoogleToken" WHERE artist_id = $1', [artistId]);
  } finally {
    await db.end();
  }
}

export async function pushCalendarEvent(artistId: string, booking: {
  client_name: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  duration_minutes: number;
  design_description?: string | null;
  placement?: string | null;
  booking_reference: string;
}) {
  const stored = await getGoogleTokens(artistId);
  if (!stored) return; // artist hasn't connected Google Calendar

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token:  stored.access_token,
    refresh_token: stored.refresh_token,
    expiry_date:   stored.expiry_date,
  });

  // Persist refreshed tokens automatically
  oauth2Client.on('tokens', async (newTokens) => {
    if (newTokens.access_token) {
      await saveGoogleTokens(artistId, {
        access_token:  newTokens.access_token,
        refresh_token: newTokens.refresh_token ?? null,
        expiry_date:   newTokens.expiry_date   ?? null,
      });
    }
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const [yr, mo, dy] = booking.appointment_date.split('-').map(Number);
  const [hr, mn]     = booking.appointment_time.split(':').map(Number);
  const start = new Date(yr, mo - 1, dy, hr, mn);
  const end   = new Date(start.getTime() + booking.duration_minutes * 60_000);

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

  const desc = [
    `Ref: ${booking.booking_reference}`,
    booking.placement          ? `Placement: ${booking.placement}` : null,
    booking.design_description ? `Design: ${booking.design_description}` : null,
  ].filter(Boolean).join('\n');

  await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary:     `Tattoo — ${booking.client_name}`,
      description: desc,
      location:    'Hall of Mirrors Tattoo Studio, Suite 3, 34 Castle Street, Liverpool, L2 0NR',
      start: { dateTime: fmt(start), timeZone: 'Europe/London' },
      end:   { dateTime: fmt(end),   timeZone: 'Europe/London' },
      colorId: '5', // banana/yellow — closest to gold
    },
  });
}
