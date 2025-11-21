# Gmail API Integration Patterns

**Date**: 20251120  
**Context**: Gmail API Client Library Implementation  
**Status**: Active

## Overview

This document captures patterns, best practices, and lessons learned from implementing a production-worthy Gmail API client library. These patterns should be followed for future Gmail API integrations or similar OAuth2-based API integrations.

## Core Principles

### 1. Fail-Hard Error Handling

**Pattern**: Always throw clear errors, never return null/undefined on failure.

**Rationale**: Production code should never fail silently. Clear error messages aid debugging and force proper error handling in calling code.

**Example**:
```typescript
// ✅ CORRECT: Throw clear error
if (!data.access_token) {
  throw new Error(
    `Access token not found in response: ${JSON.stringify(data)}`
  );
}

// ❌ WRONG: Silent failure
if (!data.access_token) {
  return null; // Never do this!
}
```

### 2. Type Safety First

**Pattern**: Define proper TypeScript interfaces for all API responses, never use `any`.

**Rationale**: Type safety catches errors at compile time, improves IDE support, and makes code self-documenting.

**Example**:
```typescript
// ✅ CORRECT: Proper interfaces
interface GmailMessage {
  id: string;
  threadId: string;
  payload?: MessagePayload;
}

export async function getMessage(...): Promise<GmailMessage> {
  // Implementation
}

// ❌ WRONG: Using any
export async function getMessage(...): Promise<any> {
  // Avoid any types in production code
}
```

### 3. Security: Never Log Sensitive Data

**Pattern**: Never log tokens, secrets, or Authorization headers. Error messages may include HTTP status codes and non-sensitive response snippets only.

**Rationale**: Security best practice - sensitive data in logs is a security risk.

**Example**:
```typescript
// ✅ CORRECT: Log status codes, not tokens
throw new Error(
  `Failed to fetch access token: ${response.status} ${response.statusText}\nResponse: ${body}`
);

// ❌ WRONG: Logging Authorization header
console.log('Authorization:', `Bearer ${accessToken}`); // Never!
```

### 4. Response Validation

**Pattern**: Validate API responses before using them, especially required fields.

**Rationale**: API responses may change or be malformed. Validate early to catch issues.

**Example**:
```typescript
const message = (await response.json()) as GmailMessage;

if (!message.id) {
  throw new Error(
    `Invalid message response: missing message ID in response from Gmail API`
  );
}

return message;
```

### 5. Configuration Validation

**Pattern**: Validate all required configuration at startup, throw clear error listing all missing variables.

**Rationale**: Fail fast on configuration errors with actionable error messages.

**Example**:
```typescript
const missing = requiredVars
  .filter((v) => !v.value || v.value.trim() === '')
  .map((v) => v.name);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}`
  );
}
```

## Architectural Patterns

### Native Fetch vs Heavy Libraries

**Decision**: Use native `fetch` API instead of heavy libraries like `googleapis`.

**When to Use Native Fetch**:
- You want minimal dependencies
- You need transparent, debuggable API calls
- You're building reusable library code
- Native fetch is stable in your Node.js version (22+)

**When to Use Heavy Libraries**:
- You need automatic retries and complex error handling
- You're building internal tools where dependencies don't matter
- The library provides significant value (edge case handling, etc.)

**Our Pattern**: For production library code, prefer native fetch for transparency and minimal dependencies.

### Modular Library Structure

**Pattern**: Separate concerns into distinct modules:
- Configuration loading (`config.ts`)
- API client functions (`client.ts`)
- CLI tools (`bin/`)

**Rationale**: Clean separation makes code reusable, testable, and maintainable.

**Structure**:
```
src/
├── gmail/
│   ├── config.ts   # Configuration concerns
│   └── client.ts   # API client concerns
└── bin/
    └── cli.ts      # CLI-specific concerns
```

### Environment Variable Loading

**Pattern**: Load environment variables via dotenv from `.env.local`, validate at module load time.

**Rationale**: Fail fast on missing configuration, clear separation of config from code.

**Example**:
```typescript
// CLI script loads env
dotenv.config({ path: '.env.local' });

// Library function validates
export function loadGmailConfig(): GmailConfig {
  // Validate and return config or throw
}
```

## API Integration Patterns

### OAuth2 Token Refresh

**Pattern**: Exchange refresh token for access token before each API call (or cache tokens).

**Key Points**:
- Access tokens expire after 1 hour
- Refresh tokens don't expire (unless revoked)
- Cache tokens in production to reduce API calls

**Example**:
```typescript
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
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  // Validate response and extract token
}
```

### Gmail API Message Filtering

**Pattern**: Use query parameters for filtering (`labelIds`, `q`), cap `maxResults` at 50.

**Key Points**:
- Gmail API limits `maxResults` to 50 per request
- Use `labelIds` for label-based filtering
- Use `q` for Gmail search query syntax
- Both can be combined

**Example**:
```typescript
const url = new URL(`.../messages`);
url.searchParams.set('maxResults', Math.min(maxMessages, 50).toString());

if (cfg.intakeLabel) {
  url.searchParams.set('labelIds', cfg.intakeLabel);
}

if (cfg.query) {
  url.searchParams.set('q', cfg.query);
}
```

### Error Messages for Debugging

**Pattern**: Include HTTP status, status text, and response body in error messages.

**Rationale**: Complete error information aids debugging while maintaining security.

**Example**:
```typescript
if (!response.ok) {
  const body = await response.text();
  throw new Error(
    `Failed to list messages: ${response.status} ${response.statusText}\nResponse: ${body}`
  );
}
```

## Documentation Patterns

### JSDoc Comments

**Pattern**: Include comprehensive JSDoc for all exported functions and interfaces:
- Purpose description
- Parameter descriptions with types
- Return type and description
- Throws documentation
- Usage examples

**Example**:
```typescript
/**
 * Exchanges a Google OAuth2 refresh token for an access token.
 * @param cfg Gmail configuration containing OAuth credentials
 * @returns Access token string
 * @throws Error if token exchange fails or response is invalid
 */
export async function fetchAccessToken(
  cfg: GmailConfig
): Promise<string> {
  // Implementation
}
```

### Interface Documentation

**Pattern**: Document all interface fields with inline comments.

**Example**:
```typescript
/**
 * Gmail API configuration loaded from environment variables.
 */
export interface GmailConfig {
  /** OAuth2 client ID */
  clientId: string;
  /** OAuth2 client secret */
  clientSecret: string;
  // ... etc
}
```

## Lessons Learned

### What Worked Well

1. **Production-First Approach**: Starting with production-quality standards made code immediately reusable
2. **Type Safety from Start**: Implementing proper types caught issues early
3. **Fail-Hard Consistency**: Consistent error handling made debugging straightforward
4. **Clear Separation**: Modular structure made code easy to reuse

### Common Pitfalls to Avoid

1. **Using `any` Types**: Always define proper interfaces, even for complex API responses
2. **Silent Failures**: Never return null/undefined on errors, always throw
3. **Logging Sensitive Data**: Be careful with error messages and logs
4. **Skipping Validation**: Validate API responses before using them

### For Future Implementations

1. **Consider Token Caching**: For production polling, implement access token caching
2. **Add Retry Logic**: Consider retry logic for transient API failures
3. **Rate Limiting Helpers**: Consider adding rate limiting helpers for high-frequency polling
4. **Automated Tests**: While manual verification worked, automated tests would improve development speed

## Related Patterns

- **OAuth2 Integration**: Patterns apply to any OAuth2-based API integration
- **REST API Clients**: Similar patterns for any REST API client library
- **Configuration Management**: Environment variable loading and validation patterns

## References

- Implementation: `ai-docs/ai-implementation/20251120_implementation_gmail_test_harness.md`
- Repository: `gmail-node-client`
- Gmail API Docs: https://developers.google.com/gmail/api
- OAuth2 RFC: https://oauth.net/2/

