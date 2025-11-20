# Testing Strategy

This document explains the testing approach for the Gmail API client library.

## Overview

The library uses a multi-layered testing strategy:
1. **Unit tests** - Fast, isolated tests with no network access
2. **Integration tests** - Optional live tests against Gmail API with a dedicated test account
3. **App-level tests** - Tests in consuming applications (e.g., `tdg-assistant`), not in this repo

## Unit Tests

**Location**: `tests/unit/`

**Coverage**: All public API functions are unit tested with mocked HTTP calls.

### What Unit Tests Cover

- **Configuration Loading** (`config.test.ts`):
  - Validates required environment variables are present
  - Lists missing variables in error messages
  - Handles optional fields correctly
  - Rejects empty/whitespace-only values

- **OAuth2 Token Exchange** (`client-auth.test.ts`):
  - Successful token exchange with correct URL, headers, and parameters
  - Error handling with HTTP status codes
  - Response validation (access_token presence)
  - Security: No secrets logged in error messages

- **Message Operations** (`client-messages.test.ts`):
  - Message listing with correct API URLs and query parameters
  - Query parameter filtering (labelIds, q)
  - MaxResults capping at Gmail API limit (50)
  - Message fetching with correct URLs and headers
  - Response validation and error handling

### Running Unit Tests

```bash
npm test
```

Unit tests run quickly with no network access. All HTTP calls are mocked using Vitest.

### Test Philosophy

Unit tests assert **behavioral contracts**, not implementation details:
- ✅ Which URLs are called
- ✅ Which headers/parameters are set
- ✅ Which values are returned/thrown
- ❌ Exact error message wording (unless it's part of the public contract)

This approach makes tests resilient to internal refactoring while ensuring the public API contract is maintained.

## Integration Tests

**Location**: `tests/integration/gmail-live.test.ts`

**Purpose**: Verify the library works with the real Gmail API using a dedicated test account.

### When to Run Integration Tests

Integration tests are **skipped by default** and only run when:
1. `GMAIL_LIVE_TEST=1` is set in the environment
2. All required Gmail OAuth2 environment variables are set

### Running Integration Tests

```bash
GMAIL_LIVE_TEST=1 npm test
```

### Test Account Requirements

- **Dedicated Gmail Test Account**: Use a separate Gmail account specifically for testing, not your personal account
- **OAuth2 Credentials**: Set up Google OAuth2 credentials for the test account
- **Environment Variables**: Configure all required variables in `.env.local`:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REFRESH_TOKEN`
  - `GMAIL_USER_EMAIL`

### What Integration Tests Verify

The integration test performs a minimal end-to-end check:
1. **One token exchange**: `fetchAccessToken()` succeeds
2. **One message list**: `listMessages()` returns valid structure
3. **One message fetch**: `getMessage()` returns full message if messages exist

Tests assert **key structural fields** (id, threadId) but avoid brittle assertions about message content, as test account content may vary over time.

### Skipping Logic

Integration tests are automatically skipped unless:
- `GMAIL_LIVE_TEST=1` environment variable is set
- All required environment variables are present

This ensures:
- CI/CD can run without credentials
- Developers can run unit tests locally without Gmail setup
- Integration tests only run when explicitly enabled

## App-Level Tests

**Location**: In consuming applications (e.g., `tdg-assistant`), not in this library repo.

**Purpose**: Test how the library is used in real application scenarios.

### What App-Level Tests Cover

- Application-specific configuration patterns
- Integration with application-specific error handling
- End-to-end workflows using the library
- Application-specific polling patterns
- Production deployment scenarios

### Why Not in This Repo

The library is a **reusable component**. Application-specific test scenarios belong in the applications that consume the library, not in the library itself.

## Test Coverage

View test coverage:

```bash
npm run test:coverage
```

Aim for high coverage of:
- All public API functions
- Error handling paths
- Edge cases (empty responses, missing fields, etc.)

## Contributing Tests

When adding new features:

1. **Write unit tests first** (RED) following Red-Green-Refactor
2. **Assert behavioral contracts**, not implementation details
3. **Add integration test** if the feature interacts with Gmail API in a new way
4. **Update this document** if the testing strategy changes

## Best Practices

### Unit Tests

- ✅ Mock all network calls
- ✅ Test error paths thoroughly
- ✅ Assert URLs, headers, params, return values
- ✅ Test edge cases (empty arrays, missing fields, etc.)
- ❌ Don't assert exact error message strings (unless part of public contract)
- ❌ Don't test internal implementation details

### Integration Tests

- ✅ Use dedicated test account
- ✅ Keep tests minimal (one token, one list, one get)
- ✅ Assert structure, not content
- ✅ Handle empty test accounts gracefully
- ❌ Don't make assumptions about message content
- ❌ Don't modify test account data

## References

- **Unit Tests**: `tests/unit/`
- **Integration Tests**: `tests/integration/`
- **Vitest Documentation**: https://vitest.dev
- **Gmail API Documentation**: https://developers.google.com/gmail/api

