import Queue from 'bull';
import dotenv from 'dotenv';

dotenv.config();


// Create a queue for event ingestion
export const eventQueue = new Queue('events', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

eventQueue.on('error', (error) => {
  console.error('❌ Queue Error:', error);
});

eventQueue.on('ready', () => {
  console.log('✅ Connected to local Redis successfully');
});

console.log('✅ Event queue initialized');