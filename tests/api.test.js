// On définit les variables d'environnement AVANT d'importer l'application
process.env.COOKIE_SECRET = 'test_secret_123';
process.env.NODE_ENV = 'test';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'password123';

const request = require('supertest');
const { app, server } = require('../src/server');

// Mock du service d'email
const emailService = require('../src/services/emailService');
jest.mock('../src/services/emailService', () => ({
    sendContactEmail: jest.fn(),
    verifyEmailConfig: jest.fn().mockReturnValue(true)
}));

afterAll((done) => {
    server.close(done);
});

describe('API Integration Tests', () => {
    let csrfToken;
    let cookies;

    test('GET /health should return 200', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body).toHaveProperty('port');
    });

    test('GET /api/csrf-token should return a token and set a signed cookie', async () => {
        const response = await request(app).get('/api/csrf-token');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('csrfToken');
        expect(response.headers['set-cookie']).toBeDefined();
        
        csrfToken = response.body.csrfToken;
        cookies = response.headers['set-cookie'];
    });

    test('POST /api/contact should fail without CSRF token', async () => {
        const response = await request(app)
            .post('/api/contact')
            .send({ name: 'Test' });
        
        expect(response.status).toBe(403); 
    });

    test('POST /api/contact should succeed with valid data and CSRF', async () => {
        emailService.sendContactEmail.mockResolvedValue({ messageId: 'mock-id' });

        const contactData = {
            name: 'John Doe',
            email: 'john@example.com',
            projectType: 'Residential',
            message: 'Hello, this is a test message that is long enough.',
            captcha_ans: '10',
            captcha_n1: '5',
            captcha_n2: '5',
            csrfToken: csrfToken
        };

        const response = await request(app)
            .post('/api/contact')
            .set('Cookie', cookies)
            .set('x-csrf-token', csrfToken)
            .send(contactData);
        
        expect(response.status).toBe(200);
        expect(emailService.sendContactEmail).toHaveBeenCalled();
    });

    test('POST /api/contact should return 502 if email service fails', async () => {
        emailService.sendContactEmail.mockRejectedValue(new Error('SMTP Error'));

        const contactData = {
            name: 'John Doe',
            email: 'john@example.com',
            projectType: 'Residential',
            message: 'Hello, this is a test message that is long enough.',
            captcha_ans: '10',
            captcha_n1: '5',
            captcha_n2: '5',
            csrfToken: csrfToken
        };

        const response = await request(app)
            .post('/api/contact')
            .set('Cookie', cookies)
            .set('x-csrf-token', csrfToken)
            .send(contactData);
        
        expect(response.status).toBe(502);
        expect(response.body.message).toContain('Email service failed');
    });
});