# Quick Start Guide

Get Mission Control running in 5 minutes!

## Prerequisites

```bash
node --version  # Should be 20+
npm --version
```

## 🚀 Three-Step Setup

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Start Convex (in Terminal 1)

```bash
npx convex dev
```

- Sign in to Convex (or create account)
- This creates `.env.local` automatically
- **Keep this terminal open!**

### 3️⃣ Start Next.js (in Terminal 2)

```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

## 📝 Create Your First Task

### Option A: Web UI

1. Open Convex dashboard (URL shown in terminal)
2. Go to **Data** → **users** → **Add a document**:
   ```json
   {
     "name": "Demo User",
     "type": "human",
     "createdAt": 1708531200000
   }
   ```
3. Copy the `_id` (looks like `j97abc...`)
4. Go to **Data** → **tasks** → **Add a document**:
   ```json
   {
     "title": "My First Task",
     "description": "Welcome to Mission Control!",
     "status": "todo",
     "priority": "high",
     "createdBy": "j97abc...",
     "createdAt": 1708531200000,
     "updatedAt": 1708531200000
   }
   ```
5. Refresh http://localhost:3000 - your task appears!

### Option B: HTTP API

```bash
# Get your Convex URL from .env.local
CONVEX_URL="https://your-project.convex.cloud"
USER_ID="j97abc..."  # From step 3 above

curl -X POST "$CONVEX_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"API Task\",
    \"description\": \"Created via API\",
    \"priority\": \"medium\",
    \"createdBy\": \"$USER_ID\"
  }"
```

### Option C: Python CLI

```bash
# Install requests
pip install requests

# Set environment
export CONVEX_URL="https://your-project.convex.cloud"
export DEMO_USER_ID="j97abc..."

# Create task
python agent_cli.py create "CLI Task" "Created from command line"

# List tasks
python agent_cli.py list
```

## 🎯 Common Operations

### View All Tasks
```bash
python agent_cli.py list
```

### Update Task Status
```bash
python agent_cli.py update <task_id> in_progress
```

### Add Comment
```bash
python agent_cli.py comment <task_id> "Working on this now"
```

### View Task Details
```bash
python agent_cli.py get <task_id>
```

## 🔧 Development Workflow

**Terminal Setup:**
```
Terminal 1: npx convex dev     (always running)
Terminal 2: npm run dev         (Next.js)
Browser:    http://localhost:3000
Dashboard:  Convex dashboard    (for data inspection)
```

## 📚 File Structure at a Glance

```
mission-control/
├── convex/              # Backend
│   ├── schema.ts       # Database tables
│   ├── tasks.ts        # Task functions
│   ├── comments.ts     # Comment functions
│   └── http.ts         # API routes
│
├── src/
│   ├── app/            # Next.js pages
│   │   ├── page.tsx    # Home (task board)
│   │   └── tasks/[id]/ # Task details
│   └── components/     # React components
│       ├── TaskBoard.tsx
│       ├── TaskCard.tsx
│       └── CommentList.tsx
│
└── agent_cli.py        # Example CLI
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | Change port: `npm run dev -- -p 3001` |
| "Module not found" | Run `npm install` |
| Tasks not showing | Check Convex dashboard - data exists? |
| CLI "DEMO_USER_ID not set" | `export DEMO_USER_ID=j97...` |
| Real-time not working | Ensure `npx convex dev` is running |

## 🎓 Learn More

- **Full Setup**: See [SETUP.md](SETUP.md)
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **API Reference**: See [README.md](README.md)

## ✅ Verification Checklist

- [ ] Convex dev server running
- [ ] Next.js running on port 3000
- [ ] Can see dashboard in browser
- [ ] Created at least one user
- [ ] Created at least one task
- [ ] Task appears in web UI
- [ ] Can click task to see details
- [ ] Can update task status
- [ ] CLI can list tasks

**All green?** You're ready to build! 🚀

## 🤖 Agent Integration Example

```python
# agent.py - Simple agent that creates a task
import requests
import os

def create_daily_standup():
    convex_url = os.getenv("CONVEX_URL")
    user_id = os.getenv("DEMO_USER_ID")

    task = {
        "title": "Daily Standup",
        "description": f"Team standup - {datetime.now().strftime('%Y-%m-%d')}",
        "priority": "high",
        "createdBy": user_id
    }

    response = requests.post(f"{convex_url}/api/tasks", json=task)
    print(f"Created task: {response.json()}")

if __name__ == "__main__":
    create_daily_standup()
```

## 🌟 Next Steps

1. **Create more tasks** - Build your backlog
2. **Assign tasks** - To team members or agents
3. **Add comments** - Collaborate on tasks
4. **Build an agent** - Automate task creation/updates
5. **Customize UI** - Make it yours!

Happy building! 🎉
