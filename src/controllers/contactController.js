// --- CORRECTION DES CHEMINS ---
// On utilise '../' pour sortir de 'controllers' et entrer dans les bons dossiers
const emailService = require('../services/emailService'); 
const logger = require('../utils/logger'); 

const contactControllerFactory = () => {
    // Note : On ne reçoit plus "emailQueue" car on n'utilise plus Redis[cite: 2]
    const contactFormSubmission = async (req, res) => {
        try {
            const { name, email, message, projectType } = req.body;

            // Log de la réception du formulaire
            logger.info(`Nouveau formulaire reçu de : ${email}`);

            // Envoi direct de l'e-mail
            await emailService.sendContactEmail({
                name,
                email,
                message,
                projectType
            });

            logger.info('E-mail envoyé avec succès (Direct)');
            
            res.status(200).json({ 
                message: 'Votre message a été envoyé avec succès !' 
            });

        } catch (error) {
            logger.error('Erreur dans contactFormSubmission', {
                message: error.message,
                stack: error.stack,
                code: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode
            });

            const isDev = process.env.NODE_ENV !== 'production';
            res.status(502).json({ 
                message: 'Email service failed. Please check server email configuration.',
                ...(isDev && {
                    debug: {
                        message: error.message,
                        code: error.code,
                        responseCode: error.responseCode,
                        response: error.response
                    }
                })
            });
        }
    };

    return { contactFormSubmission };
};

module.exports = contactControllerFactory;