# Analytics Backend System

A high-performance website analytics event capture system built with Node.js, Express, MongoDB, Redis, and Bull queue. This system handles high-volume event ingestion with minimal latency through asynchronous processing.

## Architecture Overview

This project implements three distinct services:

### 1. Ingestion API (Fast Event Capture)
- **Endpoint**: `POST /event`
- **Purpose**: Receives analytics events with minimal latency
- **Performance**: Returns `202 Accepted` in under 10ms
- **Technology**: Express.js + Bull Queue + Redis

### 2. Background Worker (Async Processing)
- **Purpose**: Processes queued events asynchronously
- **Features**: Automatic retries, exponential backoff, failure handling
- **Technology**: Bull Queue Consumer + MongoDB

### 3. Reporting API (Analytics Aggregation)
- **Endpoint**: `GET /stats`
- **Purpose**: Returns aggregated analytics for a site and date
- **Metrics**: Total views, unique users, top pages
- **Technology**: MongoDB Aggregation Pipeline

## Why This Architecture?

**Problem**: Traditional synchronous database writes block the API response, causing slow ingestion times (30-50ms per request).

**Solution**: Queue-based architecture decouples ingestion from persistence:
1. API validates event and adds to Redis queue (< 5ms)
2. Client receives immediate response
3. Worker processes queue in background
4. MongoDB writes happen asynchronously

**Benefits**:
- 6x faster ingestion compared to direct database writes
- Can handle thousands of events per second
- Resilient to database failures (events stay in queue)
- Automatic retry mechanism for failed jobs

## Technology Stack

- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB (for event storage and analytics)
- **Queue**: Redis + Bull (for asynchronous job processing)
- **Languages**: JavaScript

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)

## Installation

### 1. Clone and Install Dependencies

git clone <your-repo-url>
cd analytics-backend
npm instal

**Ubuntu/WSL**:

sudo apt-get update
sudo apt-get install mongodb
sudo service mongodb start

**Ubuntu/WSL**:
sudo apt-get install redis-server
sudo service redis-server start

Verify Redis is running:
redis-cli ping # Should return: PONG



### 4. Environment Configuration

Create a `.env` file in the project root:

Server Configuration
PORT=3000
NODE_ENV=development

MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/analytics

Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379



## Running the Application

You need to run **two processes simultaneously**:

### Terminal 1: Start API Server

npm start



Expected output:
✅ Event queue initialized
✅ MongoDB connected successfully
🚀 Ingestion API running on port 3000
📍 POST /event - Event ingestion endpoint
📊 GET /stats - Analytics reporting endpoint



### Terminal 2: Start Background Worker

npm run worker



Expected output:
✅ MongoDB connected successfully
🔨 Worker process started
👀 Watching for jobs in the queue...



## API Documentation

### POST /event - Event Ingestion

Captures a website analytics event and queues it for processing.

**Request:**
curl -X POST http://localhost:3000/event
-H "Content-Type: application/json"
-d '{
"site_id": "site-abc-123",
"event_type": "page_view",
"path": "/pricing",
"user_id": "user-xyz-789",
"timestamp": "2025-11-14T10:00:00Z"
}'



**Request Body Schema:**
- `site_id` (string, required): Unique identifier for the website
- `event_type` (string, required): Type of event (e.g., "page_view")
- `path` (string, optional): URL path visited
- `user_id` (string, optional): Unique identifier for the user
- `timestamp` (string, optional): ISO 8601 timestamp (defaults to current time)

**Success Response (202 Accepted):**
{
"success": true,
"message": "Event queued for processing",
"job_id": 1
}



**Error Response (400 Bad Request):**
{
"success": false,
"errors": ["site_id is required and must be a string"]
}



### GET /stats - Analytics Reporting

Retrieves aggregated analytics for a specific site and date.

**Request:**
curl "http://localhost:3000/stats?site_id=site-abc-123&date=2025-11-14"



**Query Parameters:**
- `site_id` (string, required): Site identifier
- `date` (string, required): Date in YYYY-MM-DD format

**Success Response (200 OK):**
{
"success": true,
"site_id": "site-abc-123",
"date": "2025-11-14",
"stats": {
"total_views": 150,
"unique_users": 42,
"top_paths": [
{
"path": "/home",
"views": 45
},
{
"path": "/pricing",
"views": 30
}
]
}
}



**Error Responses:**

Missing site_id (400):
{
"success": false,
"error": "site_id query parameter is required"
}



Invalid date format (400):
{
"success": false,
"error": "Invalid date format. Use YYYY-MM-DD"
}



## Database Schema

### Events Collection

{
_id: ObjectId,
site_id: String, // Website identifier
event_type: String, // Event type (e.g., "page_view")
path: String, // URL path (nullable)
user_id: String, // User identifier (nullable)
timestamp: Date, // Event timestamp
created_at: Date // Database insert timestamp
}



**Indexes:**
- `{ site_id: 1, timestamp: -1 }` - For efficient date range queries
- `{ user_id: 1 }` - For unique user counting

## Testing

Run the comprehensive test suite:

chmod +x test-api.sh
./test-api.sh



This tests:
- Health check endpoint
- Valid event ingestion
- Multiple concurrent events
- Validation error handling
- Statistics retrieval
- Error cases for missing/invalid parameters

## Monitoring

### Check Queue Status

In Redis CLI:
redis-cli

KEYS bull:events:* # View all queue keys
LLEN bull:events:wait # Count waiting jobs
LRANGE bull:events:wait 0 -1 # View waiting job IDs



### Check Database

In MongoDB shell:
mongosh

use analytics
db.events.countDocuments() # Total events stored
db.events.find().limit(5) # View recent events



## Architecture Decisions

### Why Redis Queue Instead of Direct Database Writes?

**Direct writes** force clients to wait for MongoDB operations (30-50ms). **Queue-based ingestion** acknowledges events in under 10ms, meeting the assignment's speed requirement.

### Why Separate Worker Process?

Decoupling allows the API to stay responsive even if MongoDB is slow or down. Events accumulate in Redis and process when the database recovers.

### Why Bull Over Other Queue Libraries?

Bull provides built-in retry logic, job prioritization, delayed jobs, and excellent Node.js integration with minimal configuration.

## Project Structure

```
analytics-backend/
├── src/
│ ├── server.js # Main API server
│ ├── worker.js # Background job processor
│ ├── routes/
│ │ ├── ingestion.js # POST /event endpoint
│ │ └── reporting.js # GET /stats endpoint
│ ├── config/
│ │ ├── database.js # MongoDB connection
│ │ └── queue.js # Bull queue configuration
│ └── utils/
│ └── validation.js # Request validation
├── .env # Environment variables
├── package.json
├── README.md
└── test-api.sh # API test suite

```

## Performance Benchmarks

- **Ingestion latency**: < 10ms per event
- **Throughput**: 1000+ events/second
- **Worker processing**: ~50ms per event (MongoDB write)
- **Stats query**: 100-200ms (aggregation on 10K events)
