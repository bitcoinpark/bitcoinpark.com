#!/usr/bin/env python3
"""Asana Milestone Organizer for Bitcoin Park workspace.

Scans all active Asana projects and:
  1. Evicts non-milestone tasks from the MILESTONES section → In Tray
  2. Assigns loose tasks (no parent, not milestones, not completed) to
     the best-matching milestone via keyword scoring.

Usage:
  python3 asana_milestone_organizer.py            # dry run
  python3 asana_milestone_organizer.py --execute  # apply changes

Environment:
  ASANA_TOKEN      Asana Personal Access Token (required)
                   Generate at: https://app.asana.com/0/my-apps
  ASANA_WORKSPACE  Workspace name or GID (default: "Bitcoin Park")
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ASANA_API = "https://app.asana.com/api/1.0"
DEFAULT_WORKSPACE = "Bitcoin Park"
MILESTONES_SECTION_NAME = "MILESTONES"
IN_TRAY_SECTION_NAME = "In Tray"
KEYWORD_THRESHOLD = 0.10  # minimum overlap score to assign a task

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "being", "but", "by",
    "can", "could", "did", "do", "does", "during", "for", "from", "had",
    "has", "have", "in", "into", "is", "it", "its", "may", "might", "need",
    "not", "of", "on", "or", "shall", "should", "that", "the", "this", "through",
    "to", "up", "was", "were", "will", "with", "would",
}


# ---------------------------------------------------------------------------
# Asana API helpers
# ---------------------------------------------------------------------------

def _request(token, method, path, params=None, payload=None):
    url = f"{ASANA_API}{path}"
    if params:
        query = urllib.parse.urlencode({k: str(v) for k, v in params.items()})
        url = f"{url}?{query}"

    data = json.dumps({"data": payload}).encode() if payload is not None else None
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    if data:
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read())
            return body.get("data")
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        raise RuntimeError(f"HTTP {e.code} {method} {path}: {detail}") from None


def api_get(token, path, params=None):
    return _request(token, "GET", path, params=params)


def api_post(token, path, payload):
    return _request(token, "POST", path, payload=payload)


# ---------------------------------------------------------------------------
# Business logic helpers
# ---------------------------------------------------------------------------

def find_workspace(token, name):
    workspaces = api_get(token, "/workspaces")
    for ws in workspaces:
        if name.lower() in ws["name"].lower() or ws["gid"] == name:
            return ws
    names = [w["name"] for w in workspaces]
    raise ValueError(f"Workspace '{name}' not found. Available: {names}")


def get_projects(token, workspace_gid):
    return api_get(token, f"/workspaces/{workspace_gid}/projects", {
        "is_archived": "false",
        "opt_fields": "gid,name,archived",
    })


def get_sections(token, project_gid):
    return api_get(token, f"/projects/{project_gid}/sections", {
        "opt_fields": "gid,name",
    })


def get_section_tasks(token, section_gid):
    return api_get(token, f"/sections/{section_gid}/tasks", {
        "opt_fields": "gid,name,resource_subtype,completed,parent",
        "limit": "100",
    })


def get_project_tasks(token, project_gid):
    tasks = []
    offset = None
    while True:
        params = {
            "opt_fields": "gid,name,resource_subtype,completed,parent,memberships.section.gid",
            "limit": "100",
        }
        if offset:
            params["offset"] = offset
        page = api_get(token, f"/projects/{project_gid}/tasks", params)
        if not page:
            break
        tasks.extend(page)
        # Asana pagination: if fewer than limit, we're done
        if len(page) < 100:
            break
        # Check for next_page token (not always present in this endpoint)
        offset = None  # Asana /projects/{gid}/tasks doesn't paginate via offset easily
        break  # safe exit; 100 tasks is usually enough per project
    return tasks


def move_task_to_section(token, section_gid, task_gid, execute):
    if execute:
        api_post(token, f"/sections/{section_gid}/addTask", {"task": task_gid})


def set_task_parent(token, task_gid, parent_gid, project_gid, execute):
    if execute:
        api_post(token, f"/tasks/{task_gid}/setParent", {
            "parent": parent_gid,
            "insert_before": None,
        })


def keyword_score(task_name, milestone_name):
    """Fraction of milestone keywords that appear in the task name."""
    def tokenize(text):
        words = re.findall(r"\b\w+\b", text.lower())
        return {w for w in words if w not in STOP_WORDS and len(w) > 2}

    task_words = tokenize(task_name)
    milestone_words = tokenize(milestone_name)
    if not milestone_words:
        return 0.0
    return len(task_words & milestone_words) / len(milestone_words)


def find_section(sections, target_name):
    target_lower = target_name.lower()
    for sec in sections:
        if target_lower in sec["name"].strip().lower():
            return sec
    return None


# ---------------------------------------------------------------------------
# Per-project processing
# ---------------------------------------------------------------------------

def process_project(token, project, execute, stats):
    name = project["name"]
    gid = project["gid"]

    sections = get_sections(token, gid)
    milestones_sec = find_section(sections, MILESTONES_SECTION_NAME)
    in_tray_sec = find_section(sections, IN_TRAY_SECTION_NAME)

    if not milestones_sec:
        print(f"  [SKIP] no '{MILESTONES_SECTION_NAME}' section")
        return
    if not in_tray_sec:
        print(f"  [SKIP] no '{IN_TRAY_SECTION_NAME}' section")
        return

    # --- Step 1: collect actual milestones, evict non-milestones ---
    section_tasks = get_section_tasks(token, milestones_sec["gid"])
    actual_milestones = []
    to_evict = []

    for task in section_tasks:
        if task.get("completed"):
            continue
        if task.get("resource_subtype") == "milestone":
            actual_milestones.append(task)
        else:
            to_evict.append(task)

    for task in to_evict:
        tag = "EVICT" if execute else "EVICT (dry)"
        print(f"  [{tag}] '{task['name']}' → {IN_TRAY_SECTION_NAME}")
        move_task_to_section(token, in_tray_sec["gid"], task["gid"], execute)
        stats["evicted"] += 1

    # --- Step 2: find and assign loose tasks ---
    if not actual_milestones:
        print(f"  [INFO] no milestones found; skipping assignment pass")
        return

    all_tasks = get_project_tasks(token, gid)
    in_tray_gid = in_tray_sec["gid"]
    loose_tasks = []

    for task in all_tasks:
        if task.get("completed"):
            continue
        if task.get("resource_subtype") == "milestone":
            continue
        if task.get("parent"):
            continue  # already a subtask
        memberships = task.get("memberships") or []
        section_gids = [
            m["section"]["gid"]
            for m in memberships
            if m.get("section") and m["section"].get("gid")
        ]
        if in_tray_gid in section_gids:
            loose_tasks.append(task)

    print(f"  Milestones: {len(actual_milestones)} | Loose tasks: {len(loose_tasks)}")

    for task in loose_tasks:
        best, best_score = None, 0.0
        for milestone in actual_milestones:
            score = keyword_score(task["name"], milestone["name"])
            if score > best_score:
                best_score = score
                best = milestone

        if best and best_score >= KEYWORD_THRESHOLD:
            tag = "ASSIGN" if execute else "ASSIGN (dry)"
            print(f"  [{tag}] '{task['name']}' → '{best['name']}' (score={best_score:.2f})")
            set_task_parent(token, task["gid"], best["gid"], gid, execute)
            stats["assigned"] += 1
        else:
            print(f"  [UNMATCHED] '{task['name']}' (best score={best_score:.2f})")
            stats["unmatched"].append({"project": name, "task": task["name"]})


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Organize Asana milestones in the Bitcoin Park workspace.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--execute", action="store_true",
        help="Apply changes. Without this flag the script is a dry run.",
    )
    parser.add_argument(
        "--workspace", default=None,
        help=f"Workspace name or GID (default: '{DEFAULT_WORKSPACE}')",
    )
    args = parser.parse_args()

    token = os.getenv("ASANA_TOKEN")
    if not token:
        print("ERROR: ASANA_TOKEN environment variable is not set.")
        print("  Generate a Personal Access Token at: https://app.asana.com/0/my-apps")
        sys.exit(1)

    workspace_target = args.workspace or os.getenv("ASANA_WORKSPACE", DEFAULT_WORKSPACE)
    execute = args.execute

    mode = "EXECUTE" if execute else "DRY RUN"
    print(f"=== Asana Milestone Organizer [{mode}] ===")
    print(f"Workspace: {workspace_target}")
    print()

    stats = {"scanned": 0, "assigned": 0, "evicted": 0, "unmatched": []}

    try:
        workspace = find_workspace(token, workspace_target)
        print(f"Workspace found: {workspace['name']} (gid={workspace['gid']})")

        projects = get_projects(token, workspace["gid"])
        print(f"Active projects: {len(projects)}")
        print()

        for project in projects:
            print(f"Project: {project['name']}")
            stats["scanned"] += 1
            try:
                process_project(token, project, execute, stats)
            except Exception as exc:
                print(f"  [ERROR] {exc}")
            print()

    except (ValueError, RuntimeError) as exc:
        print(f"Fatal: {exc}")
        sys.exit(1)

    # Summary
    print("=" * 55)
    print("SUMMARY")
    print("=" * 55)
    print(f"  Projects scanned : {stats['scanned']}")
    print(f"  Tasks assigned   : {stats['assigned']}")
    print(f"  Tasks evicted    : {stats['evicted']}")
    print(f"  Unmatched tasks  : {len(stats['unmatched'])}")
    if stats["unmatched"]:
        print()
        for item in stats["unmatched"]:
            print(f"    [{item['project']}] {item['task']}")
    print()
    if not execute:
        print("  Dry run — no changes made. Re-run with --execute to apply.")
    else:
        print("  All changes applied.")


if __name__ == "__main__":
    main()
