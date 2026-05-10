import jwt from 'jsonwebtoken';
export function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Missing or invalid authorization header',
            });
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key');
        // Attach artist data to request
        req.artist = {
            id: decoded.id,
            email: decoded.email,
            full_name: decoded.full_name,
        };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                code: 'TOKEN_EXPIRED',
            });
        }
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
        });
    }
}
//# sourceMappingURL=auth.js.map