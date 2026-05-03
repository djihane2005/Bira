const { Resend } = require('resend');
const ejs = require('ejs');
const path = require('path');
const logger = require('../utils/logger');

// Initialisation de Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Validation de la configuration au démarrage
 */
const verifyEmailConfig = () => {
    const { RESEND_API_KEY, EMAIL_TO } = process.env;
    const isProd = process.env.NODE_ENV === 'production';

    if (!RESEND_API_KEY) {
        if (isProd) {
            logger.error('FATAL: RESEND_API_KEY is required in production!');
            process.exit(1);
        } else {
            logger.warn('Email service not configured: RESEND_API_KEY missing in .env');
        }
        return false;
    }

    if (!EMAIL_TO) {
        logger.warn('EMAIL_TO is not set, emails will fail to send if not provided in request');
    }

    logger.info('Resend email service configuration detected');
    return true;
};

// Vérification immédiate
verifyEmailConfig();

/**
 * Envoie un e-mail de notification de contact via Resend
 * @param {Object} data - Données du formulaire (name, email, projectType, message)
 */
const sendContactEmail = async (data) => {
    const { name, email, projectType, message } = data;
    const { RESEND_API_KEY, EMAIL_TO } = process.env;

    if (!RESEND_API_KEY) {
        throw new Error('Email configuration missing: RESEND_API_KEY is required');
    }

    try {
        const emailHtml = await ejs.renderFile(
            path.join(__dirname, '..', 'templates', 'contactEmail.ejs'),
            { name, email, projectType, message }
        );

        const recipient = EMAIL_TO;
        
        logger.info('Preparing to send contact email via Resend', {
            to: recipient,
            replyTo: email
        });

        const { data: resendData, error } = await resend.emails.send({
            from: 'BIRABRICK <onboarding@resend.dev>', // Utiliser le domaine vérifié plus tard
            to: recipient,
            reply_to: email,
            subject: `New Contact Form Submission from ${name}`,
            html: emailHtml,
        });

        if (error) {
            throw error;
        }

        return resendData;

    } catch (error) {
        logger.error('Resend email sending failed', {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode
        });
        throw error;
    }
};

module.exports = {
    sendContactEmail,
    verifyEmailConfig
};