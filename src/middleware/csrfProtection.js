const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Middleware de protection CSRF (Stateless HMAC)
 * Valide le token présent dans le header 'x-csrf-token'
 * Token format: timestamp.nonce.signature
 */
const csrfProtection = (req, res, next) => {
    const requestToken = req.get('x-csrf-token') || req.body.csrfToken;

    if (!requestToken) {
        logger.warn('CSRF token missing in request. IP: %s', req.ip);
        return res.status(403).json({ message: "CSRF token missing or invalid. Please refresh the page." });
    }

    try {
        const parts = requestToken.split('.');
        if (parts.length !== 3) {
            logger.warn('CSRF token format invalid. IP: %s', req.ip);
            return res.status(403).json({ message: "CSRF token missing or invalid. Please refresh the page." });
        }

        const [timestamp, nonce, signature] = parts;
        const data = `${timestamp}.${nonce}`;

        // 1. Vérifier l'expiration (TTL: 1 heure)
        const tokenTime = parseInt(timestamp, 10);
        const currentTime = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (isNaN(tokenTime) || currentTime - tokenTime > oneHour) {
            logger.warn('CSRF token expired. IP: %s', req.ip);
            return res.status(403).json({ message: "CSRF token expired. Please refresh the page." });
        }

        // 2. Re-calculer la signature attendue
        const expectedSignature = crypto
            .createHmac('sha256', process.env.COOKIE_SECRET)
            .update(data)
            .digest('hex');

        // 3. Comparaison sécurisée (timingSafeEqual)
        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);

        if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
            logger.warn('CSRF token signature mismatch. IP: %s', req.ip);
            return res.status(403).json({ message: "CSRF token missing or invalid. Please refresh the page." });
        }

    } catch (err) {
        logger.error('CSRF validation error: %s', err.message);
        return res.status(403).json({ message: "CSRF token missing or invalid. Please refresh the page." });
    }

    next();
};

module.exports = csrfProtection;
