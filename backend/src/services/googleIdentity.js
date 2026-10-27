const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const ATTEMPT_TIMEOUT_MS = 4500;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class GoogleIdentityError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'GoogleIdentityError';
    this.statusCode = statusCode;
  }
}

async function getGoogleUserInfo(accessToken, { fetchImpl = fetch, wait = sleep } = {}) {
  // Retry only the read from Google, before creating a user or issuing a session.
  // Two bounded attempts plus backoff stay below the previous ten-second timeout.
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
    try {
      const response = await fetchImpl(USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal
      });
      if (response.ok) return await response.json();
      if ([400, 401, 403].includes(response.status)) {
        throw new GoogleIdentityError(401, 'Invalid Google access token.');
      }
      // Do not retry permanent errors, or misreport Google's outage as bad credentials.
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) {
      if (error instanceof GoogleIdentityError) throw error;
      // Network failures, timeouts, and incomplete JSON can be temporary.
    } finally {
      clearTimeout(timeout);
    }
    if (attempt === 0) await wait(150);
  }
  throw new GoogleIdentityError(503, 'Google sign-in is temporarily unavailable. Please try again.');
}

module.exports = { getGoogleUserInfo, GoogleIdentityError };
