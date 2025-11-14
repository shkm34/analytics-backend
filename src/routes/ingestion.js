import express from 'express';
import { eventQueue } from '../config/queue.js';
import { validateEvent } from '../utils/validation.js';

const router = express.Router();

// POST /event - Fast ingestion endpoint
router.post('/event', async (req, res) => {
  try {
    // Validate the incoming event data
    const validation = validateEvent(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    // Add timestamp if not provided
    const eventData = {
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString(),
    };

    // Push to Redis queue (instant - no DB wait)
    const job = await eventQueue.add(eventData);

    // Return success immediately
    return res.status(202).json({
      success: true,
      message: 'Event queued for processing',
      job_id: job.id,
    });

  } catch (error) {
    console.error('Error queuing event:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to queue event',
    });
  }
});

export default router;
