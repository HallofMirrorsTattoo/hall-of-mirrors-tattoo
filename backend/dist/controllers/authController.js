import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key';
export async function artistLogin(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
        }
        // Find artist by email
        const artist = await prisma.artist.findUnique({
            where: { email },
        });
        if (!artist) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }
        // Check if password matches
        const passwordMatch = await bcrypt.compare(password, artist.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }
        // Generate tokens
        const accessToken = jwt.sign({
            id: artist.id,
            email: artist.email,
            full_name: artist.full_name,
        }, JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = jwt.sign({
            id: artist.id,
        }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
        });
    }
}
export async function artistRefresh(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required',
            });
        }
        try {
            const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
            // Find artist
            const artist = await prisma.artist.findUnique({
                where: { id: decoded.id },
            });
            if (!artist) {
                return res.status(401).json({
                    success: false,
                    error: 'Artist not found',
                });
            }
            // Generate new access token
            const newAccessToken = jwt.sign({
                id: artist.id,
                email: artist.email,
                full_name: artist.full_name,
            }, JWT_SECRET, { expiresIn: '7d' });
            res.json({
                success: true,
                accessToken: newAccessToken,
            });
        }
        catch (tokenError) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token',
            });
        }
    }
    catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Token refresh failed',
        });
    }
}
export async function getArtistProfile(req, res) {
    try {
        if (!req.artist) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }
        const artist = await prisma.artist.findUnique({
            where: { id: req.artist.id },
            select: {
                id: true,
                email: true,
                full_name: true,
                specialties: true,
                years_experience: true,
                bio: true,
                instagram_handle: true,
                is_active: true,
            },
        });
        if (!artist) {
            return res.status(404).json({
                success: false,
                error: 'Artist not found',
            });
        }
        res.json({
            success: true,
            artist,
        });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile',
        });
    }
}
//# sourceMappingURL=authController.js.map