/**
 * Gmail API configuration loaded from environment variables.
 */
export interface GmailConfig {
  /** OAuth2 client ID */
  clientId: string;
  /** OAuth2 client secret */
  clientSecret: string;
  /** OAuth2 refresh token */
  refreshToken: string;
  /** Gmail account email address */
  userEmail: string;
  /** Optional label ID for filtering messages by intake label */
  intakeLabel?: string;
  /** Optional label ID for processed messages */
  processedLabel?: string;
  /** Optional Gmail search query string for filtering messages */
  query?: string;
}

/**
 * Loads and validates Gmail configuration from environment variables.
 * 
 * Validates all required environment variables are present and non-empty.
 * Throws an Error listing all missing required variables if validation fails.
 * 
 * @returns Validated Gmail configuration object
 * @throws Error if any required environment variables are missing or empty
 * 
 * @example
 * ```typescript
 * const config = loadGmailConfig();
 * // Use config with Gmail API client functions
 * ```
 */
export function loadGmailConfig(): GmailConfig {
  const requiredVars: Array<{ name: string; value: string | undefined }> = [
    { name: 'GOOGLE_CLIENT_ID', value: process.env.GOOGLE_CLIENT_ID },
    { name: 'GOOGLE_CLIENT_SECRET', value: process.env.GOOGLE_CLIENT_SECRET },
    { name: 'GOOGLE_REFRESH_TOKEN', value: process.env.GOOGLE_REFRESH_TOKEN },
    { name: 'GMAIL_USER_EMAIL', value: process.env.GMAIL_USER_EMAIL },
  ];

  const missing = requiredVars
    .filter((v) => !v.value || v.value.trim() === '')
    .map((v) => v.name);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  return {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
    userEmail: process.env.GMAIL_USER_EMAIL!,
    intakeLabel: process.env.GMAIL_LABEL_INTAKE,
    processedLabel: process.env.GMAIL_LABEL_PROCESSED,
    query: process.env.GMAIL_QUERY,
  };
}

