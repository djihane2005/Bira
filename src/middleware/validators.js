const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const contactValidationRules = [
    body('name')
        .trim()
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.'),
    body('email')
        .isEmail().withMessage('A valid email address is required.')
        .normalizeEmail(),
    body('projectType')
        .isIn(['Residential', 'Commercial', 'Industrial', 'Other']).withMessage('Please select a valid project type.'),
    body('message')
        .trim()
        .isLength({ min: 10 }).withMessage('Message must be at least 10 characters long.'),
    body('captcha_ans')
        .notEmpty().withMessage('Please solve the math check.')
        .custom((value, { req }) => {
            // TODO: Improve security by generating and signing captcha values server-side
            // Current implementation is weak as n1 and n2 are sent by the client.
            const sum = parseInt(req.body.captcha_n1) + parseInt(req.body.captcha_n2);
            if (parseInt(value) !== sum) {
                throw new Error('The math answer is incorrect. Are you human?');
            }
            return true;
        })
];

const validate = (req, res, next) => {
    // Honeypot check: If the 'website' field is filled, it's a bot
    if (req.body.website) {
        logger.warn('Honeypot triggered by IP: %s', req.ip);
        // Return fake success to the bot
        return res.status(200).json({ message: 'Submission received successfully!' });
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return res.status(400).json({ errors: errors.array() });
};

module.exports = {
    contactValidationRules,
    validate,
};