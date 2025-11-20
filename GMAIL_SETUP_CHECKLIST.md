# Gmail OAuth2 Setup Checklist

Step-by-step guide to set up Gmail API access for integration testing.

## Google Cloud Console Setup

### ✅ Step 1: Project Creation (COMPLETED)
- [x] Created Google Cloud Project
- [x] Project name: `Gmail Node Client`
- [x] Project ID: `gmail-node-client`
- [x] Project number: `753763163982`

### ⏳ Step 2: OAuth Consent Screen Configuration (CURRENT STEP)

**App Information:**
- [x] **App name**: `Gmail Node Client` ✅ (what users see when authorizing)
- [x] **User support email**: `tdg@kehle.com` ✅ (where users contact you about consent)

**Additional Info (all optional for testing):**
- [ ] **App logo**: Skip for now
- [ ] **App home page**: Skip or use `https://github.com/kehle-labs/gmail-node-client`
- [ ] **App privacy policy link**: Skip for testing
- [ ] **App terms of service link**: Skip for testing
- [ ] **Authorized domains**: Skip for testing

**IMPORTANT**: 
- Choose **"Internal"** app type (since you're in `kehle.com` organization)
  - ✅ Internal apps don't need test users - any user in your org can authorize
  - ✅ Simplifies setup - no test user management needed
  - ✅ Still restricted to your organization (secure)
- Save and continue through the wizard
- Complete the consent screen configuration

**Note**: With Internal app type, you can skip the test users step entirely!

### ✅ Step 3: Enable Gmail API (COMPLETED)
- [x] Gmail API is enabled

### ✅ Step 4: Create OAuth2 Credentials (COMPLETED)
**Where you are**: You're being asked to create an OAuth client. This is the right step!

**Steps to create OAuth Client ID:**

1. **If not already there, go to**:
   - "APIs & Services" > "Credentials"
   - OR you may already be on a page that says "Create OAuth client ID"

2. **Application type**: Choose **"Desktop app"** (recommended) or **"Web application"**
   - Desktop app is easier for local development
   - Web application also works if you prefer

3. **Name**: `Gmail Node Client - Desktop` (or any descriptive name you like)

4. **Click "Create"**

5. **IMPORTANT - Copy these BEFORE closing the dialog**:
   - `Client ID` (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
   - `Client Secret` (looks like: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)
   
   ⚠️ **You can only see the secret once** - copy it immediately!

6. **Save these securely** - you'll need them for `.env.local`

**After creating the OAuth client:**
- You'll see it in the Credentials list
- Save the Client ID and Client Secret - you'll need them next!

### ✅ Step 5: Get Refresh Token (COMPLETED)
- [x] Obtained refresh token via OAuth2 flow
- [x] Refresh token saved securely

### ✅ Step 6: Configure Environment Variables (COMPLETED)
- [x] Created `.env.local` file with all credentials:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REFRESH_TOKEN`
  - `GMAIL_USER_EMAIL=tdg@kehle.com`
- [x] Verified `.env.local` is in `.gitignore`

### ✅ Step 7: Run Integration Test (COMPLETED)
- [x] Integration test passes: `GMAIL_LIVE_TEST=1 npm test`
- [x] Verified end-to-end flow:
  - [x] Gets access token
  - [x] Lists messages (may be empty)
  - [x] Fetches message if any exist

## Notes

- **Test Account**: Use a Gmail account in your organization (`@kehle.com` or authorized domain)
- **Internal App**: Since you chose Internal app type, any user in your org can authorize automatically
- **Refresh Token**: This is long-lived - save it securely. You only need to get it once.
- **Scope**: `gmail.readonly` is sufficient for listing and reading messages

## Troubleshooting

- **"Access blocked"**: With Internal app, make sure you're signing in with a Google account in your organization (`@kehle.com`)
- **"Invalid grant"**: Refresh token may have expired or been revoked - get a new one
- **"API not enabled"**: Make sure Gmail API is enabled in your Google Cloud project
- **403 Forbidden**: Check that you selected the correct scopes (gmail.readonly)

