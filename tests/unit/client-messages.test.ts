import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listMessages, getMessage } from '../../src/gmail/client.js';
import type { GmailConfig } from '../../src/gmail/config.js';

describe('listMessages', () => {
  const mockConfig: GmailConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    refreshToken: 'test-refresh-token',
    userEmail: 'test@example.com',
  };
  const accessToken = 'test-access-token';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls Gmail API with correct URL and Authorization header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [] }),
    });

    global.fetch = mockFetch;

    await listMessages(mockConfig, accessToken, 10);

    expect(mockFetch).toHaveBeenCalledOnce();
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toBe(
      'https://gmail.googleapis.com/gmail/v1/users/test%40example.com/messages?maxResults=10'
    );

    const callOptions = mockFetch.mock.calls[0][1];
    expect(callOptions.headers).toEqual({
      Authorization: 'Bearer test-access-token',
    });
  });

  it('caps maxResults at 50 when maxMessages exceeds 50', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [] }),
    });

    global.fetch = mockFetch;

    await listMessages(mockConfig, accessToken, 100);

    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('maxResults=50');
  });

  it('uses default maxResults of 10 when maxMessages not provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [] }),
    });

    global.fetch = mockFetch;

    await listMessages(mockConfig, accessToken);

    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('maxResults=10');
  });

  it('includes labelIds query param when intakeLabel is set', async () => {
    const configWithLabel: GmailConfig = {
      ...mockConfig,
      intakeLabel: 'Label_123',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [] }),
    });

    global.fetch = mockFetch;

    await listMessages(configWithLabel, accessToken, 10);

    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('labelIds=Label_123');
  });

  it('includes q query param when query is set', async () => {
    const configWithQuery: GmailConfig = {
      ...mockConfig,
      query: 'from:important@example.com',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [] }),
    });

    global.fetch = mockFetch;

    await listMessages(configWithQuery, accessToken, 10);

    const callUrl = mockFetch.mock.calls[0][0];
    const urlObj = new URL(callUrl);
    expect(urlObj.searchParams.get('q')).toBe('from:important@example.com');
  });

  it('includes both labelIds and q when both are set', async () => {
    const configWithBoth: GmailConfig = {
      ...mockConfig,
      intakeLabel: 'Label_123',
      query: 'from:important@example.com',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [] }),
    });

    global.fetch = mockFetch;

    await listMessages(configWithBoth, accessToken, 10);

    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('labelIds=Label_123');
    expect(callUrl).toContain('q=from%3Aimportant%40example.com');
  });

  it('returns empty array when no messages found', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: undefined }),
    });

    global.fetch = mockFetch;

    const messages = await listMessages(mockConfig, accessToken, 10);

    expect(messages).toEqual([]);
  });

  it('returns MessageSummary[] with id and threadId', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        messages: [
          { id: 'msg1', threadId: 'thread1' },
          { id: 'msg2', threadId: 'thread2' },
        ],
      }),
    });

    global.fetch = mockFetch;

    const messages = await listMessages(mockConfig, accessToken, 10);

    expect(messages).toEqual([
      { id: 'msg1', threadId: 'thread1' },
      { id: 'msg2', threadId: 'thread2' },
    ]);
  });

  it('throws Error with HTTP status code when API call fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => JSON.stringify({ error: 'Insufficient permissions' }),
    });

    global.fetch = mockFetch;

    await expect(listMessages(mockConfig, accessToken, 10)).rejects.toThrow(Error);
    
    try {
      await listMessages(mockConfig, accessToken, 10);
      expect.fail('Should have thrown');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Behavioral contract: error includes HTTP status code
      expect(message).toContain('403');
    }
  });
});

describe('getMessage', () => {
  const mockConfig: GmailConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    refreshToken: 'test-refresh-token',
    userEmail: 'test@example.com',
  };
  const accessToken = 'test-access-token';
  const messageId = 'msg123';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls Gmail API with correct URL and format=raw', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: messageId, threadId: 'thread1', raw: 'dGVzdCBtZXNzYWdl' }),
    });

    global.fetch = mockFetch;

    await getMessage(mockConfig, accessToken, messageId);

    expect(mockFetch).toHaveBeenCalledOnce();
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toBe(
      `https://gmail.googleapis.com/gmail/v1/users/test%40example.com/messages/${messageId}?format=raw`
    );

    const callOptions = mockFetch.mock.calls[0][1];
    expect(callOptions.headers).toEqual({
      Authorization: 'Bearer test-access-token',
    });
  });

  it('returns GmailMessage with all fields including raw', async () => {
    const mockMessage = {
      id: messageId,
      threadId: 'thread1',
      snippet: 'Test message snippet',
      raw: 'UmVmZXJlbmNlOiBkZWZhdWx0LUZyb206IHNlbmRlckBleGFtcGxlLmNvbQpUbzogcmVjZWl2ZXJAZXhhbXBsZS5jb20KU3ViamVjdDogVGVzdCBTdWJqZWN0CkNvbnRlbnQtVHlwZTogdGV4dC9wbGFpbgpNSU1FLVZlcnNpb246IDEuMAoKTWVzc2FnZSBib2R5',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMessage,
    });

    global.fetch = mockFetch;

    const message = await getMessage(mockConfig, accessToken, messageId);

    expect(message).toEqual(mockMessage);
    expect(message.id).toBe(messageId);
    expect(message.raw).toBeDefined();
    expect(message.raw).toBe(mockMessage.raw);
    expect(message.raw!.length).toBeGreaterThan(0);
  });

  it('returns GmailMessage with raw field populated when API returns raw content', async () => {
    const mockRawContent = 'UmVmZXJlbmNlOiBkZWZhdWx0LUZyb206IHNlbmRlckBleGFtcGxlLmNvbQpUbzogcmVjZWl2ZXJAZXhhbXBsZS5jb20KU3ViamVjdDogVGVzdCBTdWJqZWN0CkNvbnRlbnQtVHlwZTogdGV4dC9wbGFpbgpNSU1FLVZlcnNpb246IDEuMAoKTWVzc2FnZSBib2R5';
    
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ 
        id: messageId, 
        threadId: 'thread1',
        raw: mockRawContent,
      }),
    });

    global.fetch = mockFetch;

    const message = await getMessage(mockConfig, accessToken, messageId);

    expect(message.raw).toBeDefined();
    expect(message.raw).toBe(mockRawContent);
    expect(message.raw!.length).toBeGreaterThan(0);
  });

  it('throws Error with HTTP status code when API call fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => JSON.stringify({ error: 'Message not found' }),
    });

    global.fetch = mockFetch;

    await expect(getMessage(mockConfig, accessToken, messageId)).rejects.toThrow(Error);
    
    try {
      await getMessage(mockConfig, accessToken, messageId);
      expect.fail('Should have thrown');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Behavioral contract: error includes HTTP status code
      expect(message).toContain('404');
    }
  });

  it('throws Error when response is ok but message id is missing', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ threadId: 'thread1' }), // Missing id
    });

    global.fetch = mockFetch;

    await expect(getMessage(mockConfig, accessToken, messageId)).rejects.toThrow(Error);
    
    try {
      await getMessage(mockConfig, accessToken, messageId);
      expect.fail('Should have thrown');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Behavioral contract: error indicates missing message ID
      expect(message.toLowerCase()).toContain('id');
    }
  });

  it('throws Error with HTTP status code on non-OK response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Server error',
    });

    global.fetch = mockFetch;

    await expect(getMessage(mockConfig, accessToken, messageId)).rejects.toThrow(Error);
    
    try {
      await getMessage(mockConfig, accessToken, messageId);
      expect.fail('Should have thrown');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Behavioral contract: error includes HTTP status code
      expect(message).toContain('500');
    }
  });
});

