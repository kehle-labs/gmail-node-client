import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';
import { loadGmailConfig } from '../../src/gmail/config.js';
import {
  fetchAccessToken,
  listMessages,
  getMessage,
} from '../../src/gmail/client.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

describe('Gmail Live Integration Tests', () => {
  const shouldRunLiveTests = process.env.GMAIL_LIVE_TEST === '1';

  beforeAll(() => {
    if (!shouldRunLiveTests) {
      // Skip all tests if GMAIL_LIVE_TEST is not set to "1"
      return;
    }

    // Verify all required environment variables are set
    const requiredVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REFRESH_TOKEN',
      'GMAIL_USER_EMAIL',
    ];

    const missing = requiredVars.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(
        `GMAIL_LIVE_TEST=1 but missing required env vars: ${missing.join(', ')}`
      );
    }
  });

  it.skipIf(!shouldRunLiveTests)(
    'performs end-to-end Gmail API operations: token exchange, list, get',
    async () => {
      // Load configuration from environment variables
      const config = loadGmailConfig();

      // 1. Exchange refresh token for access token (exactly one)
      const accessToken = await fetchAccessToken(config);
      expect(accessToken).toBeTypeOf('string');
      expect(accessToken.length).toBeGreaterThan(0);

      // 2. List messages (exactly one list call)
      const messages = await listMessages(config, accessToken, 1);
      expect(Array.isArray(messages)).toBe(true);

      // 3. Get full message details (exactly one get call)
      // Note: Test account may have no messages, which is fine
      if (messages.length > 0) {
        const messageId = messages[0].id;
        
        // Behavioral contract: message summary has id and threadId
        expect(messageId).toBeTypeOf('string');
        expect(messages[0].threadId).toBeTypeOf('string');

        const fullMessage = await getMessage(config, accessToken, messageId);

        // Behavioral contract: full message has key fields
        expect(fullMessage).toHaveProperty('id');
        expect(fullMessage).toHaveProperty('threadId');
        expect(fullMessage.id).toBe(messageId);
        expect(typeof fullMessage.threadId).toBe('string');

        // Avoid brittle assertions about message content - just verify structure exists
        // The message may have payload, snippet, etc. but we don't assert specific values
        // as test account content may vary
      }
      // If no messages, test still passes - account may be empty (expected for test account)
    }
  );
});

