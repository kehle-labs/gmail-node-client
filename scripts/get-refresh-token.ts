/**
 * One-time script to get OAuth2 refresh token for Desktop app.
 * 
 * This script:
 * 1. Opens a browser for user to authorize
 * 2. Captures the authorization code from the redirect URL
 * 3. Exchanges the code for access token and refresh token
 * 
 * Usage:
 * 1. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment
 * 2. Run: tsx scripts/get-refresh-token.ts
 * 3. Follow the browser prompts
 * 4. Copy the refresh_token from the output
 */

import { execSync } from 'child_process';
import { randomBytes } from 'crypto';
import http from 'http';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
  console.error('Usage: GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... tsx scripts/get-refresh-token.ts');
  process.exit(1);
}

// Desktop apps use localhost redirect URI (automatically allowed, no console config needed)
const REDIRECT_URI = 'http://localhost:8080/callback';
const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

// Generate state for CSRF protection
const state = randomBytes(16).toString('hex');

// Build authorization URL
const authParams = new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: SCOPE,
  access_type: 'offline', // Required to get refresh token
  prompt: 'consent', // Force consent to ensure refresh token
  state: state,
});

const authUrl = `${AUTH_URL}?${authParams.toString()}`;

console.log('Opening browser for authorization...');
console.log('If browser doesn\'t open, go to this URL:');
console.log(authUrl);
console.log('');

// Start local server to catch redirect
const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end('Invalid request');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const receivedState = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(200);
      res.end(`
        <html>
          <body>
            <h1>Authorization Error</h1>
            <p>Error: ${error}</p>
            <p>You can close this window.</p>
          </body>
        </html>
      `);
      server.close();
      process.exit(1);
      return;
    }

    if (!code || receivedState !== state) {
      res.writeHead(200);
      res.end(`
        <html>
          <body>
            <h1>Authorization Failed</h1>
            <p>Missing code or state mismatch.</p>
            <p>You can close this window.</p>
          </body>
        </html>
      `);
      server.close();
      process.exit(1);
      return;
    }

    // Exchange code for tokens
    exchangeCodeForTokens(code).then(() => {
      res.writeHead(200);
      res.end(`
        <html>
          <body>
            <h1>Authorization Successful!</h1>
            <p>Check the terminal for your refresh token.</p>
            <p>You can close this window.</p>
          </body>
        </html>
      `);
      server.close();
    }).catch((err) => {
      res.writeHead(200);
      res.end(`
        <html>
          <body>
            <h1>Error</h1>
            <p>${err.message}</p>
            <p>You can close this window.</p>
          </body>
        </html>
      `);
      server.close();
      process.exit(1);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8080, () => {
  console.log('Local server started on http://localhost:8080/callback');
  console.log('');
  
  // Try to open browser (works on most systems)
  try {
    if (process.platform === 'win32') {
      execSync(`start "" "${authUrl}"`);
    } else if (process.platform === 'darwin') {
      execSync(`open "${authUrl}"`);
    } else {
      execSync(`xdg-open "${authUrl}"`);
    }
  } catch (err) {
    console.log('Could not open browser automatically. Please open the URL above manually.');
  }
  
  console.log('Waiting for authorization...');
});

async function exchangeCodeForTokens(code: string): Promise<void> {
  const tokenParams = new URLSearchParams({
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenParams.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Token exchange failed: ${response.status} ${response.statusText}\n${errorBody}`
    );
  }

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (data.error) {
    throw new Error(`OAuth error: ${data.error}`);
  }

  if (!data.refresh_token) {
    throw new Error('No refresh_token in response. Make sure you selected "consent" and "offline" access.');
  }

  console.log('');
  console.log('✅ Successfully obtained refresh token!');
  console.log('');
  console.log('Add this to your .env.local file:');
  console.log('');
  console.log(`GOOGLE_REFRESH_TOKEN=${data.refresh_token}`);
  console.log('');
  console.log('⚠️  Save this refresh_token securely - you won\'t see it again!');
  console.log('');
}

