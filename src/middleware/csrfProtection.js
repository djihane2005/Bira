const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Middleware de protection CSRF
 * Valide le token présent dans le header 'x-csrf-token' (ou le body)
 * par rapport au cookie signé '_csrf_token'.
 */
const csrfProtection = (req, res, next) => {
    const tokenFromHeader = req.headers['x-csrf-token'];
    const tokenFromBody = req.body.csrfToken;
    const requestToken = tokenFromHeader || tokenFromBody;
    
    // On récupère le cookie signé (cookieParser doit être configuré avec un secret)
    const signedCookieToken = req.signedCookies._csrf_token;

    if (!signedCookieToken) {
        logger.warn('CSRF token missing in signed cookies. IP: %s', req.ip);
        return res.status(403).json({ message: "CSRF token missing or invalid" });
    }

    if (!requestToken) {
        logger.warn('CSRF token missing in request header/body. IP: %s', req.ip);
        return res.status(403).json({ message: "CSRF token missing or invalid" });
    }

    try {
        // Comparaison sécurisée contre les attaques temporelles (timing attacks)
        // Les deux doivent être des buffers pour timingSafeEqual
        const buffer1 = Buffer.from(requestToken);
        const buffer2 = Buffer.from(signedCookieToken);

        if (buffer1.length !== buffer2.length || !crypto.timingSafeEqual(buffer1, buffer2)) {
            logger.warn('CSRF token mismatch. IP: %s', req.ip);
            return res.status(403).json({ message: "CSRF token missing or invalid" });
        }
    } catch (err) {
        logger.error('CSRF validation error: %o', err);
        return res.status(403).json({ message: "CSRF token missing or invalid" });
    }

    next();
};

module.exports = csrfProtection;
