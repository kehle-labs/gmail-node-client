export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  userEmail: string;
  intakeLabel?: string;
  processedLabel?: string;
  query?: string;
}

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

