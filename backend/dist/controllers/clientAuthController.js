import pkg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const { Client } = pkg;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key';
export async function clientSignup(req, res) {
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
        const existingUser = await client.query(`SELECT id FROM "User" WHERE email = $1`, [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Email already registered',
            });
        }
        // Hash password
        const password_hash = await bcrypt.hash(password, 10);
        // Create user
        const insertResult = await client.query(`INSERT INTO "User" (id, email, password_hash, first_name, last_name, phone, account_status, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'active', NOW(), NOW())
       RETURNING id, email, first_name, last_name, phone`, [email, password_hash, first_name, last_name, phone || null]);
        const user = insertResult.rows[0];
        // Generate tokens
        const accessToken = jwt.sign({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
        }, JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = jwt.sign({
            id: user.id,
        }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
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
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            error: 'Signup failed',
        });
    }
    finally {
        await client.end();
    }
}
export async function clientLogin(req, res) {
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
        const result = await client.query(`SELECT id, email, first_name, last_name, phone, password_hash FROM "User" WHERE email = $1`, [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }
        const user = result.rows[0];
        // Check if password matches
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }
        // Generate tokens
        const accessToken = jwt.sign({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
        }, JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = jwt.sign({
            id: user.id,
        }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
        });
    }
    finally {
        await client.end();
    }
}
export async function clientRefresh(req, res) {
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
            const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
            await client.connect();
            // Find user
            const result = await client.query(`SELECT id, email, first_name, last_name FROM "User" WHERE id = $1`, [decoded.id]);
            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found',
                });
            }
            const user = result.rows[0];
            // Generate new access token
            const newAccessToken = jwt.sign({
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
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
    finally {
        await client.end();
    }
}
export async function clientActivate(req, res) {
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
        const userResult = await client.query(`SELECT id, email, first_name, last_name, phone FROM "User" WHERE email = $1`, [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const user = userResult.rows[0];
        // Hash password
        const password_hash = await bcrypt.hash(password, 10);
        // Update user password
        await client.query(`UPDATE "User" SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [password_hash, user.id]);
        // Generate tokens
        const accessToken = jwt.sign({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
        }, JWT_SECRET, { expiresIn: '7d' });
        const refreshToken = jwt.sign({
            id: user.id,
        }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
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
    }
    catch (error) {
        console.error('Activate error:', error);
        res.status(500).json({
            success: false,
            error: 'Account activation failed',
        });
    }
    finally {
        await client.end();
    }
}
export async function getClientProfile(req, res) {
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
        const result = await client.query(`SELECT id, email, first_name, last_name, phone, date_of_birth, address, city, postcode, account_status
       FROM "User" WHERE id = $1`, [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        res.json({
            success: true,
            user: result.rows[0],
        });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile',
        });
    }
    finally {
        await client.end();
    }
}
//# sourceMappingURL=clientAuthController.js.map