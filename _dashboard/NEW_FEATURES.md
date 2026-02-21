# New Features Added ✨

## Overview

Mission Control now includes **project organization** and **task creation** capabilities, accessible from both the web UI and the CLI!

## 🎯 What's New

### 1. Projects
- **Organize tasks by project**
- **Color-coded** for visual organization
- **Track task counts** per project
- **Filter** task board by project

### 2. Task Creation
- **Create tasks from UI** with a simple form
- **Create tasks from CLI** with full control
- **Assign to projects** on creation
- **Set priority** (low, medium, high)

### 3. Enhanced CLI
- **Full project management** (create, list, view)
- **Task creation** with project assignment
- **Move tasks** between projects
- **Better organization** and filtering

---

## 🖥️ Web UI Features

### View the Demo

Visit **http://localhost:3001/demo** to see the new features in action!

### What You Can Do:

1. **Switch Between Projects**
   - Click project tabs at the top
   - See "All Projects" or filter by specific project

2. **Create New Projects**
   - Click "**+ New Project**" button
   - Set name, description, and color
   - Projects appear as tabs

3. **Create New Tasks**
   - Click "**+ New Task**" button
   - Fill in title, description, priority
   - Optionally assign to a project
   - Tasks appear in the board immediately

4. **Organize by Project**
   - Each project has a unique color
   - Tasks show their project affiliation
   - Filter board to see only one project's tasks

---

## 🤖 CLI Features for Agents

### Updated CLI Commands

The CLI now has two main categories: **projects** and **tasks**

### Project Commands

```bash
# List all projects
python agent_cli.py projects list

# Create a project
python agent_cli.py projects create "Website Redesign" "Modernize our website"

# Get project details
python agent_cli.py projects get <project_id>
```

### Task Commands

```bash
# List all tasks
python agent_cli.py tasks list

# List tasks for a specific project
python agent_cli.py tasks list <project_id>

# Create a task (no project)
python agent_cli.py tasks create "Fix bug" "The login button is broken"

# Create a task in a project
python agent_cli.py tasks create "Fix bug" "Login button broken" --project <project_id> --priority high

# Move task to a project
python agent_cli.py tasks move <task_id> <project_id>

# Update task status
python agent_cli.py tasks update <task_id> in_progress

# Add comment to task
python agent_cli.py tasks comment <task_id> "Working on this now"

# Get task details
python agent_cli.py tasks get <task_id>
```

---

## 📡 HTTP API Updates

### New Endpoints

#### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/{id}` | Get project details |
| PATCH | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |

#### Tasks (Enhanced)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?projectId={id}` | List tasks (optionally filter by project) |
| POST | `/api/tasks` | Create task (now accepts `projectId`) |
| PATCH | `/api/tasks/{id}` | Update task (now accepts `projectId`) |

---

## 🔨 Example Workflows

### Workflow 1: Agent Creates Project and Tasks

```bash
# 1. Create a project
python agent_cli.py projects create "Q1 Marketing" "Marketing initiatives for Q1 2026"

# Copy the project ID from output (e.g., k9jab2...)

# 2. Create tasks in that project
python agent_cli.py tasks create "Design landing page" "Create mockup for new product landing page" --project k9jab2 --priority high

python agent_cli.py tasks create "Write email copy" "Draft email for product launch" --project k9jab2 --priority medium

python agent_cli.py tasks create "Schedule social posts" "Plan Instagram and Twitter posts" --project k9jab2 --priority medium

# 3. List tasks for that project
python agent_cli.py tasks list k9jab2
```

### Workflow 2: Human Creates, Agent Organizes

```bash
# Human creates tasks via web UI without projects

# Agent comes in and organizes them
python agent_cli.py projects create "Bug Fixes" "Critical bug fixes"

# Move tasks to the project
python agent_cli.py tasks move task_123 proj_456
python agent_cli.py tasks move task_789 proj_456

# Update statuses
python agent_cli.py tasks update task_123 in_progress
python agent_cli.py tasks comment task_123 "Started working on this bug"
```

### Workflow 3: Daily Standup by Project

```bash
# List all projects to see what teams are working on
python agent_cli.py projects list

# For each project, list tasks
python agent_cli.py tasks list proj_123

# Generate report per project
# (Can extend the CLI to generate formatted reports)
```

---

## 📊 Database Schema Updates

### New Table: `projects`

```typescript
{
  _id: string;
  name: string;
  description: string;
  color: string;          // hex color like "#3B82F6"
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
}
```

### Updated Table: `tasks`

Added field:
```typescript
{
  projectId?: Id<"projects">;  // Optional project assignment
  // ... all other existing fields
}
```

---

## 🎨 Demo Mode Features

Visit **http://localhost:3001/demo** to try:

✅ **3 pre-configured projects** with different colors
✅ **6 sample tasks** distributed across projects
✅ **Project tabs** to filter the board
✅ **"+ New Project"** button
✅ **"+ New Task"** button with project selector
✅ **Visual project indicators** (colored dots)

---

## 🚀 API Examples

### Create a Project

```bash
curl -X POST $CONVEX_URL/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile App V2",
    "description": "Second version of mobile app",
    "color": "#10B981",
    "createdBy": "user_id_here"
  }'
```

### Create Task in Project

```bash
curl -X POST $CONVEX_URL/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement dark mode",
    "description": "Add dark mode support to the app",
    "priority": "high",
    "projectId": "proj_id_here",
    "createdBy": "user_id_here"
  }'
```

### List Tasks by Project

```bash
curl "$CONVEX_URL/api/tasks?projectId=proj_id_here"
```

---

## 🎯 Quick Start

### 1. Try the Demo

```bash
# Server should already be running
open http://localhost:3001/demo
```

Click around:
- Try the project tabs
- Click "+ New Project"
- Click "+ New Task"
- Create some tasks and assign them to projects

### 2. Try the CLI

```bash
# Make sure environment is set
export CONVEX_URL="http://localhost:3001"  # For demo
export DEMO_USER_ID="demo123"

# Try project commands
python agent_cli.py projects list
python agent_cli.py tasks list
```

### 3. Use with Real Convex

Once you run `npx convex dev`:

1. Create a user in Convex dashboard
2. Copy the user ID
3. Set `DEMO_USER_ID` to that ID
4. Set `CONVEX_URL` to your Convex deployment URL
5. Use the CLI with real data!

---

## 📖 Updated Documentation

All documentation has been updated to reflect these new features:

- ✅ `README.md` - Updated API reference
- ✅ `ARCHITECTURE.md` - Updated schema diagrams
- ✅ `agent_cli.py` - Full project and task support
- ✅ Demo UI - Interactive project and task creation

---

## 🎉 Summary

You now have:

✅ **Project organization** - Group related tasks
✅ **Task creation UI** - Create tasks without leaving the browser
✅ **Enhanced CLI** - Agents can manage projects and tasks
✅ **Full API** - All features accessible via HTTP
✅ **Color coding** - Visual organization
✅ **Filtering** - View tasks by project

**Everything works in both demo mode and with real Convex backend!**

Try it now: **http://localhost:3001/demo** 🚀
