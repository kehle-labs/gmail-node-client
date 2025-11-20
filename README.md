# Gmail Test Harness

A minimal Node.js + TypeScript test harness for Gmail API integration testing.

## Purpose

This is a throwaway test repository for experimenting with Gmail OAuth2 and API integration patterns before porting clean code back into the main application.

## Features

- Exchange Google OAuth2 refresh tokens for access tokens
- List Gmail messages with optional label/query filtering
- Fetch individual message details
- Simple CLI interface for testing

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

- `src/gmail/config.ts` - Configuration loader
- `src/gmail/client.ts` - Gmail API client
- `src/bin/gmail-list.ts` - CLI entrypoint

## Environment Variables

See `.env.example` for all available configuration options.

## Notes

- No test framework - manual verification only
- Uses native `fetch` for HTTP calls (no googleapis dependency)
- Clean, greenfield code designed for easy porting

