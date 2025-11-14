import express from 'express';
import { getDB } from '../config/database.js';

const router = express.Router();

// GET /stats - Retrieve aggregated analytics
router.get('/stats', async (req, res) => {
  try {
    const { site_id, date } = req.query;

    // Validate required query parameters
    if (!site_id) {
      return res.status(400).json({
        success: false,
        error: 'site_id query parameter is required',
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'date query parameter is required (format: YYYY-MM-DD)',
      });
    }

    // Parse date and create date range for the entire day
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    // Validate date format
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const db = getDB();
    const eventsCollection = db.collection('events');

    // Query 1: Get total views for the site and date
    const totalViews = await eventsCollection.countDocuments({
      site_id: site_id,
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Query 2: Get unique users using aggregation
    const uniqueUsersResult = await eventsCollection.aggregate([
      {
        $match: {
          site_id: site_id,
          timestamp: {
            $gte: startDate,
            $lte: endDate,
          },
          user_id: { $ne: null }, // Exclude null user_ids
        },
      },
      {
        $group: {
          _id: '$user_id', // Group by unique user_id
        },
      },
      {
        $count: 'total', // Count the groups
      },
    ]).toArray();

    const uniqueUsers = uniqueUsersResult.length > 0 ? uniqueUsersResult[0].total : 0;

    // Query 3: Get top paths with view counts
    const topPaths = await eventsCollection.aggregate([
      {
        $match: {
          site_id: site_id,
          timestamp: {
            $gte: startDate,
            $lte: endDate,
          },
          path: { $ne: null }, // Exclude null paths
        },
      },
      {
        $group: {
          _id: '$path', // Group by path
          views: { $sum: 1 }, // Count views for each path
        },
      },
      {
        $sort: { views: -1 }, // Sort by views descending
      },
      {
        $limit: 10, // Get top 10 paths
      },
      {
        $project: {
          _id: 0,
          path: '$_id',
          views: 1,
        },
      },
    ]).toArray();

    // Return aggregated statistics
    return res.status(200).json({
      success: true,
      site_id: site_id,
      date: date,
      stats: {
        total_views: totalViews,
        unique_users: uniqueUsers,
        top_paths: topPaths,
      },
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
    });
  }
});

export default router;
