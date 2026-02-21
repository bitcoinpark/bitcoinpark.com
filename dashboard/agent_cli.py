#!/usr/bin/env python3
"""
Mission Control Agent CLI

Full-featured CLI for AI agents to interact with Mission Control.
Supports projects, tasks, comments, and full CRUD operations.
"""

import requests
import sys
import os
from datetime import datetime

# Get Convex URL from environment or use default
BASE_URL = os.getenv("CONVEX_URL", "https://your-deployment.convex.cloud")

# API Key for authentication (required for secure access)
API_KEY = os.getenv("API_KEY", "")

# For POC: Hardcoded demo user ID (get from Convex dashboard after setup)
DEMO_USER_ID = os.getenv("DEMO_USER_ID", "")

def get_headers():
    """Get headers with API key if available."""
    headers = {"Content-Type": "application/json"}

    if API_KEY:
        headers["Authorization"] = f"Bearer {API_KEY}"

    return headers

# ============ PROJECTS ============

def list_projects():
    """List all projects."""
    response = requests.get(f"{BASE_URL}/api/projects", headers=get_headers())

    if response.status_code != 200:
        print(f"❌ Error: {response.text}")
        return

    projects = response.json()

    if not projects:
        print("📁 No projects found")
        return

    print(f"📁 Found {len(projects)} projects:\n")

    for project in projects:
        print(f"📂 {project['name']} ({project['taskCount']} tasks)")
        print(f"   {project['description']}")
        print(f"   ID: {project['_id']}")
        print(f"   Color: {project['color']}")
        print()


def create_project(name, description, color="#3B82F6"):
    """Create a new project."""
    if not DEMO_USER_ID:
        print("❌ Error: DEMO_USER_ID not set. Please set the environment variable.")
        return

    payload = {
        "name": name,
        "description": description,
        "color": color,
        "createdBy": DEMO_USER_ID,
    }

    response = requests.post(f"{BASE_URL}/api/projects", json=payload, headers=get_headers())

    if response.status_code == 201:
        result = response.json()
        print(f"✅ Project created successfully!")
        print(f"   Project ID: {result['projectId']}")
        print(f"   Name: {name}")
    else:
        print(f"❌ Error: {response.text}")


def get_project(project_id):
    """Get project details."""
    response = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers=get_headers())

    if response.status_code == 404:
        print(f"❌ Project not found")
        return
    elif response.status_code != 200:
        print(f"❌ Error: {response.text}")
        return

    project = response.json()
    print(f"\n📂 {project['name']}")
    print(f"{'=' * 60}")
    print(f"Description: {project['description']}")
    print(f"Color: {project['color']}")
    print(f"Created by: {project['createdBy']['name']}")
    print()


# ============ TASKS ============

def list_tasks(project_id=None):
    """List all tasks, optionally filtered by project."""
    url = f"{BASE_URL}/api/tasks"
    if project_id:
        url += f"?projectId={project_id}"

    response = requests.get(url, headers=get_headers())

    if response.status_code != 200:
        print(f"❌ Error: {response.text}")
        return

    tasks = response.json()

    if not tasks:
        print("📋 No tasks found")
        return

    print(f"📋 Found {len(tasks)} tasks:\n")

    status_emoji = {"todo": "⏳", "in_progress": "🔄", "done": "✅"}

    # Group by project if not filtering
    if not project_id:
        by_project = {}
        for task in tasks:
            proj_name = task.get("project", {}).get("name", "No Project") if task.get("project") else "No Project"
            if proj_name not in by_project:
                by_project[proj_name] = []
            by_project[proj_name].append(task)

        for proj_name, proj_tasks in by_project.items():
            print(f"\n📁 {proj_name} ({len(proj_tasks)} tasks)")
            print("─" * 60)
            for task in proj_tasks:
                emoji = status_emoji.get(task["status"], "📌")
                priority = task["priority"].upper()
                assignee = ""

                if task.get("assignedTo"):
                    icon = "🤖" if task["assignedTo"]["type"] == "agent" else "👤"
                    assignee = f" | {icon} {task['assignedTo']['name']}"

                print(f"  {emoji} [{priority}] {task['title']}")
                print(f"     Status: {task['status']}{assignee}")
                print(f"     ID: {task['_id']}")
                print()
    else:
        for task in tasks:
            emoji = status_emoji.get(task["status"], "📌")
            priority = task["priority"].upper()
            assignee = ""

            if task.get("assignedTo"):
                icon = "🤖" if task["assignedTo"]["type"] == "agent" else "👤"
                assignee = f" | {icon} {task['assignedTo']['name']}"

            print(f"{emoji} [{priority}] {task['title']}")
            print(f"   Status: {task['status']}{assignee}")
            print(f"   ID: {task['_id']}")
            print(f"   {task['description'][:80]}...")
            print()


def create_task(title, description, priority="medium", project_id=None, assignee=None):
    """Create a new task."""
    if not DEMO_USER_ID:
        print("❌ Error: DEMO_USER_ID not set. Please set the environment variable.")
        return

    payload = {
        "title": title,
        "description": description,
        "priority": priority,
        "createdBy": DEMO_USER_ID,
    }

    if project_id:
        payload["projectId"] = project_id

    if assignee:
        payload["assignedTo"] = assignee

    response = requests.post(f"{BASE_URL}/api/tasks", json=payload, headers=get_headers())

    if response.status_code == 201:
        result = response.json()
        print(f"✅ Task created successfully!")
        print(f"   Task ID: {result['taskId']}")
        print(f"   Title: {title}")
        if project_id:
            print(f"   Project: {project_id}")
    else:
        print(f"❌ Error: {response.text}")


def update_task_status(task_id, status):
    """Update a task's status."""
    if status not in ["todo", "in_progress", "done"]:
        print(f"❌ Invalid status. Use: todo, in_progress, or done")
        return

    response = requests.patch(f"{BASE_URL}/api/tasks/{task_id}", json={"status": status}, headers=get_headers())

    if response.ok:
        print(f"✅ Task updated to '{status}'")
    else:
        print(f"❌ Error: {response.text}")


def move_task_to_project(task_id, project_id):
    """Move a task to a different project."""
    response = requests.patch(f"{BASE_URL}/api/tasks/{task_id}", json={"projectId": project_id}, headers=get_headers())

    if response.ok:
        print(f"✅ Task moved to project")
    else:
        print(f"❌ Error: {response.text}")


def add_comment(task_id, content):
    """Add a comment to a task."""
    if not DEMO_USER_ID:
        print("❌ Error: DEMO_USER_ID not set. Please set the environment variable.")
        return

    payload = {
        "content": content,
        "authorId": DEMO_USER_ID,
    }

    response = requests.post(f"{BASE_URL}/api/tasks/{task_id}/comments", json=payload, headers=get_headers())

    if response.status_code == 201:
        print(f"✅ Comment added successfully!")
    else:
        print(f"❌ Error: {response.text}")


def get_task(task_id):
    """Get detailed information about a task."""
    response = requests.get(f"{BASE_URL}/api/tasks/{task_id}", headers=get_headers())

    if response.status_code == 404:
        print(f"❌ Task not found")
        return
    elif response.status_code != 200:
        print(f"❌ Error: {response.text}")
        return

    task = response.json()

    print(f"\n📌 {task['title']}")
    print(f"{'=' * 60}")
    print(f"Status: {task['status']}")
    print(f"Priority: {task['priority']}")

    if task.get('project'):
        print(f"Project: {task['project']['name']}")

    print(f"\nDescription:\n{task['description']}")

    if task.get('assignedTo'):
        icon = "🤖" if task["assignedTo"]["type"] == "agent" else "👤"
        print(f"\nAssigned to: {icon} {task['assignedTo']['name']}")

    if task.get('comments'):
        print(f"\n💬 Comments ({len(task['comments'])}):")
        for comment in task['comments']:
            author_icon = "🤖" if comment["author"]["type"] == "agent" else "👤"
            timestamp = datetime.fromtimestamp(comment["createdAt"] / 1000).strftime("%Y-%m-%d %H:%M")
            print(f"\n  {author_icon} {comment['author']['name']} - {timestamp}")
            print(f"  {comment['content']}")
    print()


def print_help():
    """Print usage information."""
    print("""
Mission Control Agent CLI

Usage:
  python agent_cli.py <command> [arguments]

Project Commands:
  projects list                              List all projects
  projects create <name> <description>       Create a new project
  projects get <project_id>                  Get project details

Task Commands:
  tasks list [project_id]                    List all tasks (or filter by project)
  tasks create <title> <description>         Create a new task
      [--project <id>]                       Optional: assign to project
      [--priority low|medium|high]           Optional: set priority (default: medium)
  tasks get <task_id>                        Get task details
  tasks update <task_id> <status>            Update task status (todo/in_progress/done)
  tasks move <task_id> <project_id>          Move task to a project
  tasks comment <task_id> <message>          Add a comment to a task

Environment Variables:
  CONVEX_URL      Your Convex deployment URL
  API_KEY         Your API key for authentication (required for secure access)
  DEMO_USER_ID    User ID for creating tasks/comments (get from Convex dashboard)

Examples:
  # Projects
  python agent_cli.py projects list
  python agent_cli.py projects create "Website Redesign" "Modernize the company website"

  # Tasks
  python agent_cli.py tasks list
  python agent_cli.py tasks list j97abc123
  python agent_cli.py tasks create "Fix bug" "The login button is broken" --project j97abc
  python agent_cli.py tasks update k89xyz456 in_progress
  python agent_cli.py tasks comment k89xyz456 "Working on this now"
""")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_help()
        sys.exit(1)

    category = sys.argv[1]

    if category == "projects":
        if len(sys.argv) < 3:
            print("❌ Usage: projects <list|create|get>")
            sys.exit(1)

        command = sys.argv[2]

        if command == "list":
            list_projects()
        elif command == "create":
            if len(sys.argv) < 5:
                print("❌ Usage: projects create <name> <description>")
                sys.exit(1)
            create_project(sys.argv[3], sys.argv[4])
        elif command == "get":
            if len(sys.argv) < 4:
                print("❌ Usage: projects get <project_id>")
                sys.exit(1)
            get_project(sys.argv[3])
        else:
            print(f"❌ Unknown project command: {command}")
            print_help()

    elif category == "tasks":
        if len(sys.argv) < 3:
            print("❌ Usage: tasks <list|create|get|update|move|comment>")
            sys.exit(1)

        command = sys.argv[2]

        if command == "list":
            project_id = sys.argv[3] if len(sys.argv) > 3 else None
            list_tasks(project_id)
        elif command == "create":
            if len(sys.argv) < 5:
                print("❌ Usage: tasks create <title> <description> [--project <id>] [--priority low|medium|high]")
                sys.exit(1)

            title = sys.argv[3]
            description = sys.argv[4]

            # Parse optional arguments
            project_id = None
            priority = "medium"

            i = 5
            while i < len(sys.argv):
                if sys.argv[i] == "--project" and i + 1 < len(sys.argv):
                    project_id = sys.argv[i + 1]
                    i += 2
                elif sys.argv[i] == "--priority" and i + 1 < len(sys.argv):
                    priority = sys.argv[i + 1]
                    i += 2
                else:
                    i += 1

            create_task(title, description, priority, project_id)
        elif command == "get":
            if len(sys.argv) < 4:
                print("❌ Usage: tasks get <task_id>")
                sys.exit(1)
            get_task(sys.argv[3])
        elif command == "update":
            if len(sys.argv) < 5:
                print("❌ Usage: tasks update <task_id> <status>")
                sys.exit(1)
            update_task_status(sys.argv[3], sys.argv[4])
        elif command == "move":
            if len(sys.argv) < 5:
                print("❌ Usage: tasks move <task_id> <project_id>")
                sys.exit(1)
            move_task_to_project(sys.argv[3], sys.argv[4])
        elif command == "comment":
            if len(sys.argv) < 5:
                print("❌ Usage: tasks comment <task_id> <message>")
                sys.exit(1)
            add_comment(sys.argv[3], " ".join(sys.argv[4:]))
        else:
            print(f"❌ Unknown task command: {command}")
            print_help()

    elif category == "help" or category == "--help" or category == "-h":
        print_help()
    else:
        print(f"❌ Unknown category: {category}")
        print_help()
        sys.exit(1)
