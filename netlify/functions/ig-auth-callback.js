// netlify/functions/ig-auth-callback.js
// Handles the redirect back from Instagram after user logs in.
// Exchanges the code for a long-lived token, fetches the profile,
// then redirects back to the frontend with the account data in the URL.

exports.handler = async (event) => {
  const APP_ID     = process.env.META_APP_ID     || '1653951508988012';
  const APP_SECRET = process.env.META_APP_SECRET || '0467b00ecb00000dfd4be98dfa7cda75';
  const origin     = process.env.URL             || `https://${event.headers.host}`;
  const redirectUri = `${origin}/api/ig-auth-callback`;

  const { code, state, error: oauthError, error_reason } = event.queryStringParameters || {};

  // ── User denied ──────────────────────────────────────────────────────────────
  if (oauthError) {
    return redirect(origin, { error: error_reason || oauthError, state });
  }

  if (!code) {
    return redirect(origin, { error: 'no_code', state });
  }

  // ── Decode state ─────────────────────────────────────────────────────────────
  let clientId = null;
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    clientId = parsed.clientId;
  } catch {
    return redirect(origin, { error: 'invalid_state' });
  }

  try {
    // ── Step A: Short-lived token ─────────────────────────────────────────────
    const tokenForm = new URLSearchParams({
      client_id: APP_ID,
      client_secret: APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes  = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: tokenForm,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token || !tokenData.user_id) {
      return redirect(origin, { error: tokenData.error_message || 'token_exchange_failed', clientId });
    }

    const shortToken     = tokenData.access_token;
    const instagramUserId = String(tokenData.user_id);

    // ── Step B: Long-lived token (60 days) ────────────────────────────────────
    const longRes  = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${APP_SECRET}&access_token=${shortToken}`
    );
    const longData = await longRes.json();
    const accessToken = longData.access_token || shortToken;
    const expiresIn   = longData.expires_in   || 5184000; // 60 days default

    // ── Step C: Fetch profile ─────────────────────────────────────────────────
    const profileRes  = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,username,profile_picture_url,followers_count&access_token=${accessToken}`
    );
    const profile = await profileRes.json();

    if (!profile.id || !profile.username) {
      return redirect(origin, { error: 'profile_fetch_failed', clientId });
    }

    // ── Step D: Send data back to frontend via URL params ─────────────────────
    return redirect(origin, {
      success: '1',
      clientId,
      igUserId:       profile.id,
      username:       profile.username,
      picUrl:         profile.profile_picture_url || '',
      followers:      String(profile.followers_count || 0),
      token:          accessToken,
      expiresIn:      String(expiresIn),
    });

  } catch (err) {
    return redirect(origin, { error: err.message || 'unknown_error', clientId });
  }
};

function redirect(origin, params) {
  const url = new URL('/', origin);
  url.searchParams.set('oauth_result', JSON.stringify(params));
  return {
    statusCode: 302,
    headers: { Location: url.toString() },
    body: '',
  };
}
