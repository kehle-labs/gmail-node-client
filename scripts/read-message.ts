import dotenv from 'dotenv';
import { loadGmailConfig } from '../src/gmail/config.js';
import { fetchAccessToken, getMessage } from '../src/gmail/client.js';

dotenv.config({ path: '.env.local' });

async function main() {
  try {
    const cfg = loadGmailConfig();
    console.log(`[gmail] Loading config for: ${cfg.userEmail}`);
    
    console.log('[gmail] Fetching access token...');
    const accessToken = await fetchAccessToken(cfg);
    console.log('[gmail] Access token obtained\n');
    
    // Use the first message ID from the previous list
    const messageId = process.argv[2] || '19aa393b55397750';
    console.log(`[gmail] Fetching full message: ${messageId}\n`);
    
    const message = await getMessage(cfg, accessToken, messageId);
    
    console.log('='.repeat(80));
    console.log('FULL MESSAGE DETAILS');
    console.log('='.repeat(80));
    console.log(`ID: ${message.id}`);
    console.log(`Thread ID: ${message.threadId}`);
    console.log(`Subject: ${message.payload?.headers?.find(h => h.name === 'Subject')?.value || 'N/A'}`);
    console.log(`From: ${message.payload?.headers?.find(h => h.name === 'From')?.value || 'N/A'}`);
    console.log(`To: ${message.payload?.headers?.find(h => h.name === 'To')?.value || 'N/A'}`);
    console.log(`Date: ${message.payload?.headers?.find(h => h.name === 'Date')?.value || 'N/A'}`);
    console.log(`Snippet: ${message.snippet || 'N/A'}`);
    console.log('\n' + '-'.repeat(80));
    console.log('MESSAGE BODY:');
    console.log('-'.repeat(80));
    
    // Try to extract body text
    function extractBody(part: any): string {
      if (part.body?.data) {
        try {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        } catch {
          return '';
        }
      }
      if (part.parts) {
        return part.parts.map(extractBody).join('\n');
      }
      return '';
    }
    
    const bodyText = message.payload ? extractBody(message.payload) : '';
    if (bodyText) {
      console.log(bodyText);
    } else {
      console.log('(Body text not available in this format - raw message may be available)');
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (err) {
    console.error('[error]', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
