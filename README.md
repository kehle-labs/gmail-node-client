# Gmail API Client Library

A production-worthy Node.js + TypeScript Gmail API client library for OAuth2 authentication and message operations. Designed as reusable, maintainable code following best practices that can be integrated into production applications.

## Purpose

This library provides clean, production-ready Gmail OAuth2 and API integration code that can be reused across applications. While it includes a CLI tool for testing, the core library code (`src/gmail/`) is structured as reusable, importable modules suitable for production use.

## Features

- **Production Quality**: Full TypeScript type safety, comprehensive JSDoc documentation, fail-hard error handling
- **OAuth2 Authentication**: Exchange Google OAuth2 refresh tokens for access tokens
- **Message Operations**: List Gmail messages with optional label/query filtering, fetch full message details
- **Reusable Library**: Clean, modular code structure that can be easily imported into other applications
- **CLI Tool**: Simple command-line interface for testing and debugging

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` from template:
   ```bash
   cp .env.example .env.local
   ```

3. Fill in your Google OAuth2 credentials in `.env.local`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
   - `GMAIL_USER_EMAIL`

## Usage

List Gmail messages:
```bash
npm run gmail:list -- 5
```

The number argument is optional (defaults to 5).

## Project Structure

### Library Code (Reusable)
- `src/gmail/config.ts` - Configuration loader with validation
- `src/gmail/client.ts` - Gmail API client (OAuth + message operations) with full type definitions

### Tools
- `src/bin/gmail-list.ts` - CLI entrypoint for testing and demonstration

### Documentation
- `ai-docs/` - Complete design, plan, and implementation documentation
- `.env.example` - Environment variable template

## Environment Variables

See `.env.example` for all available configuration options.

## Library Usage

To use this library in your application:

```typescript
import { loadGmailConfig } from './gmail/config.js';
import { fetchAccessToken, listMessages, getMessage } from './gmail/client.js';

// Load configuration
const config = loadGmailConfig();

// Get access token
const accessToken = await fetchAccessToken(config);

// List messages
const messages = await listMessages(config, accessToken, 10);

// Fetch full message
const message = await getMessage(config, accessToken, messages[0].id);
```

## Testing

This library includes comprehensive automated tests using Vitest.

### Quick Start

Run all unit tests (no network required):

```bash
npm test
```

View test coverage:

```bash
npm run test:coverage
```

### Testing Strategy

For detailed testing information, see **[Testing Strategy Documentation](ai-docs/testing-strategy.md)**.

**Summary**:

- **Unit Tests**: Fast, isolated tests with mocked HTTP calls. Cover all public API functions, error handling, and edge cases. Assert behavioral contracts (URLs, headers, params, return values) rather than implementation details.

- **Integration Tests**: Optional live tests against Gmail API. Run with `GMAIL_LIVE_TEST=1 npm test`. Requires a dedicated Gmail test account with OAuth2 credentials configured. Tests are skipped by default.

- **App-Level Tests**: Application-specific tests belong in consuming applications (e.g., `tdg-assistant`), not in this library repo.

## Code Quality

- **Type Safety**: 100% TypeScript type coverage (no `any` types)
- **Documentation**: Complete JSDoc comments for all exported functions and interfaces
- **Error Handling**: Fail-hard approach with clear, actionable error messages
- **Test Coverage**: Comprehensive unit tests with optional integration tests
- **Dependencies**: Minimal dependencies (dotenv only, using native `fetch` API)

## Technical Notes

- **Node.js**: Requires Node.js 22+ (for native `fetch` support)
- **TypeScript**: Strict mode enabled, ES modules with NodeNext module resolution
- **Testing**: Vitest for unit tests, optional integration tests for live Gmail API
- **Security**: Never logs tokens, secrets, or Authorization headers

