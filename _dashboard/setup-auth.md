# Authentication Setup Guide

## Overview

Mission Control now supports secure authentication for both humans and AI agents:

- **Human Users**: Email/password login via Convex Auth (web UI)
- **AI Agents**: API key authentication (CLI/HTTP API)

---

## Quick Setup

### Step 1: Initialize Convex with Auth

```bash
# Make sure Convex is running
npx convex dev
```

### Step 2: Create Your First User (Convex Dashboard)

1. Open the Convex dashboard
2. Go to **Data** → **users**
3. Click **"Add a document"**
4. Create yourself as an admin:
   ```json
   {
     "name": "Your Name",
     "type": "human",
     "email": "you@example.com",
     "createdAt": 1708531200000
   }
   ```
5. **Copy the generated `_id`** - you'll need it!

### Step 3: Create an API Key for Your Agents

In the Convex dashboard:

1. Go to **Functions** → Run **apiKeys:create**
2. Set arguments:
   ```json
   {
     "name": "Main Agent Key",
     "permissions": ["read", "write"],
     "userId": "YOUR_USER_ID_FROM_STEP_2"
   }
   ```
3. Click **Run**
4. **Copy the `apiKey` from the result** - it won't be shown again!

### Step 4: Configure Your Agent CLI

```bash
# Set environment variables
export CONVEX_URL="https://your-deployment.convex.cloud"
export API_KEY="mc_abc123..."  # The key from Step 3
```

### Step 5: Test Authentication

```bash
# Test with your API key
python agent_cli.py projects list
```

---

## For Team Members

### Adding Team Members (Web UI)

Once you've set up authentication:

1. Share the deployed URL with team members
2. They can sign up with email/password
3. You can create API keys for them if needed

### Adding Agent Users

To create a bot/agent user:

1. Go to Convex dashboard → **Data** → **users**
2. Create a user with `type: "agent"`:
   ```json
   {
     "name": "Daily Standup Bot",
     "type": "agent",
     "createdAt": 1708531200000
   }
   ```
3. Copy the `_id`
4. Create an API key for this agent:
   - Go to **Functions** → Run **apiKeys:create**
   - Use the agent's user ID
   - Set appropriate permissions

---

## Authentication Methods

### For Humans (Web UI)

**Email/Password Authentication:**

```typescript
// Users can sign up and log in with email/password
// No OAuth setup required for POC
```

Future OAuth providers (optional):
- GitHub
- Google
- Any Auth.js provider

### For Agents (HTTP API/CLI)

**API Key Authentication:**

All HTTP requests must include the API key:

```bash
# In request headers
Authorization: Bearer mc_abc123...

# Or just:
Authorization: mc_abc123...
```

**CLI Usage:**

```bash
# Set the API key
export API_KEY="mc_abc123..."

# Use the CLI
python agent_cli.py tasks list
```

---

## API Key Management

### Creating API Keys

**Via Convex Dashboard:**
```json
// Run apiKeys:create
{
  "name": "Production Bot",
  "permissions": ["read", "write"],
  "userId": "user_id_here"
}
```

**Response:**
```json
{
  "keyId": "key_abc123",
  "apiKey": "mc_xyz789...",  // ⚠️ Save this! Won't be shown again
  "name": "Production Bot"
}
```

### Listing Your API Keys

```json
// Run apiKeys:list
{
  "userId": "your_user_id"
}
```

Returns keys without revealing the actual key value.

### Revoking API Keys

```json
// Run apiKeys:revoke
{
  "keyId": "key_abc123"
}
```

---

## Permissions

API keys support permission levels:

- `["read"]` - Can only view tasks, projects, comments
- `["read", "write"]` - Can create and update tasks, projects
- `["read", "write", "admin"]` - Full access including key management

**POC Note:** Currently all authenticated requests have full access. Permission checking will be added in the next phase.

---

## Security Best Practices

### API Keys

✅ **DO:**
- Store API keys in environment variables
- Use different keys for different agents/environments
- Rotate keys periodically
- Revoke unused keys
- Set expiration dates for temporary access

❌ **DON'T:**
- Commit API keys to version control
- Share keys in chat or email
- Reuse keys across multiple agents
- Use production keys in development

### Environment Variables

```bash
# .env (NEVER commit this file!)
CONVEX_URL=https://your-deployment.convex.cloud
API_KEY=mc_abc123...
```

```bash
# In your .gitignore
.env
.env.local
*.key
```

---

## Updated CLI Usage

The CLI now requires authentication:

```bash
# Set your API key
export API_KEY="mc_abc123..."

# Or pass it inline
API_KEY="mc_abc123..." python agent_cli.py tasks list
```

All commands now work the same way, but require authentication.

---

## HTTP API with Authentication

### Example Requests

**List Tasks:**
```bash
curl https://your-deployment.convex.cloud/api/tasks \
  -H "Authorization: Bearer mc_abc123..."
```

**Create Task:**
```bash
curl -X POST https://your-deployment.convex.cloud/api/tasks \
  -H "Authorization: Bearer mc_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Secure task",
    "description": "This task is protected",
    "priority": "high",
    "createdBy": "user_id"
  }'
```

**Without Auth (Returns 401):**
```bash
curl https://your-deployment.convex.cloud/api/tasks
# Returns: {"error": "Missing Authorization header"}
```

---

## Web UI Authentication

### Sign Up Flow

1. Visit your deployed app
2. Click "Sign Up"
3. Enter email and password
4. You're logged in!

### Login Flow

1. Visit your app
2. Click "Login"
3. Enter credentials
4. Access your dashboard

### Logout

Click "Logout" in the UI to end your session.

---

## Troubleshooting

### "Missing Authorization header"

**Problem:** API request without auth
**Solution:** Include the `Authorization` header with your API key

```bash
# Wrong
curl $CONVEX_URL/api/tasks

# Right
curl $CONVEX_URL/api/tasks -H "Authorization: Bearer mc_abc123..."
```

### "Invalid API key"

**Problem:** Key is wrong, expired, or revoked
**Solution:**
1. Check you're using the correct key
2. List your keys with `apiKeys:list` in Convex dashboard
3. Create a new key if needed

### "Must be authenticated"

**Problem:** Trying to access protected resource without auth
**Solution:** Set up authentication following Step 1-3 above

---

## Next Steps

After setting up authentication:

1. ✅ **Add team members** via signup
2. ✅ **Create API keys** for your agents
3. ✅ **Test access** with CLI and API
4. ✅ **Deploy to production** with Convex
5. ✅ **Add OAuth providers** (optional) - GitHub, Google, etc.

---

## Migration from POC

If you have existing data without auth:

1. Create user accounts for existing users
2. Link existing tasks to user accounts
3. Create API keys for existing agents
4. Update agent code to use API keys
5. Enable authentication in production

---

## Environment Setup Template

```bash
# .env.template (commit this)
CONVEX_URL=
API_KEY=

# .env (DON'T commit this)
CONVEX_URL=https://fuzzy-bear-123.convex.cloud
API_KEY=mc_abc123def456ghi789...
```

---

## Summary

✅ **Humans** log in with email/password (web UI)
✅ **Agents** use API keys (CLI/API)
✅ **Team access** via shared deployment
✅ **Secure** - all endpoints require authentication
✅ **Manageable** - create, list, and revoke keys easily

**Your Mission Control is now secure!** 🔒
