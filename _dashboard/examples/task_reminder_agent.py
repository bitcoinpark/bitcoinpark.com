#!/usr/bin/env python3
"""
Task Reminder Agent

This agent checks for overdue tasks and high-priority tasks that haven't
been started, then adds reminder comments.

Usage:
  python task_reminder_agent.py

Environment Variables:
  CONVEX_URL      - Your Convex deployment URL
  DEMO_USER_ID    - Bot user ID
"""

import requests
import os
from datetime import datetime


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

    def add_comment(self, task_id, content):
        """Add a comment to a task"""
        payload = {"content": content, "authorId": self.user_id}
        response = requests.post(
            f"{self.base_url}/api/tasks/{task_id}/comments", json=payload
        )
        response.raise_for_status()
        return response.json()

    def update_task(self, task_id, **updates):
        """Update a task"""
        response = requests.patch(f"{self.base_url}/api/tasks/{task_id}", json=updates)
        response.raise_for_status()
        return response.json()


def check_overdue_tasks(api):
    """Find and remind about overdue tasks"""
    tasks = api.list_tasks()
    now = datetime.now().timestamp() * 1000

    overdue_count = 0

    for task in tasks:
        # Skip completed tasks
        if task["status"] == "done":
            continue

        # Check if task has a due date and is overdue
        if task.get("dueDate") and task["dueDate"] < now:
            assignee_name = task.get("assignedTo", {}).get("name", "Unassigned")
            days_overdue = (now - task["dueDate"]) / (1000 * 60 * 60 * 24)

            message = f"⚠️ Reminder: This task is overdue by {int(days_overdue)} day(s). Current status: {task['status']}"

            if task.get("assignedTo"):
                message += f"\n\n@{assignee_name} - Please update the status or due date."

            api.add_comment(task["_id"], message)
            print(f"📌 Reminded about overdue task: {task['title']}")
            overdue_count += 1

    return overdue_count


def check_high_priority_todo(api):
    """Remind about high-priority tasks that haven't been started"""
    tasks = api.list_tasks()
    reminder_count = 0

    for task in tasks:
        # Look for high-priority tasks still in "todo" status
        if task["priority"] == "high" and task["status"] == "todo":
            assignee_name = task.get("assignedTo", {}).get("name", "No one")

            message = f"🔴 High Priority Reminder: This task is marked as high priority but hasn't been started yet.\n\nAssigned to: {assignee_name}"

            if not task.get("assignedTo"):
                message += "\n\n💡 Tip: Consider assigning this task to someone."

            api.add_comment(task["_id"], message)
            print(f"🔴 Reminded about high-priority task: {task['title']}")
            reminder_count += 1

    return reminder_count


def check_stale_in_progress(api):
    """Find tasks stuck in 'in_progress' for too long"""
    tasks = api.list_tasks()
    now = datetime.now().timestamp() * 1000
    stale_threshold = 7 * 24 * 60 * 60 * 1000  # 7 days in milliseconds

    stale_count = 0

    for task in tasks:
        if task["status"] == "in_progress":
            time_in_progress = now - task["updatedAt"]

            if time_in_progress > stale_threshold:
                days_stale = time_in_progress / (1000 * 60 * 60 * 24)
                assignee_name = task.get("assignedTo", {}).get("name", "Unassigned")

                message = f"⏰ Status Check: This task has been in progress for {int(days_stale)} days without updates.\n\n"
                if task.get("assignedTo"):
                    message += f"@{assignee_name} - Is this task still being worked on?"
                else:
                    message += "This task is unassigned. Should it be assigned or moved back to todo?"

                api.add_comment(task["_id"], message)
                print(f"⏰ Reminded about stale task: {task['title']}")
                stale_count += 1

    return stale_count


def main():
    # Get configuration from environment
    convex_url = os.getenv("CONVEX_URL")
    user_id = os.getenv("DEMO_USER_ID")

    if not convex_url or not user_id:
        print("❌ Error: CONVEX_URL and DEMO_USER_ID must be set")
        return 1

    # Initialize API client
    api = MissionControlAPI(convex_url, user_id)

    print("🤖 Task Reminder Agent Starting...\n")

    try:
        # Check for various types of tasks that need attention
        overdue = check_overdue_tasks(api)
        high_priority = check_high_priority_todo(api)
        stale = check_stale_in_progress(api)

        # Summary
        print("\n" + "=" * 50)
        print("📊 Summary:")
        print(f"  Overdue tasks: {overdue}")
        print(f"  High-priority todos: {high_priority}")
        print(f"  Stale in-progress: {stale}")
        print(f"  Total reminders sent: {overdue + high_priority + stale}")
        print("=" * 50)

        if overdue + high_priority + stale == 0:
            print("\n✅ All tasks are on track! No reminders needed.")
        else:
            print("\n📬 Reminder comments have been posted to tasks.")

        return 0

    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        return 1


if __name__ == "__main__":
    exit(main())
