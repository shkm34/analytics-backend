import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import ingestionRouter from './routes/ingestion.js';
import reportingRouter from './routes/reporting.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

//  routes
app.use('/', ingestionRouter);
app.use('/', reportingRouter);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Ingestion API running on port ${PORT}`);
      console.log(`POST /event - Event ingestion endpoint`)
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
