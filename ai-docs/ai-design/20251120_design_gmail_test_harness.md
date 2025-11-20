# Design: Gmail Test Harness

## Feature Overview

**Feature Name**: Gmail Test Harness
**Date**: 20251120
**Author**: AI Assistant
**Status**: Draft

### Executive Summary
A minimal Node.js + TypeScript test harness for Gmail API integration. Allows local testing of OAuth2 refresh token exchange and Gmail message listing/fetching without coupling to the main application.

### Problem Statement
Need a clean, isolated environment to test Gmail OAuth2 and API integration patterns before porting back into the main application. Must be greenfield code with no dependencies on existing implementations.

### Success Criteria
- [ ] Can exchange refresh token for access token
- [ ] Can list Gmail messages with optional label/query filtering
- [ ] Can fetch individual message details
- [ ] Uses common, idiomatic environment variable names
- [ ] Simple structure that's easy to port back to main app

## Requirements Analysis

### Functional Requirements
- Read Gmail OAuth configuration from `.env.local`
- Exchange Google OAuth2 refresh token for access token
- List Gmail messages with configurable limits and filters
- Fetch individual message details
- CLI entrypoint to demonstrate functionality

### Non-Functional Requirements
- No test framework (manual verification)
- TypeScript with ES modules
- Modern Node.js (20+) patterns
- Simple, readable code structure
- Clear error messages

### Constraints
- No Vitest or other test frameworks
- No reuse of existing Gmail code from main app
- Use plain HTTPS calls (or googleapis if clearly better)
- Environment variables must use common, idiomatic names

## Proposed Solution

### High-Level Approach
Create a minimal Node.js project with:
1. TypeScript configuration for ES modules
2. Gmail config loader with validation
3. Gmail client using native fetch for OAuth and API calls
4. Simple CLI script to demonstrate usage

### Component Design

- **`src/gmail/config.ts`**
  - Purpose: Load and validate Gmail configuration from environment variables
  - Responsibilities: Environment variable parsing, validation, error reporting
  - Interfaces: Exports `GmailConfig` interface and `loadGmailConfig()` function

- **`src/gmail/client.ts`**
  - Purpose: Gmail API client functionality
  - Responsibilities: OAuth token exchange, message listing, message fetching
  - Interfaces: Exports `fetchAccessToken()`, `listMessages()`, `getMessage()`

- **`src/bin/gmail-list.ts`**
  - Purpose: CLI entrypoint to demonstrate Gmail integration
  - Responsibilities: Load config, fetch token, list messages, display results

### Environment Variables
- `GOOGLE_CLIENT_ID` (required)
- `GOOGLE_CLIENT_SECRET` (required)
- `GOOGLE_REFRESH_TOKEN` (required)
- `GMAIL_USER_EMAIL` (required)
- `GMAIL_LABEL_INTAKE` (optional)
- `GMAIL_LABEL_PROCESSED` (optional)
- `GMAIL_QUERY` (optional)

### Error Handling
- Fail-hard approach: throw clear errors with missing env var names
- Include HTTP status and response snippets in API errors
- Use `console.error` + `process.exit(1)` in CLI

## Implementation Considerations

### Dependencies
- `dotenv` - Environment variable loading
- `typescript` - TypeScript compiler
- `tsx` - TypeScript execution for dev
- `@types/node` - Node.js type definitions

### Testing Strategy
- No automated tests (manual verification only)
- CLI script serves as integration test

## Alternatives Considered

### Using `googleapis` library
- Pros: Official library, handles edge cases
- Cons: Adds dependency, may be overkill for simple harness
- Decision: Use native `fetch` for simplicity and clarity

## Open Questions
None - requirements are clear.

