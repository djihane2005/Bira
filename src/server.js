require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const crypto = require('crypto');

const app = express();

// Nécessaire pour Render car il utilise un proxy inverse
app.set('trust proxy', 1);

// Imports locaux
const logger = require('./utils/logger');
const { contactValidationRules, validate } = require('./middleware/validators');
const csrfProtection = require('./middleware/csrfProtection');
const contactControllerFactory = require('./controllers/contactController');

// Configuration Swagger
const swaggerDocument = YAML.load(path.join(__dirname, 'middleware/config/swagger.yaml'));

const PORT = process.env.PORT || 3000;

// Validation de l'environnement au démarrage
const isProduction = process.env.NODE_ENV === 'production';

const requiredEnvVars = ['COOKIE_SECRET', 'EMAIL_USER', 'EMAIL_PASS', 'FRONTEND_ORIGINS'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    const errorMsg = `Missing environment variables: ${missingEnvVars.join(', ')}`;
    if (isProduction) {
        logger.error(`FATAL: ${errorMsg}. Required for production.`);
        process.exit(1);
    } else {
        logger.warn(`WARNING: ${errorMsg}. Some features may not work correctly in development.`);
    }
}

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
});

const { contactFormSubmission } = contactControllerFactory();

// Middlewares
app.use(cookieParser(process.env.COOKIE_SECRET));

// Configuration CORS
const getFrontendOrigins = () => {
    const origins = process.env.FRONTEND_ORIGINS 
        ? process.env.FRONTEND_ORIGINS.split(',').map(o => o.trim()) 
        : [];
    
    // In development, also allow local origins
    if (!isProduction) {
        origins.push('http://127.0.0.1:5500', 'http://localhost:5500');
    }
    return origins;
};

const allowedOrigins = getFrontendOrigins();

const corsOptions = {
    origin: (origin, callback) => {
        // Autorise les requêtes sans origine (ex: Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn('CORS blocked origin', { origin });
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-csrf-token']
};

app.options('*', cors(corsOptions)); // Handle preflight
app.use(cors(corsOptions));
app.use(express.json({ limit: '20kb' }));
app.use(helmet());

// Health Check
app.get('/', (req, res) => {
    res.json({
        status: "ok",
        service: "birabrick-backend",
        environment: process.env.NODE_ENV || "development"
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: "ok",
        service: "birabrick-backend",
        environment: process.env.NODE_ENV || "development"
    });
});

// Routes
app.get('/api/csrf-token', (req, res) => {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(32).toString('hex');
    const data = `${timestamp}.${nonce}`;
    
    const signature = crypto
        .createHmac('sha256', process.env.COOKIE_SECRET)
        .update(data)
        .digest('hex');

    const csrfToken = `${data}.${signature}`;

    res.json({ csrfToken });
});

app.post('/api/contact',
    contactLimiter,
    csrfProtection,
    contactValidationRules,
    validate,
    contactFormSubmission);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Gestion des erreurs
app.use((err, req, res, next) => {
    logger.error('Unhandled Error', {
        message: err.message,
        stack: err.stack,
        status: err.status
    });
    res.status(err.status || 500).json({ message: err.message });
});

// Démarrage du serveur
const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Backend server running on port ${PORT}`);
});

// Server error handler
server.on('error', (error) => {
    logger.error('Server listen error', {
      message: error.message,
      code: error.code,
      port: PORT,
      stack: error.stack
    });
    process.exit(1);
});

// Export pour tests
module.exports = { app, server };