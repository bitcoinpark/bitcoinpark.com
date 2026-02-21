# Mission Control Agent Examples

This directory contains example AI agents that demonstrate how to build automation on top of Mission Control.

## Available Agents

### 1. Daily Standup Agent (`daily_standup_agent.py`)

Automatically creates a daily standup task with a summary of:
- Tasks completed yesterday
- Tasks currently in progress
- Total todo count

**Usage:**
```bash
export CONVEX_URL="https://your-project.convex.cloud"
export DEMO_USER_ID="j97..."

python examples/daily_standup_agent.py
```

**What it does:**
- Analyzes all tasks
- Identifies completed tasks from the last 24 hours
- Generates a formatted standup report
- Creates a new high-priority task with the summary

**Best for:** Daily team standup automation, progress tracking

### 2. Task Reminder Agent (`task_reminder_agent.py`)

Monitors tasks and sends reminders for:
- Overdue tasks (past due date)
- High-priority tasks not started
- Stale in-progress tasks (>7 days without update)

**Usage:**
```bash
export CONVEX_URL="https://your-project.convex.cloud"
export DEMO_USER_ID="j97..."

python examples/task_reminder_agent.py
```

**What it does:**
- Scans all tasks for issues
- Posts reminder comments on tasks needing attention
- Provides summary statistics
- Mentions assignees when appropriate

**Best for:** Task management hygiene, preventing stale tasks

## Setup

### Prerequisites

```bash
# Install required Python package
pip install requests
```

### Environment Variables

Both agents require these environment variables:

```bash
# Your Convex deployment URL (from .env.local)
export CONVEX_URL="https://your-project.convex.cloud"

# A user ID for the bot (create a user with type="agent" in Convex dashboard)
export DEMO_USER_ID="j97..."
```

**Tip:** Create a `.env` file and source it:

```bash
# .env
export CONVEX_URL="https://your-project.convex.cloud"
export DEMO_USER_ID="j97..."
```

```bash
# Load environment
source .env
```

## Creating Your Own Agent

Here's a template for building custom agents:

```python
#!/usr/bin/env python3
import requests
import os

class MissionControlAPI:
    """Wrapper for Mission Control API"""

    def __init__(self, base_url, user_id):
        self.base_url = base_url.rstrip("/")
        self.user_id = user_id

    def list_tasks(self):
        response = requests.get(f"{self.base_url}/api/tasks")
        response.raise_for_status()
        return response.json()

    def create_task(self, title, description, priority="medium"):
        payload = {
            "title": title,
            "description": description,
            "priority": priority,
            "createdBy": self.user_id,
        }
        response = requests.post(f"{self.base_url}/api/tasks", json=payload)
        response.raise_for_status()
        return response.json()

    def update_task(self, task_id, **updates):
        response = requests.patch(
            f"{self.base_url}/api/tasks/{task_id}",
            json=updates
        )
        response.raise_for_status()
        return response.json()

    def add_comment(self, task_id, content):
        payload = {"content": content, "authorId": self.user_id}
        response = requests.post(
            f"{self.base_url}/api/tasks/{task_id}/comments",
            json=payload
        )
        response.raise_for_status()
        return response.json()

def main():
    convex_url = os.getenv("CONVEX_URL")
    user_id = os.getenv("DEMO_USER_ID")

    api = MissionControlAPI(convex_url, user_id)

    # Your agent logic here
    tasks = api.list_tasks()
    print(f"Found {len(tasks)} tasks")

if __name__ == "__main__":
    main()
```

## Agent Ideas

Here are some ideas for agents you could build:

### Task Automation
- **Auto-assign Agent**: Automatically assign tasks based on keywords or priority
- **Task Prioritizer**: Re-prioritize tasks based on due dates
- **Dependency Tracker**: Monitor task dependencies and alert when blockers are done

### Reporting
- **Weekly Summary Agent**: Generate weekly progress reports
- **Burndown Chart Agent**: Calculate and visualize sprint progress
- **Team Workload Agent**: Monitor task distribution across team members

### Integration
- **GitHub Integration Agent**: Create tasks from GitHub issues
- **Slack Bot**: Post task updates to Slack channels
- **Email Notifier**: Send email summaries of tasks

### Smart Automation
- **AI Task Suggester**: Use LLM to suggest next tasks based on history
- **Time Estimator**: Predict task completion time based on similar tasks
- **Risk Detector**: Flag tasks that might miss deadlines

## Scheduling Agents

### With Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add daily standup at 9 AM
0 9 * * * cd /path/to/mission-control && source .env && python examples/daily_standup_agent.py

# Add reminder check every 2 hours
0 */2 * * * cd /path/to/mission-control && source .env && python examples/task_reminder_agent.py
```

### With GitHub Actions

```yaml
# .github/workflows/daily-standup.yml
name: Daily Standup
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM daily
  workflow_dispatch:

jobs:
  standup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - run: pip install requests
      - run: python examples/daily_standup_agent.py
        env:
          CONVEX_URL: ${{ secrets.CONVEX_URL }}
          DEMO_USER_ID: ${{ secrets.DEMO_USER_ID }}
```

## API Reference

All agents interact with these endpoints:

### List Tasks
```python
GET /api/tasks
Returns: List of all tasks with populated assignee/creator
```

### Create Task
```python
POST /api/tasks
Body: {
  "title": str,
  "description": str,
  "priority": "low" | "medium" | "high",
  "createdBy": str (user ID)
}
Returns: { "taskId": str }
```

### Update Task
```python
PATCH /api/tasks/{task_id}
Body: {
  "status": "todo" | "in_progress" | "done",
  "priority": "low" | "medium" | "high",
  "assignedTo": str (user ID)
}
Returns: { "success": true }
```

### Add Comment
```python
POST /api/tasks/{task_id}/comments
Body: {
  "content": str,
  "authorId": str (user ID)
}
Returns: { "commentId": str }
```

## Best Practices

1. **Use a dedicated agent user**: Create a user with `type="agent"` for your bots
2. **Handle errors gracefully**: Wrap API calls in try/except blocks
3. **Rate limiting**: Don't spam the API - add delays between bulk operations
4. **Logging**: Print clear messages about what your agent is doing
5. **Idempotency**: Make sure running the agent multiple times is safe

## Contributing

Have a cool agent idea? Feel free to:
1. Create your agent in this directory
2. Add documentation in this README
3. Share with the community!

## License

MIT - Build whatever you want!
