const express = require('express');
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const SCHEDULE_API_URL = process.env.SCHEDULE_API_URL;

/**
 * GET /api/semester/faculties
 * Proxy to schedule API (pass-through) with auth check
 */
router.get('/semester/faculties', requireAuth, async (req, res) => {
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

/**
 * POST /api/timetable/prompt
 * Proxy prompt requests to the schedule API
 */
router.post('/timetable/prompt', requireAuth, async (req, res) => {
  try {
    const response = await axios.post(`${SCHEDULE_API_URL}/timetable/prompt`, req.body, {
      headers: { Authorization: `Bearer ${req.cookies.auth_token}` },
      timeout: 30000, // Longer timeout for prompts
    });
    res.json(response.data);
  } catch (error) {
    console.error('API proxy error (prompt):', error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Failed to process prompt' };
    res.status(status).json(message);
  }
});

/**
 * GET /api/timetable
 * Proxy to schedule API - fetch user timetable
 */
router.get('/timetable', requireAuth, async (req, res) => {
  try {
    const response = await axios.get(`${SCHEDULE_API_URL}/timetable`, {
      headers: { Authorization: `Bearer ${req.cookies.auth_token}` },
      timeout: 10000,
    });
    res.json(response.data);
  } catch (error) {
    console.error('API proxy error (GET /timetable):', error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Failed to fetch timetable' };
    res.status(status).json(message);
  }
});

/**
 * PUT /api/timetable
 * Proxy to schedule API - add class to timetable
 */
router.put('/timetable', requireAuth, async (req, res) => {
  try {
    const response = await axios.put(`${SCHEDULE_API_URL}/timetable`, req.body, {
      headers: { Authorization: `Bearer ${req.cookies.auth_token}` },
      timeout: 10000,
    });
    res.status(response.status).send(response.data || '');
  } catch (error) {
    console.error('API proxy error (PUT /timetable):', error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Failed to add class' };
    res.status(status).json(message);
  }
});

/**
 * PATCH /api/timetable/:id
 * Proxy to schedule API - update class in timetable
 */
router.patch('/timetable/:id', requireAuth, async (req, res) => {
  try {
    const response = await axios.patch(`${SCHEDULE_API_URL}/timetable/${req.params.id}`, req.body, {
      headers: { Authorization: `Bearer ${req.cookies.auth_token}` },
      timeout: 10000,
    });
    res.status(response.status).send(response.data || '');
  } catch (error) {
    console.error('API proxy error (PATCH /timetable/:id):', error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Failed to update class' };
    res.status(status).json(message);
  }
});

/**
 * DELETE /api/timetable/:id
 * Proxy to schedule API - remove class from timetable
 */
router.delete('/timetable/:id', requireAuth, async (req, res) => {
  try {
    const response = await axios.delete(`${SCHEDULE_API_URL}/timetable/${req.params.id}`, {
      headers: { Authorization: `Bearer ${req.cookies.auth_token}` },
      timeout: 10000,
    });
    res.status(response.status).send(response.data || '');
  } catch (error) {
    console.error('API proxy error (DELETE /timetable/:id):', error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Failed to remove class' };
    res.status(status).json(message);
  }
});

/**
 * DELETE /api/timetable
 * Proxy to schedule API - clear entire timetable
 */
router.delete('/timetable', requireAuth, async (req, res) => {
  try {
    const response = await axios.delete(`${SCHEDULE_API_URL}/timetable`, {
      headers: { Authorization: `Bearer ${req.cookies.auth_token}` },
      timeout: 10000,
    });
    res.status(response.status).send(response.data || '');
  } catch (error) {
    console.error('API proxy error (DELETE /timetable):', error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: 'Failed to clear timetable' };
    res.status(status).json(message);
  }
});

module.exports = router;
