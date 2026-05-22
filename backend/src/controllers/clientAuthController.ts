import { Request, Response } from 'express';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';

const { Client } = pkg;

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key';

export async function clientSignup(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { email, password, first_name, last_name, phone } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, first_name, and last_name are required',
      });
    }

    await client.connect();

    // Check if user already exists
    const existingUser = await client.query(
      `SELECT id, password_hash FROM "User" WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      if (existing.password_hash !== '') {
        return res.status(409).json({ success: false, error: 'Email already registered' });
      }
      // Stub user from a prior guest booking — activate it in place
      const stubHash = await bcrypt.hash(password, 10);
      await client.query(
        `UPDATE "User" SET password_hash = $1, first_name = $2, last_name = $3,
         phone = COALESCE($4, phone), account_status = 'active', updated_at = NOW()
         WHERE id = $5`,
        [stubHash, first_name, last_name, phone || null, existing.id]
      );
      const stubAccess = jwt.sign({ id: existing.id, email, first_name, last_name }, JWT_SECRET, { expiresIn: '7d' });
      const stubRefresh = jwt.sign({ id: existing.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
      sendWelcomeEmail({ clientEmail: email, clientFirstName: first_name })
        .catch((e) => console.error('[email] welcome email failed:', e));
      return res.status(201).json({
        success: true, message: 'Account activated',
        accessToken: stubAccess, refreshToken: stubRefresh,
        user: { id: existing.id, email, first_name, last_name, phone: phone || null },
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const insertResult = await client.query(
      `INSERT INTO "User" (id, email, password_hash, first_name, last_name, phone, account_status, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'active', NOW(), NOW())
       RETURNING id, email, first_name, last_name, phone`,
      [email, password_hash, first_name, last_name, phone || null]
    );

    const user = insertResult.rows[0];

    // Generate tokens
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    // Welcome email — non-blocking
    sendWelcomeEmail({ clientEmail: user.email, clientFirstName: user.first_name })
      .catch((e) => console.error('[email] welcome email failed:', e));

    res.status(201).json({
      success: true,
      message: 'Signup successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Signup failed',
    });
  } finally {
    await client.end();
  }
}

export async function clientLogin(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    await client.connect();

    // Find user by email
    const result = await client.query(
      `SELECT id, email, first_name, last_name, phone, password_hash, account_status FROM "User" WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    if (user.account_status === 'deleted') {
      return res.status(401).json({ success: false, error: 'This account has been deleted.' });
    }

    // Check if password matches
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  } finally {
    await client.end();
  }
}

export async function clientRefresh(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

      await client.connect();

      // Find user
      const result = await client.query(
        `SELECT id, email, first_name, last_name FROM "User" WHERE id = $1`,
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      const user = result.rows[0];

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
    });
  } finally {
    await client.end();
  }
}

export async function clientActivate(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    await client.connect();

    // Find user by email
    const userResult = await client.query(
      `SELECT id, email, first_name, last_name, phone FROM "User" WHERE email = $1 AND password_hash = ''`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No pending account found for this email. If you already have an account, please log in.',
      });
    }

    const user = userResult.rows[0];

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Update user password
    await client.query(
      `UPDATE "User" SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [password_hash, user.id]
    );

    // Generate tokens
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Account activated successfully',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Activate error:', error);
    res.status(500).json({
      success: false,
      error: 'Account activation failed',
    });
  } finally {
    await client.end();
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    await client.connect();
    const result = await client.query(
      `SELECT id, first_name, email FROM "User" WHERE email = $1`,
      [email]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await client.query(
      `UPDATE "User" SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3`,
      [token, expires, user.id]
    );

    sendPasswordResetEmail({
      clientEmail: user.email,
      clientFirstName: user.first_name,
      resetToken: token,
    }).catch((e) => console.error('[email] password reset email failed:', e));

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Failed to process request' });
  } finally {
    await client.end();
  }
}

export async function resetPassword(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ success: false, error: 'Email, token, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    await client.connect();
    const result = await client.query(
      `SELECT id, email, first_name FROM "User" WHERE email = $1 AND password_reset_token = $2 AND password_reset_expires > NOW()`,
      [email, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset link' });
    }

    const user = result.rows[0];
    const password_hash = await bcrypt.hash(password, 10);

    await client.query(
      `UPDATE "User" SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW() WHERE id = $2`,
      [password_hash, user.id]
    );

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  } finally {
    await client.end();
  }
}

export async function updateClientProfile(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { first_name, last_name, phone, address, city, postcode, emergency_contact_name, emergency_contact_phone, health } = req.body;

    await client.connect();
    const result = await client.query(
      `UPDATE "User"
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           postcode = COALESCE($6, postcode),
           emergency_contact_name = COALESCE($7, emergency_contact_name),
           emergency_contact_phone = COALESCE($8, emergency_contact_phone),
           updated_at = NOW()
       WHERE id = $9
       RETURNING id, email, first_name, last_name, phone, address, city, postcode, emergency_contact_name, emergency_contact_phone`,
      [first_name, last_name, phone, address, city, postcode, emergency_contact_name, emergency_contact_phone, req.user.id]
    );

    if (health) {
      await client.query(
        `INSERT INTO "MedicalHistory" (
          id, user_id,
          pregnant_or_breastfeeding, blood_borne_conditions, diabetes, heart_condition,
          haemophilia_or_bleeding_disorder, epilepsy_or_seizure, skin_conditions,
          autoimmune_conditions, blood_thinners, steroids_or_immunosuppressants,
          alcohol_or_drugs_last_24h,
          known_allergies, allergies_latex, allergies_ink, allergies_topical_anaesthetics,
          previous_tattoo_reaction, previous_reaction_details,
          chemotherapy_or_radiotherapy, current_medications,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1,
          $2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
          false,
          $12,$13,$14,$15,$16,$17,$18,$19,
          NOW(), NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          pregnant_or_breastfeeding          = EXCLUDED.pregnant_or_breastfeeding,
          blood_borne_conditions             = EXCLUDED.blood_borne_conditions,
          diabetes                           = EXCLUDED.diabetes,
          heart_condition                    = EXCLUDED.heart_condition,
          haemophilia_or_bleeding_disorder   = EXCLUDED.haemophilia_or_bleeding_disorder,
          epilepsy_or_seizure                = EXCLUDED.epilepsy_or_seizure,
          skin_conditions                    = EXCLUDED.skin_conditions,
          autoimmune_conditions              = EXCLUDED.autoimmune_conditions,
          blood_thinners                     = EXCLUDED.blood_thinners,
          steroids_or_immunosuppressants     = EXCLUDED.steroids_or_immunosuppressants,
          known_allergies                    = EXCLUDED.known_allergies,
          allergies_latex                    = EXCLUDED.allergies_latex,
          allergies_ink                      = EXCLUDED.allergies_ink,
          allergies_topical_anaesthetics     = EXCLUDED.allergies_topical_anaesthetics,
          previous_tattoo_reaction           = EXCLUDED.previous_tattoo_reaction,
          previous_reaction_details          = EXCLUDED.previous_reaction_details,
          chemotherapy_or_radiotherapy       = EXCLUDED.chemotherapy_or_radiotherapy,
          current_medications                = EXCLUDED.current_medications,
          updated_at                         = NOW()`,
        [
          req.user.id,
          !!health.pregnant_or_breastfeeding, !!health.blood_borne_conditions,
          !!health.diabetes, !!health.heart_condition,
          !!health.haemophilia_or_bleeding_disorder, !!health.epilepsy_or_seizure,
          health.skin_conditions || null,
          !!health.autoimmune_conditions, !!health.blood_thinners,
          !!health.steroids_or_immunosuppressants,
          health.known_allergies || null,
          !!health.allergies_latex, !!health.allergies_ink,
          !!health.allergies_topical_anaesthetics,
          !!health.previous_tattoo_reaction,
          health.previous_reaction_details || null,
          !!health.chemotherapy_or_radiotherapy,
          health.current_medications || null,
        ]
      );
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  } finally {
    await client.end();
  }
}

export async function deleteClientAccount(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    await client.connect();
    await client.query(
      `UPDATE "User" SET
        email = 'deleted_' || id || '@deleted.invalid',
        first_name = 'Deleted',
        last_name = 'Account',
        password_hash = '',
        phone = NULL,
        date_of_birth = NULL,
        address = NULL,
        city = NULL,
        postcode = NULL,
        emergency_contact_name = NULL,
        emergency_contact_phone = NULL,
        password_reset_token = NULL,
        password_reset_expires = NULL,
        account_status = 'deleted',
        updated_at = NOW()
      WHERE id = $1`,
      [req.user.id]
    );
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  } finally {
    await client.end();
  }
}

export async function getClientProfile(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    await client.connect();

    const result = await client.query(
      `SELECT id, email, first_name, last_name, phone, date_of_birth, address, city, postcode, account_status,
              emergency_contact_name, emergency_contact_phone
       FROM "User" WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const healthResult = await client.query(
      `SELECT pregnant_or_breastfeeding, blood_borne_conditions, diabetes, heart_condition,
              haemophilia_or_bleeding_disorder, epilepsy_or_seizure, skin_conditions,
              autoimmune_conditions, blood_thinners, steroids_or_immunosuppressants,
              known_allergies, allergies_latex, allergies_ink, allergies_topical_anaesthetics,
              previous_tattoo_reaction, previous_reaction_details, chemotherapy_or_radiotherapy,
              current_medications
       FROM "MedicalHistory" WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({
      success: true,
      user: result.rows[0],
      health: healthResult.rows[0] ?? null,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
    });
  } finally {
    await client.end();
  }
}
