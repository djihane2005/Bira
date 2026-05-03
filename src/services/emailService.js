const nodemailer = require('nodemailer'); //[cite: 6]
const ejs = require('ejs'); //[cite: 6]
const path = require('path'); //[cite: 6]

// --- MODIFICATION : Chemin vers le logger dans src/utils/ ---
// On utilise '../' pour sortir de 'services' et entrer dans 'utils'
const logger = require('../utils/logger'); 

// Configuration et validation des identifiants au démarrage
const verifyEmailConfig = () => {
    const { EMAIL_USER, EMAIL_PASS } = process.env;
    const isProd = process.env.NODE_ENV === 'production';

    if (!EMAIL_USER || !EMAIL_PASS) {
        if (isProd) {
            logger.error('FATAL: EMAIL_USER and EMAIL_PASS are required in production!');
            process.exit(1);
        } else {
            logger.warn('Email service not configured: EMAIL_USER or EMAIL_PASS missing in .env');
        }
        return false;
    }
    logger.info('Email service configuration detected');
    return true;
};

// Initialisation de la vérification au démarrage
verifyEmailConfig();

/**
 * Crée et retourne un transporteur Nodemailer
 */
const getTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
    });
};

/**
 * Envoie un e-mail de notification de contact
 * @param {Object} data - Données du formulaire (name, email, projectType, message)
 */
const sendContactEmail = async (data) => {
    const { name, email, projectType, message } = data;
    const { EMAIL_USER, EMAIL_PASS, EMAIL_TO } = process.env;

    if (!EMAIL_USER || !EMAIL_PASS) {
        throw new Error('Email configuration missing: EMAIL_USER and EMAIL_PASS are required');
    }

    try {
        const emailHtml = await ejs.renderFile(
            path.join(__dirname, '..', 'templates', 'contactEmail.ejs'),
            { name, email, projectType, message }
        );

        const recipient = EMAIL_TO || EMAIL_USER;
        logger.info('Preparing to send contact email', {
            to: recipient,
            replyTo: email
        });

        const mailOptions = {
            from: `"BIRABRICK Contact Form" <${EMAIL_USER}>`,
            to: recipient,
            replyTo: email,
            subject: `New Contact Form Submission from ${name}`,
            html: emailHtml,
        };

        const transporter = getTransporter();
        const result = await transporter.sendMail(mailOptions);
        return result;
    } catch (error) {
        logger.error('Email sending failed', {
            message: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            response: error.response
        });
        throw error;
    }
};

module.exports = {
    sendContactEmail,
    verifyEmailConfig
}; 