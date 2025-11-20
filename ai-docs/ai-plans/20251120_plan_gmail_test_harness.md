# Plan: Gmail Test Harness

## Plan Overview

**Feature Name**: Gmail Test Harness
**Design Document**: `ai-docs/ai-design/20251120_design_gmail_test_harness.md`
**Date**: 20251120

### Summary
Implement a minimal Gmail test harness with TypeScript, ES modules, and native fetch for OAuth2 and Gmail API calls. Structure will be simple and portable.

### Process Checklist
- [x] 1. Understand
- [x] 2. Design
- [x] 3. Plan (current)
- [ ] 4. Develop
- [ ] 5. Document
- [ ] 6. Update

## Repository Context

### Patterns to Follow
- Modern Node.js ES modules
- TypeScript strict mode
- Fail-hard error handling
- Clear, descriptive error messages

### Files to Create
- `package.json` - Project configuration with ES modules
- `tsconfig.json` - TypeScript configuration for Node ESM
- `.env.example` - Environment variable template
- `src/gmail/config.ts` - Configuration loader
- `src/gmail/client.ts` - Gmail API client
- `src/bin/gmail-list.ts` - CLI entrypoint

### Dependencies
- `dotenv@latest` - Environment variable loading (check with Versionator)
- `typescript@latest` - TypeScript compiler (check with Versionator)
- `tsx@latest` - TypeScript execution (check with Versionator)
- `@types/node@latest` - Node.js types (check with Versionator)

## Implementation Steps

### Step 1: Project Setup
- [ ] Create `package.json` with:
  - `"type": "module"`
  - Scripts: `build`, `gmail:list`
  - Dependencies: `dotenv`
  - Dev dependencies: `typescript`, `tsx`, `@types/node`
- [ ] Create `tsconfig.json` with NodeNext module resolution
- [ ] Create `.env.example` with all env var placeholders

### Step 2: Gmail Configuration
- [ ] Create `src/gmail/config.ts`:
  - Define `GmailConfig` interface
  - Implement `loadGmailConfig()` with validation
  - Throw clear errors listing missing env vars

### Step 3: Gmail Client
- [ ] Create `src/gmail/client.ts`:
  - Implement `fetchAccessToken()` using native fetch
  - Implement `listMessages()` with label/query support
  - Implement `getMessage()` for full message retrieval
  - Use proper error handling with diagnostic info

### Step 4: CLI Entrypoint
- [ ] Create `src/bin/gmail-list.ts`:
  - Load dotenv from `.env.local`
  - Load config and fetch access token
  - List messages (with optional count from argv)
  - Display message info, optionally fetch first message details
  - Handle errors with clear output

## File Structure
```
mail_test/
├── package.json
├── tsconfig.json
├── .env.example
├── .env.local (user-created, gitignored)
└── src/
    ├── gmail/
    │   ├── config.ts
    │   └── client.ts
    └── bin/
        └── gmail-list.ts
```

## Validation
- [ ] All design requirements addressed
- [ ] Dependencies checked with Versionator MCP
- [ ] File paths verified
- [ ] Error handling follows fail-hard approach
- [ ] Code is simple and readable

