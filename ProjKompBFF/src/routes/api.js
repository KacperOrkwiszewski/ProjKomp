const express = require('express');
const axios = require('axios');

const router = express.Router();

const SCHEDULE_API_URL = process.env.SCHEDULE_API_URL || 'http://77.237.23.131';

/**
 * GET /api/semester/faculties
 * Proxy to schedule API (pass-through)
 */
router.get('/semester/faculties', async (req, res) => {
  try {
    const response = await axios.get(`${SCHEDULE_API_URL}/semester/faculties`, {
      timeout: 10000,
    });

    res.json(response.data);
  } catch (error) {
    console.error('API proxy error:', error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Failed to fetch schedule data' };
    res.status(status).json(message);
  }
});

/**
 * GET /api/health
 * Check if schedule API is accessible
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${SCHEDULE_API_URL}/semester/faculties`, {
      timeout: 5000,
    });
    res.json({ status: 'ok', scheduleApiReachable: true });
  } catch (error) {
    res.status(503).json({ status: 'error', scheduleApiReachable: false, message: error.message });
  }
});

module.exports = router;
