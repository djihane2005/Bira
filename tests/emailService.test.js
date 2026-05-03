const { sendContactEmail } = require('../src/services/emailService');
const nodemailer = require('nodemailer');
const ejs = require('ejs');

jest.mock('nodemailer');
jest.mock('ejs');

describe('Email Service Unit Tests', () => {
    let mockTransporter;

    beforeEach(() => {
        process.env.EMAIL_USER = 'test@example.com';
        process.env.EMAIL_PASS = 'testpass';
        process.env.EMAIL_TO = 'recipient@example.com';
        
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: '123' })
        };
        nodemailer.createTransport.mockReturnValue(mockTransporter);
        ejs.renderFile.mockResolvedValue('<html>HTML CONTENT</html>');
    });

    test('Should render template and call sendMail with correct options', async () => {
        const data = { 
            name: 'Djihane', 
            email: 'sender@example.com', 
            projectType: 'Residential', 
            message: 'Hello world' 
        };
        
        await sendContactEmail(data);

        expect(ejs.renderFile).toHaveBeenCalled();
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                from: '"BIRABRICK Contact Form" <test@example.com>',
                to: 'recipient@example.com',
                replyTo: 'sender@example.com',
                subject: expect.stringContaining('Djihane'),
                html: '<html>HTML CONTENT</html>'
            })
        );
    });

    test('Should throw error if credentials are missing', async () => {
        delete process.env.EMAIL_USER;
        const data = { name: 'Test' };
        
        await expect(sendContactEmail(data)).rejects.toThrow('Email configuration missing');
    });
});