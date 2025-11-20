# Design: Gmail Test Harness

## Feature Overview

**Feature Name**: Gmail Test Harness
**Date**: 20251120
**Author**: AI Assistant
**Status**: Draft

### Executive Summary
A production-worthy Node.js + TypeScript Gmail API client library for OAuth2 authentication and message operations. Designed as reusable, maintainable code following best practices that can be integrated into production applications. While initially tested as a standalone harness, the code structure prioritizes reusability and adherence to industry standards.

### Problem Statement
Need production-quality Gmail OAuth2 and API integration code that can be reused across applications without rebuilding. The code must support token refresh, message listing with filtering, and message fetching. This is not a throwaway test harness - it should follow best practices and be structured for long-term maintenance and reuse. Target use case: single-user email consumption (~100 emails/day) with polling considerations (5-minute intervals, potentially down to 1 minute in production).

### Success Criteria
- [ ] Successfully exchanges OAuth2 refresh token for access token
- [ ] Lists Gmail messages with optional label and query filtering
- [ ] Fetches individual message details by ID
- [ ] Validates required environment variables and fails clearly if missing
- [ ] Provides CLI interface for manual testing and debugging
- [ ] Code follows production best practices: clean structure, proper error handling, type safety
- [ ] Structured as reusable library code that can be easily integrated into other applications
- [ ] No shortcuts or technical debt - production-ready quality throughout

## Requirements Analysis

### Functional Requirements
- Load Gmail OAuth configuration from environment variables
- Exchange Google OAuth2 refresh token for access token via OAuth2 endpoint
- List Gmail messages with configurable limit (max 50 per Gmail API)
- Filter messages by label and/or query string (optional)
- Fetch full message details by message ID
- CLI entrypoint to demonstrate and test functionality

### Non-Functional Requirements
- **Performance**: Fast startup, efficient API calls. Designed for polling use case (5-minute intervals, potentially 1-minute minimum). Respect Gmail API rate limits.
- **Security**: No hardcoded credentials, all config via environment variables. Never log tokens, client secrets, or Authorization headers. Errors may include HTTP status codes and non-sensitive response snippets only.
- **Usability**: Clear error messages, simple CLI interface
- **Maintainability**: Clean, readable TypeScript with minimal dependencies. Production-worthy code structure following best practices. No technical debt or shortcuts.
- **Reusability**: Structured as library code that can be easily imported and used in other applications. Clear interfaces, minimal coupling.

### Constraints
- TypeScript with ES modules
- Node.js 22+ with native `fetch` support
- No external test frameworks (manual verification via CLI)
- Must use specified environment variable names
- Fail-hard error handling (no silent failures)

## Context Investigation

### Repository Analysis
- **Architecture patterns**: Using generic Node.js + TypeScript patterns (ES modules, dotenv for configuration)
- **Similar features**: No existing Gmail integration code referenced from other repos; this is a greenfield implementation
- **Integration points**: Initially standalone for testing, but structured as reusable library code for production use in other applications
- **Use case context**: Single-user email consumption (~100 emails/day). Polling considerations: 5-minute intervals initially, potentially down to 1 minute in production. This informs rate limiting and API usage patterns.

### Technical Stack
- **Language**: TypeScript
- **Runtime**: Node.js 22+ with ES modules
- **Package Manager**: npm
- **Dependencies**: dotenv, @types/node
- **Dev Tools**: tsx for TypeScript execution, tsc for compilation

## Proposed Solution

### High-Level Approach
Create a production-worthy TypeScript library with three core components:
1. Configuration loader that validates required environment variables
2. Gmail API client using native `fetch` for OAuth token exchange and Gmail API calls
3. CLI script that demonstrates the full authentication and message fetching flow

All components follow fail-hard principles: missing config throws clear errors, API failures include HTTP status and response details. Code structure prioritizes reusability, maintainability, and adherence to best practices - no shortcuts or technical debt. The library code can be easily imported and used in production applications.

### Component Design

- **`src/gmail/config.ts`**
  - Purpose: Load and validate Gmail OAuth configuration from environment variables
  - Responsibilities: Parse env vars, validate required fields, throw clear errors for missing vars
  - Interfaces: Exports `GmailConfig` interface and `loadGmailConfig()` function
  - Error Handling: Throws `Error` listing all missing required environment variables

- **`src/gmail/client.ts`**
  - Purpose: Gmail API client functionality for OAuth and message operations
  - Responsibilities: Token exchange, message listing, message fetching
  - Interfaces: Exports `fetchAccessToken()`, `listMessages()`, `getMessage()`
  - Error Handling: Throws `Error` with HTTP status and response body on API failures

- **`src/bin/gmail-list.ts`**
  - Purpose: CLI entrypoint for testing Gmail integration
  - Responsibilities: Load config, fetch token, list/fetch messages, display results
  - Error Handling: Logs errors and exits with code 1

### Data Flow
1. CLI loads `.env.local` via dotenv
2. Config loader validates environment variables
3. Client exchanges refresh token for access token via OAuth2 endpoint
4. Client uses access token to call Gmail API (list messages or fetch message)
5. Results displayed via console output

### Environment Variables

**Required:**
- `GOOGLE_CLIENT_ID` - OAuth2 client ID
- `GOOGLE_CLIENT_SECRET` - OAuth2 client secret
- `GOOGLE_REFRESH_TOKEN` - OAuth2 refresh token
- `GMAIL_USER_EMAIL` - Gmail account email address

**Optional:**
- `GMAIL_LABEL_INTAKE` - Label ID for filtering messages by label
- `GMAIL_LABEL_PROCESSED` - Label ID for processed messages
- `GMAIL_QUERY` - Gmail search query string for filtering messages

Missing required environment variables cause `loadGmailConfig()` to throw an `Error` listing all missing variable names.

### Error Handling
- **Config Loading**: Throw `Error` listing all missing required environment variables by name
- **OAuth Token Exchange**: Throw `Error` with HTTP status, status text, and response body
- **Gmail API Calls**: Throw `Error` with HTTP status, status text, and response body
- **CLI**: Log errors to `console.error` and exit with `process.exit(1)`

## Implementation Considerations

### Dependencies
- `dotenv` - Load environment variables from `.env.local` file
- `typescript` - TypeScript compiler
- `tsx` - Execute TypeScript directly for development
- `@types/node` - Node.js type definitions

**Note**: Using native `fetch` API (Node.js 22+) instead of `googleapis` library to minimize dependencies and keep code transparent for debugging.

**Security Note**: Never log tokens, client secrets, or Authorization headers. Error messages may include HTTP status codes and non-sensitive response snippets only.

**Production Quality**: Code must follow best practices throughout - proper TypeScript types, clear error handling, fail-hard approach, no silent failures, clean structure suitable for long-term maintenance. This is not a throwaway prototype - it's production code meant for reuse.

### Testing Strategy
- **Manual verification**: CLI script serves as integration test
- **Edge cases**: Test with missing env vars, invalid tokens, empty message lists, malformed API responses
- **Error scenarios**: Verify all error paths provide clear, actionable error messages

## Alternatives Considered

### Using `googleapis` library
- **Approach**: Use official Google APIs Node.js client library
- **Pros**: Handles edge cases, automatic retries, well-maintained, production-tested
- **Cons**: Adds large dependency (~5MB), obscures low-level API interactions needed for debugging and customization
- **Why not chosen**: For production code that needs to be transparent, debuggable, and customizable, native fetch provides better control while keeping dependencies minimal. The code will handle edge cases explicitly rather than relying on library abstractions.

## Open Questions
None - requirements and approach are clear.

## Resolved Questions
*(None yet - will be populated after Phase 2.5 if questions arise)*

## Decisions Needed
None - proceed with implementation.
