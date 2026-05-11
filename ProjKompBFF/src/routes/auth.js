const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getAuthorizeUrl, exchangeCodeForToken, getUserInfo, getTenantIdFromIdToken } = require('../utils/oauth');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const AUTHORITY = process.env.AZURE_AUTHORITY || process.env.AZURE_TENANT_ID || 'common';
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const REDIRECT_URI = process.env.AZURE_REDIRECT_URI;

/**
 * GET /auth/login
 * Initiates OAuth login flow
 */
router.get('/login', (req, res) => {
  const state = uuidv4();
  req.session.oauthState = state;

  const authorizeUrl = getAuthorizeUrl(AUTHORITY, CLIENT_ID, REDIRECT_URI, state);
  res.redirect(authorizeUrl);
});

/**
 * GET /auth/callback
 * OAuth callback from Microsoft
 */
router.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  // Error from Microsoft
  if (error) {
    console.error('OAuth error:', error, error_description);
    return res.redirect(`${process.env.FRONTEND_URL}?error=${encodeURIComponent(error)}`);
  }

  // Validate state
  if (state !== req.session.oauthState) {
    console.error('State mismatch');
    return res.status(400).json({ error: 'State mismatch - possible CSRF attack' });
  }

  try {
    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(
      AUTHORITY,
      CLIENT_ID,
      CLIENT_SECRET,
      code,
      REDIRECT_URI
    );

    const accessToken = tokenResponse.access_token;

    // Fetch user info
    const userInfo = await getUserInfo(accessToken);

    // Store user in session (not the token!)
    const resolvedTenantId = getTenantIdFromIdToken(tokenResponse.id_token) || 'unknown';
    req.session.user = {
      id: userInfo.id,
      displayName: userInfo.displayName,
      email: userInfo.mail || userInfo.userPrincipalName,
      tenantId: resolvedTenantId,
      loginTime: new Date(),
    };

    console.log(`✅ User logged in: ${userInfo.mail || userInfo.userPrincipalName}`);

    // Redirect back to frontend
    res.redirect(process.env.FRONTEND_URL);
  } catch (error) {
    console.error('Callback error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json(req.session.user);
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => {
  if (req.session.user) {
    const email = req.session.user.email;
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      console.log(`👋 User logged out: ${email}`);
      res.json({ success: true, message: 'Logged out' });
    });
  } else {
    res.json({ success: true, message: 'Already logged out' });
  }
});

module.exports = router;
