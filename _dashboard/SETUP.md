# Mission Control Setup Guide

Follow these steps to get the Mission Control dashboard up and running.

## Prerequisites

- Node.js 20+ installed
- npm or yarn
- A Convex account (free tier works great)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Convex

```bash
npx convex dev
```

This command will:
1. Prompt you to log in to Convex (or create an account)
2. Create a new Convex project
3. Generate `.env.local` with your `NEXT_PUBLIC_CONVEX_URL`
4. Push the database schema from `convex/schema.ts`
5. Start the Convex development server

**Important**: Keep this terminal window open! The Convex dev server needs to run continuously.

You'll see output like:
```
✔ Convex URL: https://fuzzy-bear-123.convex.cloud
✔ Saved NEXT_PUBLIC_CONVEX_URL to .env.local
```

### 3. Create Test Users

Open the Convex dashboard (the URL is printed in the console, or visit [https://dashboard.convex.dev](https://dashboard.convex.dev)):

1. Go to **Data** → **users** table
2. Click **Add a document**
3. Create a human user:
   ```json
   {
     "name": "Demo User",
     "type": "human",
     "createdAt": 1708531200000
   }
   ```
4. Click **Save**
5. **Copy the generated `_id`** (e.g., `j97abc123...`) - you'll need this!
6. Create an AI agent user:
   ```json
   {
     "name": "AI Assistant",
     "type": "agent",
     "createdAt": 1708531200000
   }
   ```

### 4. Create Test Tasks (Optional)

You can create tasks via the dashboard or wait to use the web UI:

1. Go to **Data** → **tasks** table
2. Click **Add a document**
3. Create a task:
   ```json
   {
     "title": "Welcome to Mission Control",
     "description": "This is your first task! Try updating its status.",
     "status": "todo",
     "priority": "medium",
     "createdBy": "j97abc123...",  // Use the user ID from step 3
     "createdAt": 1708531200000,
     "updatedAt": 1708531200000
   }
   ```

### 5. Update Environment Variables

Copy the demo user ID for use with the CLI:

```bash
# Copy .env.local.example to .env.local if it doesn't exist
cp .env.local.example .env.local

# Edit .env.local and add the user ID
DEMO_USER_ID=j97abc123...  # The ID from step 3
```

### 6. Start the Next.js Development Server

Open a **new terminal window** (keep `npx convex dev` running in the first one):

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the dashboard!

### 7. Test the Agent CLI (Optional)

Install Python dependencies:
```bash
pip install requests
```

Set environment variables:
```bash
export CONVEX_URL="https://your-project.convex.cloud"  # From .env.local
export DEMO_USER_ID="j97abc123..."  # Your user ID
```

Test the CLI:
```bash
# List all tasks
python agent_cli.py list

# Create a task
python agent_cli.py create "Test CLI Task" "Created from the command line"

# Refresh the web UI to see the new task!
```

## Verification Checklist

- [ ] `npx convex dev` is running without errors
- [ ] `.env.local` exists with `NEXT_PUBLIC_CONVEX_URL`
- [ ] At least one user exists in Convex dashboard
- [ ] Web UI loads at http://localhost:3000
- [ ] Tasks appear in the Kanban board
- [ ] Can click a task to view details
- [ ] Can add comments to tasks
- [ ] Can update task status
- [ ] CLI can list tasks

## Troubleshooting

### "Cannot find module 'convex/react'"

Run `npm install` to ensure all dependencies are installed.

### "NEXT_PUBLIC_CONVEX_URL is not defined"

Make sure `npx convex dev` has completed successfully and created `.env.local`.

### "Network error" in web UI

Ensure `npx convex dev` is still running in a terminal window.

### Tasks not showing in web UI

1. Check Convex dashboard to verify tasks exist
2. Open browser console for errors
3. Verify the task's `createdBy` field has a valid user ID

### CLI "Error: DEMO_USER_ID not set"

Set the environment variable:
```bash
export DEMO_USER_ID="your-user-id-here"
```

Or pass it when running the script:
```bash
DEMO_USER_ID="j97..." python agent_cli.py list
```

## Next Steps

Once everything is working:

1. **Create more tasks** via the web UI or CLI
2. **Assign tasks** to different users/agents
3. **Add comments** to discuss tasks
4. **Test the HTTP API** with curl or Postman
5. **Build your own agent** that uses the API

## API Testing with curl

```bash
# Replace with your Convex URL
CONVEX_URL="https://your-project.convex.cloud"

# List tasks
curl "$CONVEX_URL/api/tasks"

# Create a task
curl -X POST "$CONVEX_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test from curl",
    "description": "Testing the API",
    "priority": "medium",
    "createdBy": "j97..."
  }'

# Update task status
curl -X PATCH "$CONVEX_URL/api/tasks/<task-id>" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

## Development Workflow

1. **Terminal 1**: `npx convex dev` (always running)
2. **Terminal 2**: `npm run dev` (Next.js dev server)
3. **Browser**: http://localhost:3000 (web UI)
4. **Convex Dashboard**: Monitor database and functions

Happy building! 🚀
