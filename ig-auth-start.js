// netlify/functions/ig-auth-start.js
// Redirects to Instagram OAuth authorization page
// Called when user clicks "Conectar Instagram" in the UI

exports.handler = async (event) => {
  const { clientId } = event.queryStringParameters || {};

  const APP_ID = process.env.META_APP_ID || '1653951508988012';
  const origin = process.env.URL || `https://${event.headers.host}`;
  const redirectUri = `${origin}/api/ig-auth-callback`;

  if (!clientId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'clientId is required' }) };
  }

  const scopes = [
    'instagram_business_basic',
    'instagram_business_content_publish',
  ].join(',');

  const state = Buffer.from(JSON.stringify({ clientId, ts: Date.now() })).toString('base64');

  const authUrl = new URL('https://www.instagram.com/oauth/authorize');
  authUrl.searchParams.set('client_id', APP_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  return {
    statusCode: 302,
    headers: { Location: authUrl.toString() },
    body: '',
  };
};
