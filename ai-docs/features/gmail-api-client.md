# Gmail API Client Library

**Feature Name**: Gmail API Client Library  
**Date**: 20251120  
**Status**: Complete  
**Design**: `ai-docs/ai-design/20251120_design_gmail_test_harness.md`  
**Implementation**: `ai-docs/ai-implementation/20251120_implementation_gmail_test_harness.md`  
**Repository**: `gmail-node-client`

## Overview

Production-worthy Node.js + TypeScript Gmail API client library for OAuth2 authentication and message operations. Provides reusable, maintainable code following best practices that can be integrated into production applications.

## Capabilities

### OAuth2 Authentication
- Exchange Google OAuth2 refresh tokens for access tokens
- Secure credential management via environment variables
- Fail-hard validation of required configuration

### Message Operations
- List Gmail messages with configurable limits (max 50 per API call)
- Filter messages by label (`GMAIL_LABEL_INTAKE`) or search query (`GMAIL_QUERY`)
- Fetch full message details by message ID
- Type-safe message structures with complete TypeScript definitions

### Library Features
- **Full Type Safety**: Proper TypeScript interfaces for all Gmail API responses
- **Comprehensive Documentation**: Complete JSDoc comments with examples
- **Fail-Hard Error Handling**: Clear error messages with HTTP status codes
- **Security**: Never logs tokens, secrets, or Authorization headers
- **Minimal Dependencies**: Uses native `fetch` API (no heavy googleapis dependency)

## Usage

### Installation

```bash
npm install dotenv
npm install --save-dev typescript tsx @types/node
```

### Basic Usage

```typescript
import { loadGmailConfig } from './gmail/config.js';
import { fetchAccessToken, listMessages, getMessage } from './gmail/client.js';

// 1. Load configuration from environment variables
const config = loadGmailConfig();

// 2. Exchange refresh token for access token
const accessToken = await fetchAccessToken(config);

// 3. List messages (with optional filtering)
const messages = await listMessages(config, accessToken, 10);

// 4. Fetch full message details
const message = await getMessage(config, accessToken, messages[0].id);
```

### Configuration

Set these environment variables:

**Required:**
- `GOOGLE_CLIENT_ID` - OAuth2 client ID
- `GOOGLE_CLIENT_SECRET` - OAuth2 client secret
- `GOOGLE_REFRESH_TOKEN` - OAuth2 refresh token
- `GMAIL_USER_EMAIL` - Gmail account email address

**Optional:**
- `GMAIL_LABEL_INTAKE` - Label ID for filtering messages
- `GMAIL_LABEL_PROCESSED` - Label ID for processed messages
- `GMAIL_QUERY` - Gmail search query string

### Advanced Usage: Polling

For production polling scenarios (e.g., checking for new emails every 5 minutes):

```typescript
import { loadGmailConfig } from './gmail/config.js';
import { fetchAccessToken, listMessages } from './gmail/client.js';

const config = loadGmailConfig();

async function pollForNewMessages() {
  // Refresh access token (tokens expire after 1 hour)
  const accessToken = await fetchAccessToken(config);
  
  // List messages with filtering
  const messages = await listMessages(config, accessToken, 50, {
    labelIds: config.intakeLabel,
    query: config.query
  });
  
  return messages;
}

// Poll every 5 minutes
setInterval(async () => {
  try {
    const messages = await pollForNewMessages();
    console.log(`Found ${messages.length} new messages`);
    // Process messages...
  } catch (error) {
    console.error('Error polling messages:', error);
  }
}, 5 * 60 * 1000); // 5 minutes
```

### Error Handling

All functions throw `Error` objects with clear messages:

```typescript
try {
  const config = loadGmailConfig();
} catch (error) {
  // Error message lists all missing required variables
  console.error(error.message);
  // "Missing required environment variables: GOOGLE_CLIENT_ID, GMAIL_USER_EMAIL"
}

try {
  const token = await fetchAccessToken(config);
} catch (error) {
  // Error includes HTTP status and response body
  console.error(error.message);
  // "Failed to fetch access token: 401 Unauthorized\nResponse: {...}"
}
```

## Type Definitions

### GmailConfig
```typescript
interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  userEmail: string;
  intakeLabel?: string;
  processedLabel?: string;
  query?: string;
}
```

### MessageSummary
```typescript
interface MessageSummary {
  id: string;        // Gmail message ID
  threadId: string;  // Gmail thread ID
}
```

### GmailMessage
```typescript
interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: MessagePayload;
  // ... full Gmail API message structure
}
```

See `src/gmail/client.ts` for complete type definitions.

## CLI Tool

The library includes a CLI tool for testing:

```bash
# List 5 messages (default)
npm run gmail:list

# List specific number of messages
npm run gmail:list 10
```

## Production Considerations

### Rate Limits
Gmail API has rate limits (250 quota units per user per second). The library respects these limits and is suitable for polling at 5-minute intervals (or down to 1-minute minimum for single-user scenarios).

### Token Caching
For production polling, consider implementing access token caching. Access tokens are valid for 1 hour, so cache them to reduce API calls:

```typescript
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(config: GmailConfig): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }
  
  const token = await fetchAccessToken(config);
  cachedToken = {
    token,
    expiresAt: now + 55 * 60 * 1000 // Cache for 55 minutes (5 min buffer)
  };
  
  return token;
}
```

### Monitoring
Watch for:
- Token refresh failures (may indicate revoked refresh token)
- API rate limit errors (429 responses)
- Error patterns in logs (may indicate API changes)

## Integration

To integrate into another application:

1. Copy `src/gmail/config.ts` and `src/gmail/client.ts` to your application
2. Install dependencies: `dotenv` (runtime), `typescript` and `@types/node` (dev)
3. Adapt environment variable names if needed
4. Import and use the functions as shown above

## References

- **Design Document**: `ai-docs/ai-design/20251120_design_gmail_test_harness.md`
- **Implementation Doc**: `ai-docs/ai-implementation/20251120_implementation_gmail_test_harness.md`
- **Repository**: `gmail-node-client`
- **Gmail API Documentation**: https://developers.google.com/gmail/api

