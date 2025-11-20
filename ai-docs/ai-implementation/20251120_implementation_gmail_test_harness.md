# Implementation: Gmail Test Harness

## Overview

**Feature Name**: Gmail Test Harness
**Date**: 20251120
**Status**: Complete

### What Was Built

A minimal Node.js + TypeScript test harness for Gmail API integration that:
- Loads Gmail OAuth configuration from environment variables
- Exchanges refresh tokens for access tokens
- Lists Gmail messages with optional filtering
- Fetches individual message details
- Provides a CLI entrypoint for testing

## Implementation Details

### Project Structure

```
mail_test/
├── package.json          # ES modules, scripts, dependencies
├── tsconfig.json         # TypeScript config for NodeNext
├── .env.example          # Environment variable template
└── src/
    ├── gmail/
    │   ├── config.ts     # Configuration loader with validation
    │   └── client.ts     # Gmail API client (OAuth + API calls)
    └── bin/
        └── gmail-list.ts # CLI entrypoint
```

### Key Components

#### `src/gmail/config.ts`
- Defines `GmailConfig` interface with required and optional fields
- `loadGmailConfig()` validates all required environment variables
- Throws clear errors listing missing env vars if validation fails

#### `src/gmail/client.ts`
- `fetchAccessToken()`: Exchanges refresh token for access token via OAuth2 endpoint
- `listMessages()`: Lists messages with optional label/query filtering (max 50)
- `getMessage()`: Fetches full message details by ID
- All functions use native `fetch` API
- Error handling includes HTTP status and response body for debugging

#### `src/bin/gmail-list.ts`
- Loads `.env.local` using dotenv
- Demonstrates full flow: config → token → list → fetch
- Accepts optional message count from command line (default: 5)
- Displays message summaries and detailed info for first message

### Environment Variables

**Required:**
- `GOOGLE_CLIENT_ID` - OAuth2 client ID
- `GOOGLE_CLIENT_SECRET` - OAuth2 client secret
- `GOOGLE_REFRESH_TOKEN` - OAuth2 refresh token
- `GMAIL_USER_EMAIL` - Gmail address to act as

**Optional:**
- `GMAIL_LABEL_INTAKE` - Label to filter messages
- `GMAIL_LABEL_PROCESSED` - Label for processed messages
- `GMAIL_QUERY` - Additional Gmail search query

### Dependencies

- `dotenv@^17.2.3` - Environment variable loading
- `typescript@^5.9.3` - TypeScript compiler
- `tsx@^4.20.6` - TypeScript execution
- `@types/node@^24.10.1` - Node.js type definitions

All versions checked via Versionator MCP before adding.

### Usage

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run the CLI
npm run gmail:list -- 5  # List 5 messages (default)
```

### Design Decisions

1. **Native fetch over googleapis**: Chose native `fetch` for simplicity and clarity, making the code easier to understand and port
2. **Fail-hard error handling**: All errors throw with clear messages, no silent failures
3. **ES modules**: Modern Node.js pattern with `"type": "module"` and NodeNext module resolution
4. **No test framework**: As requested, manual verification only via CLI

### Code Quality

- TypeScript strict mode enabled
- Clear error messages with diagnostic information
- Proper type definitions for all interfaces
- Clean separation of concerns (config, client, CLI)

## Next Steps

To port this back to the main application:
1. Copy `src/gmail/config.ts` and `src/gmail/client.ts` to main app
2. Adapt environment variable names if needed
3. Integrate into existing error handling patterns
4. Add proper logging/metrics as needed

