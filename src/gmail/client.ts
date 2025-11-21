import type { GmailConfig } from './config.js';

/**
 * Gmail message header structure.
 */
export interface MessageHeader {
  name: string;
  value: string;
}

/**
 * Gmail message payload structure.
 */
export interface MessagePayload {
  headers?: MessageHeader[];
  parts?: MessagePayload[];
  body?: {
    data?: string;
    size?: number;
  };
  mimeType?: string;
}

/**
 * Full Gmail message structure returned by the API.
 */
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: MessagePayload;
  sizeEstimate?: number;
  raw?: string;
}

/**
 * Exchanges a Google OAuth2 refresh token for an access token.
 * @param cfg Gmail configuration containing OAuth credentials
 * @returns Access token string
 * @throws Error if token exchange fails or response is invalid
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

/**
 * Summary of a Gmail message with minimal metadata.
 * Returned by listMessages() for efficient bulk operations.
 */
export interface MessageSummary {
  /** Gmail message ID */
  id: string;
  /** Gmail thread ID */
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
 * Fetches a Gmail message by ID with raw RFC 822 content.
 * @param cfg Gmail configuration
 * @param accessToken OAuth access token
 * @param id Message ID
 * @returns Gmail message object with raw field containing base64url-encoded RFC 822 message
 * @throws Error if API call fails or response is invalid
 */
export async function getMessage(
  cfg: GmailConfig,
  accessToken: string,
  id: string
): Promise<GmailMessage> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(cfg.userEmail)}/messages/${id}?format=raw`;

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

  const message = (await response.json()) as GmailMessage;
  
  if (!message.id) {
    throw new Error(
      `Invalid message response: missing message ID in response from Gmail API`
    );
  }

  return message;
}

