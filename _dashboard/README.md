# Mission Control Dashboard

A modular mission control dashboard for humans and AI agents to collaborate on tasks. Built with Next.js, Convex, and TypeScript.

## Features

- ✅ **Task Management**: Create, update, and track tasks with status (todo, in_progress, done)
- 🎯 **Priority Levels**: Low, medium, and high priority tasks
- 👥 **Assignment**: Assign tasks to humans or AI agents
- 💬 **Comments**: Add comments and discussions to tasks
- 🌐 **HTTP API**: RESTful API for agents and bots
- 📊 **Kanban Board**: Visual task board with real-time updates
- 🤖 **Agent-Friendly**: CLI tools for AI agents to interact with tasks

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Convex

```bash
npx convex dev
```

This will:
- Create a Convex project (you'll need to sign in)
- Generate `.env.local` with your `NEXT_PUBLIC_CONVEX_URL`
- Push the database schema
- Start the Convex development server

### 3. Seed Test Data

Open the Convex dashboard (printed in console) and create some test data:

**Users:**
```javascript
// In the Convex dashboard -> Data -> users -> "Add row"
{
  name: "Demo User",
  type: "human",
  createdAt: Date.now()
}

{
  name: "AI Agent",
  type: "agent",
  createdAt: Date.now()
}
```

Copy the user IDs for use in creating tasks.

**Tasks:**
```javascript
// In the Convex dashboard -> Data -> tasks -> "Add row"
{
  title: "Setup project infrastructure",
  description: "Initialize the project with Next.js and Convex",
  status: "done",
  priority: "high",
  createdBy: "<user_id_here>",
  createdAt: Date.now(),
  updatedAt: Date.now()
}
```

### 4. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Project Structure

```
mission-control/
├── convex/
│   ├── schema.ts          # Database schema (users, tasks, comments)
│   ├── http.ts            # HTTP API routes for agents
│   ├── tasks.ts           # Task queries & mutations
│   └── comments.ts        # Comment queries & mutations
├── src/
│   ├── app/
│   │   ├── layout.tsx     # Root layout with Convex provider
│   │   ├── page.tsx       # Home page with task board
│   │   └── tasks/[id]/
│   │       └── page.tsx   # Task detail page
│   └── components/
│       ├── ConvexClientProvider.tsx
│       ├── TaskBoard.tsx   # Kanban board component
│       ├── TaskCard.tsx    # Task card component
│       └── CommentList.tsx # Comments display
├── agent_cli.py           # Example Python CLI for agents
└── README.md
```

## API Documentation

Base URL: `https://your-deployment.convex.cloud` (found in `.env.local`)

### List All Tasks

```bash
GET /api/tasks
```

**Response:**
```json
[
  {
    "_id": "j9...",
    "title": "Task title",
    "description": "Task description",
    "status": "todo",
    "priority": "medium",
    "createdAt": 1234567890,
    "updatedAt": 1234567890,
    "assignedTo": {
      "_id": "j9...",
      "name": "Agent Name",
      "type": "agent"
    },
    "createdBy": { ... }
  }
]
```

### Create Task

```bash
POST /api/tasks
Content-Type: application/json

{
  "title": "New task",
  "description": "Task description",
  "priority": "medium",
  "createdBy": "<user_id>"
}
```

### Update Task

```bash
PATCH /api/tasks/{task_id}
Content-Type: application/json

{
  "status": "in_progress"
}
```

### Add Comment

```bash
POST /api/tasks/{task_id}/comments
Content-Type: application/json

{
  "content": "Comment text",
  "authorId": "<user_id>"
}
```

## Using the Agent CLI

The included Python script provides a command-line interface for agents:

### Setup

```bash
# Set environment variables
export CONVEX_URL="https://your-deployment.convex.cloud"
export DEMO_USER_ID="<your_user_id>"

# Install requests library
pip install requests
```

### Commands

```bash
# List all tasks
python agent_cli.py list

# Create a task
python agent_cli.py create "Task title" "Task description"

# Get task details
python agent_cli.py get <task_id>

# Update task status
python agent_cli.py update <task_id> in_progress

# Add a comment
python agent_cli.py comment <task_id> "Working on this now"
```

## Database Schema

### Users
- `name`: string - User or agent name
- `type`: "human" | "agent" - User type
- `createdAt`: number - Timestamp

### Tasks
- `title`: string - Task title
- `description`: string - Task description
- `status`: "todo" | "in_progress" | "done" - Current status
- `priority`: "low" | "medium" | "high" - Priority level
- `dueDate`: number (optional) - Due date timestamp
- `assignedTo`: User ID (optional) - Assigned user
- `createdBy`: User ID - Creator
- `createdAt`: number - Created timestamp
- `updatedAt`: number - Last updated timestamp

### Comments
- `taskId`: Task ID - Associated task
- `authorId`: User ID - Comment author
- `content`: string - Comment text
- `createdAt`: number - Created timestamp

## POC Limitations

This is a proof of concept with some intentional limitations:

- ❌ **No Authentication**: Uses hardcoded demo user (add auth later)
- ❌ **No Permissions**: All users can edit all tasks
- ❌ **Basic UI**: Minimal styling, no drag-and-drop
- ❌ **Manual Refresh**: Some actions may require page refresh

## Next Steps

After validating the POC:

1. **Add Authentication**
   - Convex Auth for human users
   - API keys for agents

2. **Enhanced UI**
   - Drag-and-drop task management
   - Advanced filtering and search
   - Activity feed

3. **Additional Features**
   - Tags and labels
   - File attachments
   - Time tracking
   - Notifications

4. **Production Deployment**
   - Deploy to Vercel
   - Set up production Convex deployment
   - Add monitoring and analytics

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Convex (serverless functions + real-time database)
- **Real-time**: Convex subscriptions (automatic)
- **API**: HTTP routes via Convex

## Free Tier Limits

Convex Free Tier includes:
- 1M function calls/month
- 1GB database storage
- 1GB bandwidth

This POC uses minimal resources and stays well within free tier limits.

## License

MIT
