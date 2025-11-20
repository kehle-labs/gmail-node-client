import dotenv from 'dotenv';
import { loadGmailConfig } from '../gmail/config.js';
import {
  fetchAccessToken,
  listMessages,
  getMessage,
} from '../gmail/client.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    // Load configuration
    const cfg = loadGmailConfig();
    console.log(`[gmail] Loaded config for: ${cfg.userEmail}`);

    // Fetch access token
    console.log('[gmail] Fetching access token...');
    const accessToken = await fetchAccessToken(cfg);
    console.log('[gmail] Access token obtained');

    // Get message count from command line or default to 5
    const messageCount = parseInt(process.argv[2] || '5', 10);
    if (isNaN(messageCount) || messageCount < 1) {
      throw new Error('Message count must be a positive number');
    }

    // List messages
    console.log(`[gmail] Listing up to ${messageCount} messages...`);
    const messages = await listMessages(cfg, accessToken, messageCount);

    if (messages.length === 0) {
      console.log('[gmail] No messages found');
      return;
    }

    console.log(`[gmail] Found ${messages.length} message(s):\n`);

    // Display message summaries
    for (const msg of messages) {
      console.log(`[gmail] id=${msg.id} thread=${msg.threadId}`);
    }

    // Fetch and display details for the first message
    if (messages.length > 0) {
      console.log(`\n[gmail] Fetching details for first message (${messages[0].id})...`);
      const fullMessage = await getMessage(cfg, accessToken, messages[0].id);

      // Extract subject from headers
      const headers = fullMessage.payload?.headers || [];
      const subjectHeader = headers.find(
        (h: { name: string; value: string }) => h.name === 'Subject'
      );
      const subject = subjectHeader?.value || '(no subject)';

      console.log(`\n[gmail] Message Details:`);
      console.log(`  ID: ${fullMessage.id}`);
      console.log(`  Thread ID: ${fullMessage.threadId}`);
      console.log(`  Subject: ${subject}`);

      // Try to extract a snippet
      if (fullMessage.snippet) {
        const snippet = fullMessage.snippet.substring(0, 200);
        console.log(`  Snippet: ${snippet}${fullMessage.snippet.length > 200 ? '...' : ''}`);
      }
    }
  } catch (error) {
    console.error('[gmail] Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

