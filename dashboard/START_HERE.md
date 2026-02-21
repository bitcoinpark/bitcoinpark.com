# 👋 START HERE

Welcome to **Mission Control Dashboard**! This file will get you up and running in minutes.

## 🎯 What You Have

A complete task management system where:
- **Humans** use a beautiful web interface
- **AI Agents** use HTTP API/CLI tools
- Everyone sees updates **in real-time**

## ⚡ Quick Start (3 Steps)

### Step 1: Initialize Convex

Open a terminal and run:

```bash
npx convex dev
```

**What happens:**
- You'll be prompted to sign in (or create a free Convex account)
- A `.env.local` file will be created automatically
- Your database schema will be deployed
- A dev server will start

**⚠️ IMPORTANT:** Keep this terminal window open! You need it running.

### Step 2: Start the Web App

Open a **NEW terminal window** and run:

```bash
npm run dev
```

**What happens:**
- Next.js dev server starts
- Your app will be available at http://localhost:3000

### Step 3: Create Test Data

1. Look at the first terminal (where `npx convex dev` is running)
2. Find the Convex Dashboard URL (it will be printed in the output)
3. Open that URL in your browser
4. Go to **Data** → **users** → Click **"Add a document"**
5. Paste this:
   ```json
   {
     "name": "Demo User",
     "type": "human",
     "createdAt": 1708531200000
   }
   ```
6. Click **Save**
7. **Copy the `_id`** that was generated (looks like `j97abc123...`)
8. Go to **Data** → **tasks** → Click **"Add a document"**
9. Paste this (replace `YOUR_USER_ID_HERE` with the ID you copied):
   ```json
   {
     "title": "Welcome to Mission Control!",
     "description": "This is your first task. Try updating the status or adding a comment!",
     "status": "todo",
     "priority": "high",
     "createdBy": "YOUR_USER_ID_HERE",
     "createdAt": 1708531200000,
     "updatedAt": 1708531200000
   }
   ```
10. Click **Save**

### Step 4: See It Working!

Go to http://localhost:3000 - your task should appear! 🎉

## 🎮 What to Try Next

### Try the Web UI
- Click on your task to see details
- Update the status (Todo → In Progress → Done)
- Add a comment
- Watch it update in real-time!

### Try the Python CLI

```bash
# Set up environment variables
export CONVEX_URL="your-url-from-env-local"
export DEMO_USER_ID="your-user-id-from-step-3"

# List all tasks
python agent_cli.py list

# Create a new task
python agent_cli.py create "My First CLI Task" "Created from the command line!"

# Go to the web UI and watch it appear instantly!
```

### Try the Example Agents

```bash
# Daily standup report
python examples/daily_standup_agent.py

# Task monitoring
python examples/task_reminder_agent.py
```

## 📚 Documentation

| File | What It's For |
|------|---------------|
| **QUICK_START.md** | 5-minute getting started guide |
| **SETUP.md** | Detailed setup with troubleshooting |
| **README.md** | Full API reference |
| **ARCHITECTURE.md** | How everything works |
| **PROJECT_OVERVIEW.md** | Visual overview of the project |
| **examples/README.md** | Building custom agents |

## 🆘 Common Issues

### "Cannot find module 'convex/react'"
**Solution:** Run `npm install`

### Tasks not appearing in web UI
**Solution:**
1. Check the Convex dashboard - are there tasks in the database?
2. Make sure `npx convex dev` is still running
3. Check browser console for errors

### Python CLI errors
**Solution:**
```bash
# Install requests library
pip install requests

# Make sure environment variables are set
echo $CONVEX_URL
echo $DEMO_USER_ID
```

## 🎯 Development Workflow

Keep these running:

**Terminal 1:**
```bash
npx convex dev
```

**Terminal 2:**
```bash
npm run dev
```

**Browser:**
- http://localhost:3000 (your app)
- Convex Dashboard (to view/edit data)

## 🚀 What's Next?

1. ✅ **Create more tasks** - Build up your task list
2. ✅ **Try different statuses** - Move tasks through the workflow
3. ✅ **Add comments** - Discuss tasks
4. ✅ **Test the CLI** - Create tasks from Python
5. ✅ **Run example agents** - See automation in action
6. ✅ **Build your own agent** - Use examples as templates

## 💡 Quick Tips

- **Real-time updates:** Open the app in two browser tabs, update in one, watch it sync to the other
- **Agent user:** Create a user with `type: "agent"` for your bots
- **API testing:** Use `./test-api.sh` to quickly test the HTTP API
- **Convex dashboard:** Great for inspecting data and running queries manually

## 🎉 You're All Set!

Your Mission Control dashboard is ready to use. Here's the complete startup sequence:

```bash
# Terminal 1
npx convex dev

# Terminal 2 (in a new window)
npm run dev

# Browser
open http://localhost:3000
```

**Happy building! 🚀**

---

Need help? Check the other documentation files or visit the Convex docs at https://docs.convex.dev
