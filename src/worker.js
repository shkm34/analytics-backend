import { eventQueue } from './config/queue.js';
import { connectDB, getDB } from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB before starting worker
await connectDB();

console.log('Worker process started');
console.log('Watching for jobs in the queue');

// Define how to process each job
eventQueue.process(async (job) => {
  console.log(`\n Processing job ${job.id}`);
  console.log('Event data:', job.data);

  try {
    const db = getDB();
    const eventsCollection = db.collection('events');

    // Prepare event document for MongoDB
    const eventDocument = {
      site_id: job.data.site_id,
      event_type: job.data.event_type,
      path: job.data.path || null,
      user_id: job.data.user_id || null,
      timestamp: new Date(job.data.timestamp),
      created_at: new Date(),
    };

    // Insert event into MongoDB
    const result = await eventsCollection.insertOne(eventDocument);
    
    console.log(`Job ${job.id} completed - MongoDB ID: ${result.insertedId}`);
    
    // Return success data - Bull stores this with the completed job
    return {
      success: true,
      mongoId: result.insertedId,
      processedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error(`Job ${job.id} failed:`, error.message);
    
    // Throw error so Bull knows the job failed and can retry
    throw error;
  }
});

// Worker event listeners
eventQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} has been completed`);
});

eventQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed after all retries: ${error.message}`);
});

eventQueue.on('error', (error) => {
  console.error('Worker error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n Shutting down worker');
  await eventQueue.close();
  process.exit(0);
});
