import { Request, Response } from 'express';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const { Client } = pkg;

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in the environment.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export async function artistLogin(req: Request, res: Response) {
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

    // Find artist by email
    const result = await client.query(
      `SELECT id, email, full_name, specialties, instagram_handle, password_hash FROM "Artist" WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const artist = result.rows[0];

    // Check if password matches
    const passwordMatch = await bcrypt.compare(password, artist.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        id: artist.id,
        email: artist.email,
        full_name: artist.full_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      {
        id: artist.id,
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      artist: {
        id: artist.id,
        email: artist.email,
        full_name: artist.full_name,
        specialties: artist.specialties,
        instagram_handle: artist.instagram_handle,
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

export async function artistRefresh(req: Request, res: Response) {
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

      // Find artist
      const result = await client.query(
        `SELECT id, email, full_name FROM "Artist" WHERE id = $1`,
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Artist not found',
        });
      }

      const artist = result.rows[0];

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          id: artist.id,
          email: artist.email,
          full_name: artist.full_name,
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

export async function changeArtistPassword(req: Request, res: Response) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    if (!req.artist) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }
    if (typeof new_password !== 'string' || new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
    }

    await client.connect();
    const result = await client.query(
      `SELECT password_hash FROM "Artist" WHERE id = $1`,
      [req.artist.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Artist not found' });
    }
    const match = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const new_hash = await bcrypt.hash(new_password, 10);
    await client.query(
      `UPDATE "Artist" SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [new_hash, req.artist.id]
    );
    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    console.error('Artist change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  } finally {
    await client.end();
  }
}

export async function getArtistProfile(req: Request, res: Response) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    if (!req.artist) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    await client.connect();

    const result = await client.query(
      `SELECT id, email, full_name, specialties, years_experience, bio, instagram_handle, is_active, portrait_url, booking_window_months
       FROM "Artist" WHERE id = $1`,
      [req.artist.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Artist not found',
      });
    }

    res.json({
      success: true,
      artist: result.rows[0],
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
