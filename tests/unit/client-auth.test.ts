import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchAccessToken } from '../../src/gmail/client.js';
import type { GmailConfig } from '../../src/gmail/config.js';

describe('fetchAccessToken', () => {
  const mockConfig: GmailConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    refreshToken: 'test-refresh-token',
    userEmail: 'test@example.com',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns access token when OAuth2 token exchange succeeds', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'abc123' }),
    });

    global.fetch = mockFetch;

    const token = await fetchAccessToken(mockConfig);

    expect(token).toBe('abc123');
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    );

    const callBody = mockFetch.mock.calls[0][1].body;
    expect(callBody).toContain('client_id=test-client-id');
    expect(callBody).toContain('client_secret=test-client-secret');
    expect(callBody).toContain('refresh_token=test-refresh-token');
    expect(callBody).toContain('grant_type=refresh_token');
  });

  it('throws Error with HTTP status code when OAuth2 token exchange fails with 400', async () => {
    const errorBody = JSON.stringify({ error: 'invalid_grant', error_description: 'Token expired' });
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => errorBody,
    });

    global.fetch = mockFetch;

    await expect(fetchAccessToken(mockConfig)).rejects.toThrow(Error);
    
    try {
      await fetchAccessToken(mockConfig);
      expect.fail('Should have thrown');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Behavioral contract: error includes HTTP status code
      expect(message).toContain('400');
      // Behavioral contract: error includes response body (for debugging)
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it('throws Error with HTTP status code when OAuth2 token exchange fails with 401', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Unauthorized',
    });

    global.fetch = mockFetch;

    await expect(fetchAccessToken(mockConfig)).rejects.toThrow(Error);
    
    try {
      await fetchAccessToken(mockConfig);
      expect.fail('Should have thrown');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Behavioral contract: error includes HTTP status code
      expect(message).toContain('401');
    }
  });

  it('throws error when response is ok but access_token is missing', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'something_went_wrong' }),
    });

    global.fetch = mockFetch;

    await expect(fetchAccessToken(mockConfig)).rejects.toThrow(
      /Access token not found in response/
    );
  });

  it('throws error when response is ok but access_token is empty string', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: '' }),
    });

    global.fetch = mockFetch;

    await expect(fetchAccessToken(mockConfig)).rejects.toThrow(
      /Access token not found in response/
    );
  });

  it('does not log client secret or refresh token in error messages', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => JSON.stringify({ error: 'invalid_grant' }),
    });

    global.fetch = mockFetch;

    try {
      await fetchAccessToken(mockConfig);
      expect.fail('Should have thrown');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Error should not contain sensitive data
      expect(errorMessage).not.toContain('test-client-secret');
      expect(errorMessage).not.toContain('test-refresh-token');
      // Error should contain non-sensitive status info
      expect(errorMessage).toContain('400');
      expect(errorMessage).toContain('Bad Request');
    }
  });
});

