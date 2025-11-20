import type { GmailConfig } from './config.js';

/**
 * Exchanges a Google OAuth2 refresh token for an access token.
 * @param cfg Gmail configuration containing OAuth credentials
 * @returns Access token string
 * @throws Error if token exchange fails
 */
export async function fetchAccessToken(
  cfg: GmailConfig
): Promise<string> {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: cfg.refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to fetch access token: ${response.status} ${response.statusText}\nResponse: ${body}`
    );
  }

  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!data.access_token) {
    throw new Error(
      `Access token not found in response: ${JSON.stringify(data)}`
    );
  }

  return data.access_token;
}

export interface MessageSummary {
  id: string;
  threadId: string;
}

/**
 * Lists Gmail messages with optional label and query filtering.
 * @param cfg Gmail configuration
 * @param accessToken OAuth access token
 * @param maxMessages Maximum number of messages to return (capped at 50)
 * @returns Array of message summaries with id and threadId
 * @throws Error if API call fails
 */
export async function listMessages(
  cfg: GmailConfig,
  accessToken: string,
  maxMessages: number = 10
): Promise<MessageSummary[]> {
  const maxResults = Math.min(maxMessages, 50);
  const url = new URL(
    `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(cfg.userEmail)}/messages`
  );

  url.searchParams.set('maxResults', maxResults.toString());

  if (cfg.intakeLabel) {
    url.searchParams.set('labelIds', cfg.intakeLabel);
  }

  if (cfg.query) {
    url.searchParams.set('q', cfg.query);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to list messages: ${response.status} ${response.statusText}\nResponse: ${body}`
    );
  }

  const data = (await response.json()) as {
    messages?: Array<{ id: string; threadId: string }>;
  };

  if (!data.messages) {
    return [];
  }

  return data.messages.map((msg) => ({
    id: msg.id,
    threadId: msg.threadId,
  }));
}

/**
 * Fetches a full Gmail message by ID.
 * @param cfg Gmail configuration
 * @param accessToken OAuth access token
 * @param id Message ID
 * @returns Full message object from Gmail API
 * @throws Error if API call fails
 */
export async function getMessage(
  cfg: GmailConfig,
  accessToken: string,
  id: string
): Promise<any> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(cfg.userEmail)}/messages/${id}?format=full`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to get message: ${response.status} ${response.statusText}\nResponse: ${body}`
    );
  }

  return await response.json();
}

