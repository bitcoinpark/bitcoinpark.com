#!/usr/bin/env python3
"""
Daily Standup Agent

This agent automatically creates a daily standup task and posts
a summary of tasks completed yesterday.

Usage:
  python daily_standup_agent.py

Environment Variables:
  CONVEX_URL      - Your Convex deployment URL
  DEMO_USER_ID    - Bot user ID
"""

import requests
import os
from datetime import datetime, timedelta


class MissionControlAPI:
    """Wrapper for Mission Control API"""

    def __init__(self, base_url, user_id):
        self.base_url = base_url.rstrip("/")
        self.user_id = user_id

    def list_tasks(self):
        """Get all tasks"""
        response = requests.get(f"{self.base_url}/api/tasks")
        response.raise_for_status()
        return response.json()

    def create_task(self, title, description, priority="medium", assignee=None):
        """Create a new task"""
        payload = {
            "title": title,
            "description": description,
            "priority": priority,
            "createdBy": self.user_id,
        }
        if assignee:
            payload["assignedTo"] = assignee

        response = requests.post(f"{self.base_url}/api/tasks", json=payload)
        response.raise_for_status()
        return response.json()

    def update_task(self, task_id, **updates):
        """Update a task"""
        response = requests.patch(f"{self.base_url}/api/tasks/{task_id}", json=updates)
        response.raise_for_status()
        return response.json()

    def add_comment(self, task_id, content):
        """Add a comment to a task"""
        payload = {"content": content, "authorId": self.user_id}
        response = requests.post(
            f"{self.base_url}/api/tasks/{task_id}/comments", json=payload
        )
        response.raise_for_status()
        return response.json()


def generate_standup_summary(api):
    """Generate a summary of completed tasks"""
    tasks = api.list_tasks()

    # Get tasks completed in the last 24 hours
    yesterday = datetime.now() - timedelta(days=1)
    yesterday_timestamp = yesterday.timestamp() * 1000

    completed_tasks = [
        task
        for task in tasks
        if task["status"] == "done" and task["updatedAt"] > yesterday_timestamp
    ]

    in_progress_tasks = [task for task in tasks if task["status"] == "in_progress"]

    summary = []
    summary.append(f"# Daily Standup - {datetime.now().strftime('%A, %B %d, %Y')}\n")

    summary.append("## ✅ Completed Yesterday")
    if completed_tasks:
        for task in completed_tasks:
            assignee = task.get("assignedTo", {}).get("name", "Unassigned")
            summary.append(f"- **{task['title']}** ({assignee})")
    else:
        summary.append("- No tasks completed")

    summary.append("\n## 🔄 In Progress")
    if in_progress_tasks:
        for task in in_progress_tasks:
            assignee = task.get("assignedTo", {}).get("name", "Unassigned")
            priority_emoji = {"low": "🔵", "medium": "🟡", "high": "🔴"}
            emoji = priority_emoji.get(task["priority"], "⚪")
            summary.append(f"- {emoji} **{task['title']}** ({assignee})")
    else:
        summary.append("- No tasks in progress")

    todo_tasks = [task for task in tasks if task["status"] == "todo"]
    summary.append(f"\n## ⏳ Todo: {len(todo_tasks)} tasks")

    return "\n".join(summary)


def create_standup_task(api):
    """Create the daily standup task"""
    summary = generate_standup_summary(api)

    title = f"Daily Standup - {datetime.now().strftime('%Y-%m-%d')}"
    description = summary

    result = api.create_task(title, description, priority="high")

    print(f"✅ Created standup task: {result['taskId']}")
    print(f"\n{summary}")
    return result


def main():
    # Get configuration from environment
    convex_url = os.getenv("CONVEX_URL")
    user_id = os.getenv("DEMO_USER_ID")

    if not convex_url or not user_id:
        print("❌ Error: CONVEX_URL and DEMO_USER_ID must be set")
        print("\nExample:")
        print('  export CONVEX_URL="https://your-project.convex.cloud"')
        print('  export DEMO_USER_ID="j97..."')
        return 1

    # Initialize API client
    api = MissionControlAPI(convex_url, user_id)

    # Create standup task
    try:
        create_standup_task(api)
        print("\n🎉 Daily standup created successfully!")
        return 0
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        return 1


if __name__ == "__main__":
    exit(main())
