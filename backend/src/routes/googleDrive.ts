import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';
import {
  DEFAULT_STUDIO_ID,
  createDriveOAuth2Client,
  deleteDriveTokens,
  ensureDefaultFolder,
  getDriveAuthUrl,
  getDriveStatus,
  getDriveTokens,
  saveDriveTokens,
  verifyAndSetFolder,
} from '../services/googleDriveService.js';

const router = Router();

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET must be set in the environment.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL =
  process.env.FRONTEND_URL ?? 'https://hall-of-mirrors-tattoo.vercel.app';

// POST /api/studio/drive/connect — returns the OAuth URL for the frontend to redirect to.
router.post('/connect', authMiddleware, (req: Request, res: Response) => {
  const artistId = (req as any).artist?.id;
  if (!artistId) return res.status(401).json({ error: 'Unauthorized' });

  // Short-lived state JWT. Carries the initiating artist for audit / future
  // role checks; the resulting tokens are saved against the studio, not the artist.
  const state = jwt.sign({ studioId: DEFAULT_STUDIO_ID, artistId }, JWT_SECRET, { expiresIn: '10m' });
  const url = getDriveAuthUrl(state);
  res.json({ url });
});

// GET /api/studio/drive/callback — Google redirects here after consent.
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;
  const failRedirect = `${FRONTEND_URL}/artist/dashboard?tab=studio-settings&drive=error`;

  if (error || !code || !state) {
    return res.redirect(failRedirect);
  }

  let studioId: string;
  try {
    const payload = jwt.verify(state, JWT_SECRET) as { studioId: string };
    studioId = payload.studioId;
  } catch {
    return res.redirect(failRedirect);
  }

  try {
    const oauth2Client = createDriveOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.access_token) throw new Error('No access_token in response');

    // Pull email from id_token without an extra round-trip.
    let googleEmail: string | undefined;
    if (tokens.id_token) {
      try {
        const payload = JSON.parse(
          Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString('utf8'),
        );
        googleEmail = payload.email;
      } catch { /* non-critical */ }
    }

    await saveDriveTokens(
      studioId,
      {
        access_token:  tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expiry_date:   tokens.expiry_date   ?? null,
      },
      googleEmail,
    );

    // Auto-create (or rediscover) the consent folder so the studio doesn't
    // have to take any further action after the consent screen.
    await ensureDefaultFolder(studioId);

    return res.redirect(`${FRONTEND_URL}/artist/dashboard?tab=studio-settings&drive=connected`);
  } catch (err) {
    console.error('[GoogleDrive] callback error:', err);
    return res.redirect(failRedirect);
  }
});

// GET /api/studio/drive/status — small payload used by the dashboard UI.
router.get('/status', authMiddleware, async (_req: Request, res: Response) => {
  const status = await getDriveStatus(DEFAULT_STUDIO_ID);
  if (!status) return res.json({ connected: false });
  res.json(status);
});

// DELETE /api/studio/drive/disconnect — revoke + delete the stored tokens.
router.delete('/disconnect', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const tokens = await getDriveTokens(DEFAULT_STUDIO_ID);
    if (tokens?.refresh_token) {
      const oauth2Client = createDriveOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: tokens.refresh_token });
      await oauth2Client.revokeCredentials().catch(() => {
        // already revoked — still delete locally
      });
    }
    await deleteDriveTokens(DEFAULT_STUDIO_ID);
    res.json({ success: true });
  } catch (err) {
    console.error('[GoogleDrive] disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// PATCH /api/studio/drive/folder — point Drive uploads at a different folder.
// Accepts either { folder_id } or { folder_id: '' } / no body to reset to default.
router.patch('/folder', authMiddleware, async (req: Request, res: Response) => {
  const { folder_id } = req.body ?? {};

  if (!folder_id || String(folder_id).trim() === '') {
    const folder = await ensureDefaultFolder(DEFAULT_STUDIO_ID);
    if (!folder) return res.status(400).json({ error: 'Drive is not connected.' });
    return res.json({ folder_id: folder.id, folder_name: folder.name });
  }

  const ok = await verifyAndSetFolder(DEFAULT_STUDIO_ID, String(folder_id).trim());
  if (!ok) {
    return res.status(400).json({
      error: 'That folder id isn\'t accessible. Make sure Drive is connected and the folder exists.',
    });
  }
  res.json({ folder_id: ok.id, folder_name: ok.name });
});

export default router;
