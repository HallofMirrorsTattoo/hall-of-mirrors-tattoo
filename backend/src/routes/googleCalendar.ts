import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';
import {
  createOAuth2Client,
  getAuthUrl,
  getGoogleTokens,
  saveGoogleTokens,
  deleteGoogleTokens,
} from '../services/googleCalendarService.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret';
const FRONTEND_URL =
  process.env.FRONTEND_URL ?? 'https://hall-of-mirrors-tattoo.vercel.app';

// POST /api/artist/google-calendar/connect
// Returns a Google OAuth URL the frontend should redirect to
router.post('/connect', authMiddleware, (req: Request, res: Response) => {
  const artistId = (req as any).artist?.id;
  if (!artistId) return res.status(401).json({ error: 'Unauthorized' });

  // State is a short-lived JWT so we can recover artist identity in the callback
  const state = jwt.sign({ artistId }, JWT_SECRET, { expiresIn: '10m' });
  const url = getAuthUrl(state);
  res.json({ url });
});

// GET /api/artist/google-calendar/callback
// Google redirects here after the user grants (or denies) access
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error || !code || !state) {
    return res.redirect(`${FRONTEND_URL}/artist/dashboard?tab=profile&calendar=error`);
  }

  let artistId: string;
  try {
    const payload = jwt.verify(state, JWT_SECRET) as { artistId: string };
    artistId = payload.artistId;
  } catch {
    return res.redirect(`${FRONTEND_URL}/artist/dashboard?tab=profile&calendar=error`);
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) throw new Error('No access_token in response');

    // Get the Google account email for display
    oauth2Client.setCredentials(tokens);
    const { google } = await import('googleapis');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    await saveGoogleTokens(
      artistId,
      {
        access_token:  tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expiry_date:   tokens.expiry_date   ?? null,
      },
      data.email ?? undefined,
    );

    return res.redirect(`${FRONTEND_URL}/artist/dashboard?tab=profile&calendar=connected`);
  } catch (err) {
    console.error('[GoogleCalendar] callback error:', err);
    return res.redirect(`${FRONTEND_URL}/artist/dashboard?tab=profile&calendar=error`);
  }
});

// GET /api/artist/google-calendar/status
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  const artistId = (req as any).artist?.id;
  if (!artistId) return res.status(401).json({ error: 'Unauthorized' });

  const tokens = await getGoogleTokens(artistId);
  res.json({
    connected: !!tokens,
    google_email: tokens?.google_email ?? null,
  });
});

// DELETE /api/artist/google-calendar/disconnect
router.delete('/disconnect', authMiddleware, async (req: Request, res: Response) => {
  const artistId = (req as any).artist?.id;
  if (!artistId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const tokens = await getGoogleTokens(artistId);
    if (tokens?.refresh_token) {
      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: tokens.refresh_token });
      await oauth2Client.revokeCredentials().catch(() => {
        // If revocation fails (e.g. already revoked), still delete locally
      });
    }
    await deleteGoogleTokens(artistId);
    res.json({ success: true });
  } catch (err) {
    console.error('[GoogleCalendar] disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
