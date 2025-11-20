import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadGmailConfig, type GmailConfig } from '../../src/gmail/config.js';

describe('loadGmailConfig', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Clear all Gmail-related environment variables before each test
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REFRESH_TOKEN;
    delete process.env.GMAIL_USER_EMAIL;
    delete process.env.GMAIL_LABEL_INTAKE;
    delete process.env.GMAIL_LABEL_PROCESSED;
    delete process.env.GMAIL_QUERY;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('throws Error when no required env vars are set', () => {
    expect(() => loadGmailConfig()).toThrow(Error);
    
    try {
      loadGmailConfig();
      expect.fail('Should have thrown');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Behavioral contract: error message lists all missing required variable names
      expect(message).toContain('GOOGLE_CLIENT_ID');
      expect(message).toContain('GOOGLE_CLIENT_SECRET');
      expect(message).toContain('GOOGLE_REFRESH_TOKEN');
      expect(message).toContain('GMAIL_USER_EMAIL');
    }
  });

  it('throws Error listing exactly the missing required env vars when some are missing', () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GMAIL_USER_EMAIL = 'test@example.com';
    // Missing GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN

    expect(() => loadGmailConfig()).toThrow(Error);
    
    try {
      loadGmailConfig();
      expect.fail('Should have thrown');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Behavioral contract: error message lists only missing variables
      expect(message).toContain('GOOGLE_CLIENT_SECRET');
      expect(message).toContain('GOOGLE_REFRESH_TOKEN');
      expect(message).not.toContain('GOOGLE_CLIENT_ID');
      expect(message).not.toContain('GMAIL_USER_EMAIL');
    }
  });

  it('throws Error when required env var is empty string', () => {
    process.env.GOOGLE_CLIENT_ID = '';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    process.env.GOOGLE_REFRESH_TOKEN = 'token';
    process.env.GMAIL_USER_EMAIL = 'test@example.com';

    expect(() => loadGmailConfig()).toThrow(Error);
    
    try {
      loadGmailConfig();
      expect.fail('Should have thrown');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Behavioral contract: empty strings are treated as missing
      expect(message).toContain('GOOGLE_CLIENT_ID');
    }
  });

  it('throws Error when required env var is whitespace only', () => {
    process.env.GOOGLE_CLIENT_ID = '   ';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    process.env.GOOGLE_REFRESH_TOKEN = 'token';
    process.env.GMAIL_USER_EMAIL = 'test@example.com';

    expect(() => loadGmailConfig()).toThrow(Error);
    
    try {
      loadGmailConfig();
      expect.fail('Should have thrown');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Behavioral contract: whitespace-only strings are treated as missing
      expect(message).toContain('GOOGLE_CLIENT_ID');
    }
  });

  it('returns correct GmailConfig when all required vars are present', () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_REFRESH_TOKEN = 'test-refresh-token';
    process.env.GMAIL_USER_EMAIL = 'test@example.com';

    const config = loadGmailConfig();

    expect(config).toEqual({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      refreshToken: 'test-refresh-token',
      userEmail: 'test@example.com',
      intakeLabel: undefined,
      processedLabel: undefined,
      query: undefined,
    });
  });

  it('includes optional fields when they are set', () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_REFRESH_TOKEN = 'test-refresh-token';
    process.env.GMAIL_USER_EMAIL = 'test@example.com';
    process.env.GMAIL_LABEL_INTAKE = 'Label_123';
    process.env.GMAIL_LABEL_PROCESSED = 'Label_456';
    process.env.GMAIL_QUERY = 'from:important@example.com';

    const config = loadGmailConfig();

    expect(config).toEqual({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      refreshToken: 'test-refresh-token',
      userEmail: 'test@example.com',
      intakeLabel: 'Label_123',
      processedLabel: 'Label_456',
      query: 'from:important@example.com',
    });
  });

  it('handles optional fields as undefined when not set', () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_REFRESH_TOKEN = 'test-refresh-token';
    process.env.GMAIL_USER_EMAIL = 'test@example.com';
    // Optional fields not set

    const config = loadGmailConfig();

    expect(config.intakeLabel).toBeUndefined();
    expect(config.processedLabel).toBeUndefined();
    expect(config.query).toBeUndefined();
  });
});

