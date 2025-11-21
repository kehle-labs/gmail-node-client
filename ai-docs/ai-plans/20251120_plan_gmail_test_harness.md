# Plan: Gmail Test Harness

## Plan Overview

**Feature Name**: Gmail Test Harness
**Design Document**: `ai-docs/ai-design/20251120_design_gmail_test_harness.md`
**Date**: 20251120

### Summary
Implement production-worthy Node.js + TypeScript Gmail API client library following best practices. The implementation includes three core components: a configuration loader with validation, a Gmail API client using native fetch, and a CLI script for testing. All components follow fail-hard error handling principles, use the specified environment variable names, and are structured as reusable library code. Code quality must meet production standards - no shortcuts, no technical debt. Use case: single-user email consumption (~100 emails/day) with polling considerations (5-minute intervals, potentially 1-minute minimum).

### Process Checklist
Copy to `.scratch/todo.md`:
- [x] 1. Understand
- [x] 2. Design
- [x] 2.5. Resolve Open Questions
- [x] 3. Plan (current)
- [ ] 4. Develop
- [ ] 5. Document
- [ ] 6. Update

### Resolved Questions from Design
*(No open questions were identified in Phase 2 - all requirements are clear)*

## Repository Context

### Patterns to Follow
- TypeScript ES modules with `type: "module"` in package.json
- Fail-hard error handling: throw clear errors, never return null/undefined on failure
- Use native `fetch` API for HTTP requests (Node.js 22+)
- Environment variable loading via dotenv from `.env.local`
- **Production quality**: Follow best practices throughout - proper types, clear error messages, clean structure, no shortcuts
- **Reusability**: Structure code as importable library functions that can be used in other applications
- **Maintainability**: Write code for long-term maintenance - clear naming, proper documentation, follow SOLID principles

### Files to Modify/Create
- `src/gmail/config.ts`: Configuration loader with validation
- `src/gmail/client.ts`: Gmail API client (OAuth + message operations)
- `src/bin/gmail-list.ts`: CLI entrypoint
- `.env.example`: Environment variable template (if missing)

### Dependencies
All dependencies verified with Versionator MCP:
- `dotenv@^17.2.3`: Load environment variables from `.env.local` file
- `typescript@^5.9.3`: TypeScript compiler
- `tsx@^4.20.6`: Execute TypeScript directly for development
- `@types/node@^24.10.1`: Node.js type definitions

**Note**: Using native `fetch` API (Node.js 22+) instead of `googleapis` library to minimize dependencies and keep code transparent for debugging.

**Production Quality Standards**: 
- Follow best practices throughout - no shortcuts or technical debt
- Proper TypeScript types for all interfaces and return values
- Clear, actionable error messages
- Code structured for reuse and long-term maintenance
- Consider polling use case: 5-minute intervals (potentially 1-minute minimum), ~100 emails/day

## Implementation Steps

### Step 1: Project Setup & Configuration
- [ ] Verify `package.json` has correct dependencies at latest versions
  - Check `dotenv` is at `^17.2.3` or later
  - Check `typescript` is at `^5.9.3` or later
  - Check `tsx` is at `^4.20.6` or later
  - Check `@types/node` is at `^24.10.1` or later
- [ ] Verify `tsconfig.json` is configured for ES modules:
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "NodeNext",
      "moduleResolution": "NodeNext",
      "strict": true
    }
  }
  ```
- [ ] Create `.env.example` template file with all environment variables documented:
  ```
  # Required
  GOOGLE_CLIENT_ID=your_client_id_here
  GOOGLE_CLIENT_SECRET=your_client_secret_here
  GOOGLE_REFRESH_TOKEN=your_refresh_token_here
  GMAIL_USER_EMAIL=your_email@gmail.com

  # Optional
  GMAIL_LABEL_INTAKE=
  GMAIL_LABEL_PROCESSED=
  GMAIL_QUERY=
  ```

### Step 2: Implement Configuration Loader (`src/gmail/config.ts`)
- [ ] Define `GmailConfig` interface with required and optional fields:
  ```typescript
  export interface GmailConfig {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    userEmail: string;
    intakeLabel?: string;
    processedLabel?: string;
    query?: string;
  }
  ```
- [ ] Implement `loadGmailConfig()` function:
  - Validate all required environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GMAIL_USER_EMAIL`
  - Check that required vars are not empty strings (trimmed)
  - If any required vars are missing, throw `Error` listing all missing variable names
  - Load optional vars: `GMAIL_LABEL_INTAKE`, `GMAIL_LABEL_PROCESSED`, `GMAIL_QUERY`
  - Return `GmailConfig` object

**Fail-hard validation**: Must throw clear error if any required env var is missing.

### Step 3: Implement Gmail API Client (`src/gmail/client.ts`)
- [ ] Implement `fetchAccessToken()` function:
  - Accept `GmailConfig` parameter
  - Build OAuth2 token exchange request to `https://oauth2.googleapis.com/token`
  - Use `URLSearchParams` for form-encoded body with: `client_id`, `client_secret`, `refresh_token`, `grant_type=refresh_token`
  - Use native `fetch` with POST method and `Content-Type: application/x-www-form-urlencoded`
  - On failure, throw `Error` with HTTP status, status text, and response body
  - Validate `access_token` exists in response, throw if missing
  - Return access token string

- [ ] Implement `listMessages()` function:
  - Accept `GmailConfig`, `accessToken`, and optional `maxMessages` (default 10)
  - Cap `maxMessages` at 50 (Gmail API limit)
  - Build URL: `https://gmail.googleapis.com/gmail/v1/users/{userEmail}/messages`
  - Add `maxResults` query parameter
  - If `cfg.intakeLabel` exists, add `labelIds` query parameter
  - If `cfg.query` exists, add `q` query parameter
  - Use native `fetch` with `Authorization: Bearer {accessToken}` header
  - On failure, throw `Error` with HTTP status, status text, and response body
  - Extract messages array from response, return empty array if no messages
  - Return `MessageSummary[]` with `id` and `threadId`

- [ ] Implement `getMessage()` function:
  - Accept `GmailConfig`, `accessToken`, and `id` (message ID)
  - Build URL: `https://gmail.googleapis.com/gmail/v1/users/{userEmail}/messages/{id}?format=full`
  - Use native `fetch` with `Authorization: Bearer {accessToken}` header
  - On failure, throw `Error` with HTTP status, status text, and response body
  - Return full message object from Gmail API

**Security Note**: Never log tokens, client secrets, or Authorization headers. Error messages may include HTTP status codes and non-sensitive response snippets only.

### Step 4: Implement CLI Script (`src/bin/gmail-list.ts`)
- [ ] Load `.env.local` using dotenv: `dotenv.config({ path: '.env.local' })`
- [ ] Create `main()` async function:
  - Load config using `loadGmailConfig()`
  - Log loaded user email (non-sensitive)
  - Fetch access token using `fetchAccessToken()`
  - Log success (without showing token)
  - Parse message count from `process.argv[2]` or default to 5
  - Validate message count is positive number, throw if invalid
  - List messages using `listMessages()`
  - Display message summaries (id and threadId)
  - Fetch and display first message details (subject, snippet)
  - Handle all errors: log to `console.error` and exit with `process.exit(1)`
- [ ] Call `main()` at script end

**Error handling**: All errors must be caught and logged clearly, then exit with code 1.

### Step 5: Update Package Scripts
- [ ] Verify `package.json` has CLI script:
  ```json
  {
    "scripts": {
      "gmail:list": "tsx src/bin/gmail-list.ts"
    }
  }
  ```
- [ ] Verify build script exists: `"build": "tsc"`

### Step 6: Manual Verification
- [ ] Test missing environment variables:
  - Remove one required var, run script
  - Verify error message lists missing variable name clearly
- [ ] Test with valid configuration:
  - Create `.env.local` with all required vars
  - Run `npm run gmail:list 5`
  - Verify token exchange succeeds
  - Verify messages are listed
  - Verify message details are displayed
- [ ] Test with optional parameters:
  - Add `GMAIL_LABEL_INTAKE` or `GMAIL_QUERY` to `.env.local`
  - Verify filtering works correctly
- [ ] Test error scenarios:
  - Invalid refresh token should show clear error with HTTP status
  - Invalid message count should show clear error

## File Structure
```
gmail-node-client/
├── package.json
├── tsconfig.json
├── .env.example (to create)
├── .env.local (user-provided, gitignored)
└── src/
    ├── gmail/
    │   ├── config.ts
    │   └── client.ts
    └── bin/
        └── gmail-list.ts
```

## Validation
- [x] All design requirements addressed
- [x] All resolved questions from Phase 2.5 incorporated into plan
- [x] File paths verified to exist or be created
- [x] Dependencies at latest versions (verified via Versionator MCP)
- [x] Fail-hard approach throughout all steps
- [x] Security requirements (no token logging) specified
- [x] Error handling approach defined for all components

## Implementation Notes

### Red-Green-Refactor Pattern
Following the mandatory RGR pattern from `.cursor/rules/red-green-refactor.mdc`:
1. **RED**: Write failing test scenarios first (manual verification)
   - Document expected errors for missing env vars
   - Document expected behavior for valid inputs
2. **GREEN**: Implement minimal code to pass verification
   - Write config loader with validation
   - Write client functions with error handling
   - Write CLI script with error handling
3. **REFACTOR**: Improve code quality while maintaining functionality
   - Ensure clear error messages
   - Verify no sensitive data in logs
   - Check code follows repository patterns
   - Apply best practices: proper types, clean structure, reusable interfaces
   - Ensure code meets production standards - no shortcuts, maintainable long-term

### Security Checklist
- [ ] No `console.log` statements that output tokens or secrets
- [ ] No logging of Authorization headers
- [ ] Error messages include HTTP status codes only
- [ ] Error messages include non-sensitive response snippets only
- [ ] `.env.local` is in `.gitignore`

### Error Message Standards
All errors must include:
- Clear description of what failed
- For missing config: list all missing variable names
- For API failures: HTTP status code and status text
- For API failures: response body snippet (sanitized if needed)
- Never include tokens, secrets, or Authorization headers in error messages

## Production Quality Considerations

### Code Quality Standards
- **Type Safety**: Full TypeScript typing with no `any` types except where absolutely necessary (e.g., Gmail API response structures)
- **Error Handling**: All error paths must throw clear, actionable errors with context
- **Code Structure**: Clean separation of concerns, single responsibility principle
- **Documentation**: JSDoc comments for all exported functions and interfaces
- **Reusability**: Functions designed to be imported and used independently
- **Maintainability**: Code written for long-term maintenance, not just immediate needs

### Use Case Context
- **Volume**: ~100 emails/day for single user
- **Polling**: 5-minute intervals initially, potentially down to 1-minute minimum in production
- **Rate Limits**: Code should be mindful of Gmail API rate limits, but current use case is well within limits
- **Reusability**: Code structure should make it easy to integrate into other applications

## Next Step
Execute the plan with 4_DEVELOPMENT_PROCESS.md (Phase 4: Develop) following Red-Green-Refactor pattern. Prioritize production-quality code over speed - no shortcuts, best practices throughout.
