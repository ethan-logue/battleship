import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const generateToken = (ip, userAgent) => {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return jwt.sign({ nonce, timestamp, ip, userAgent }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

export const validateToken = (token, ip, userAgent) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.ip !== ip || decoded.userAgent !== userAgent) {
            throw new Error('Invalid token');
        }
        return decoded;
    } catch (err) {
        throw new Error('Invalid or expired token');
    }
};