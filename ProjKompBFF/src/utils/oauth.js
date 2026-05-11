const axios = require('axios');

const OAUTH_ENDPOINTS = {
  authorize: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
  token: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
  userinfo: 'https://graph.microsoft.com/v1.0/me',
};

function getAuthorizeUrl(tenantId, clientId, redirectUri, state) {
  const url = OAUTH_ENDPOINTS.authorize.replace('{tenant}', tenantId);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email User.Read',
    state: state,
    response_mode: 'query',
  });
  return `${url}?${params.toString()}`;
}

async function exchangeCodeForToken(tenantId, clientId, clientSecret, code, redirectUri) {
  const url = OAUTH_ENDPOINTS.token.replace('{tenant}', tenantId);
  
  try {
    // Microsoft OAuth requires application/x-www-form-urlencoded, not JSON
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: 'openid profile email User.Read',
    });

    const response = await axios.post(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    throw new Error('Failed to exchange authorization code for token');
  }
}

async function getUserInfo(accessToken) {
  try {
    const response = await axios.get(OAUTH_ENDPOINTS.userinfo, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('User info fetch error:', error.response?.data || error.message);
    throw new Error('Failed to fetch user information');
  }
}

function getTenantIdFromIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    return null;
  }

  try {
    const parts = idToken.split('.');
    if (parts.length < 2) {
      return null;
    }

    const payloadBase64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
    return typeof payload.tid === 'string' ? payload.tid : null;
  } catch {
    return null;
  }
}

module.exports = {
  getAuthorizeUrl,
  exchangeCodeForToken,
  getUserInfo,
  getTenantIdFromIdToken,
};
