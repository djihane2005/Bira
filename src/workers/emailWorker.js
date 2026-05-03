const { Worker } = require('bullmq');
const { sendContactEmail } = require('../services/emailService');
const logger = require('../utils/logger');
require('dotenv').config();

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
};

const emailProcessor = async (job) => {
    logger.info(`Processing email job ${job.id} for ${job.data.email}`);
    try {
        await sendContactEmail(job.data);
        logger.info(`Successfully processed email job ${job.id}`);
    } catch (error) {
        logger.error(`Failed to process email job ${job.id}: %o`, error);
        throw error; // BullMQ will handle retries if configured
    }
};

const worker = new Worker('emailQueue', emailProcessor, { connection });

worker.on('failed', (job, err) => {
    logger.error(`${job.id} has failed with ${err.message}`);
});

module.exports = { worker, emailProcessor };