const { emailProcessor } = require('../src/workers/emailWorker');
const { sendContactEmail } = require('../src/services/emailService');
const logger = require('../src/utils/logger');

jest.mock('../src/services/emailService');
jest.mock('../src/utils/logger');

describe('Email Worker Processor Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should process the job successfully', async () => {
        const mockJob = {
            id: 'job-123',
            data: { name: 'Djihane', email: 'djihane@example.com' }
        };

        sendContactEmail.mockResolvedValueOnce({ messageId: 'msg-abc' });

        await emailProcessor(mockJob);

        expect(sendContactEmail).toHaveBeenCalledWith(mockJob.data);
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Successfully processed email job job-123')); // Log de succès[cite: 20]
    });

    test('should log error when sendContactEmail fails', async () => {
        const mockJob = { id: 'job-err', data: { email: 'fail@example.com' } };
        const mockError = new Error('SMTP Error');

        sendContactEmail.mockRejectedValueOnce(mockError);

        await expect(emailProcessor(mockJob)).rejects.toThrow('SMTP Error');
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to process email job job-err'), mockError); // Log d'erreur[cite: 20]
    });
});