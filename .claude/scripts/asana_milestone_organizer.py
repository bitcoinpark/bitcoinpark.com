#!/usr/bin/env python3
"""
Asana Milestone Organizer
=========================
Scans all non-archived Asana projects for loose tasks (tasks with no parent
that are not milestones) and assigns each to the most appropriate milestone
based on keyword matching against the task name.

Usage:
  python3 asana_milestone_organizer.py              # Dry-run (preview only)
  python3 asana_milestone_organizer.py --execute     # Actually assign tasks
  python3 asana_milestone_organizer.py --project ID  # Single project only
"""

import argparse
import json
import re
import sys
import time
import urllib.request
import urllib.error
import urllib.parse

ASANA_TOKEN = "2/1210464368087161/1213832270076990:d280cf9fdbe813c6d2c09a509a841d9a"
WORKSPACE_GID = "1204176700167886"
BASE_URL = "https://app.asana.com/api/1.0"

HEADERS = {
    "Authorization": f"Bearer {ASANA_TOKEN}",
    "Content-Type": "application/json",
}

# ---------------------------------------------------------------------------
# Keyword rules — maps milestone category keywords to task-matching keywords.
# The milestone category is extracted by stripping the [CODE] prefix, e.g.
# "[TEMS26] Goals - Sponsors & Sales" → "Goals - Sponsors & Sales".
#
# Each rule: (milestone_category_pattern, [task_keywords], priority_weight)
# Higher weight = stronger match. First match at highest weight wins.
# ---------------------------------------------------------------------------
MILESTONE_RULES = [
    # Goals / Sponsors / Sales / Tickets / Sponsorship Revenue
    (
        r"goals.*sponsor|sponsor.*sales|ticket.*sales|sales.*target|sponsorship.*revenue|revenue.*target",
        [
            "sponsor", "sales", "ticket", "revenue", "pricing", "promo",
            "discount", "payment", "zaprite", "member code", "member ",
            "purchase", "code ", "comp ", "vip", "price", "tier",
            "registration link", "coupon", "rebate", "chargeback",
        ],
        10,
    ),
    # Brief
    (
        r"\bbrief\b",
        [
            "brief", "kickoff", "overview", "planning doc", "project plan",
            "summit brief",
        ],
        10,
    ),
    # Master Agenda / Speakers / Run of Show / Confirm Teams
    (
        r"master.*agenda|agenda.*speaker|speaker|run.*show|confirm.*team|developer.*activist",
        [
            "agenda", "speaker", "panel", "presentation", "moderator",
            "talk", "keynote", "fireside", "one-sheeter", "one sheeter",
            "ercot", "invite", "invitation", "mc ", "emcee",
            "session", "workshop", "lightning", "stage", "team",
            "developer", "activist", "participant", "judge",
        ],
        10,
    ),
    # Spotlight / Interview
    (
        r"spotlight",
        [
            "spotlight", "interview", "laboratory", "feature", "highlight",
            "profile", "mini-doc",
        ],
        10,
    ),
    # Budget & Vendor Contracts
    (
        r"budget|vendor.*contract|contract.*closed",
        [
            "budget", "vendor", "contract", "invoice", "expense", "cost",
            "catering", "av ", "a/v", "audio", "venue", "insurance",
            "liability", "tracker", "accounting", "receipt",
            "deposit", "payment plan", "food", "drinks", "bar ",
            "security", "parking", "rental", "equipment",
        ],
        10,
    ),
    # Venue & Logistics (PFH variant — similar to Budget/Vendor + Confirmations)
    (
        r"venue.*logistics|logistics.*locked",
        [
            "venue", "logistics", "space", "room", "layout", "seating",
            "capacity", "load-in", "load in", "setup", "teardown",
            "rental", "parking", "security", "insurance",
        ],
        10,
    ),
    # Volunteers
    (
        r"volunteer",
        [
            "volunteer", "staff", "helper", "setup crew", "breakdown",
            "registration desk", "check-in", "checkin", "door ",
            "greeter", "runner",
        ],
        10,
    ),
    # BWP (Bitcoin Week Prep / Event Prep) / Welcome Reception
    (
        r"\bbwp\b|bitcoin week|event prep|welcome.*reception|reception.*final",
        [
            "bwp", "bitcoin week", "bitcoin takeover", "meetup",
            "side event", "shout-out", "shoutout", "afterparty",
            "after party", "happy hour", "pre-event", "post-event",
            "social", "networking event", "reception", "welcome",
            "connect", "local.*meetup",
        ],
        10,
    ),
    # Emails / Marketing & Comms
    (
        r"\bemail|marketing.*comms|comms.*cadence",
        [
            "email", "countdown", "days to go", "newsletter", "drip",
            "announcement", "blast", "mailchimp", "beehiiv", "subject line",
            "send date", "e-mail", "marketing", "comms", "press release",
            "distribution", "outreach", "media",
        ],
        10,
    ),
    # Graphics Final / Brand Assets
    (
        r"graphic|brand.*asset|asset.*delivered",
        [
            "design", "graphic", "poster", "banner", "logo", "creative",
            "social media", "asset", "image", "flyer", "branding",
            "stitch", "canva", "mockup", "visual", "thumbnail",
            "brand", "signage",
        ],
        10,
    ),
    # Accommodations (hackathon-specific)
    (
        r"accomod",
        [
            "airbnb", "hotel", "room", "accommodation", "lodging",
            "check in", "check out", "stay", "booking", "chloe",
            "quote", "rooms",
        ],
        10,
    ),
    # Final Confirmations Checklist
    (
        r"final.*confirm|confirm.*checklist|checklist",
        [
            "confirm", "checklist", "final", "airbnb", "travel",
            "accommodation", "logistics", "day-of", "day of",
            "load-in", "load in", "run of show", "schedule",
            "itinerary", "flight", "hotel", "lodging", "uber",
            "transportation", "parking", "badge", "wristband",
            "swag", "merch", "print", "signage", "name tag",
        ],
        10,
    ),
]

# Catch-all pattern for matching invitation-section tasks to speaker/agenda
# milestones — covers all variant milestone names.
SPEAKER_AGENDA_PATTERN = (
    r"master.*agenda|agenda.*speaker|speaker|run.*show|"
    r"confirm.*team|developer.*activist"
)

# Section-based hints: maps section name substrings to milestone category
# patterns. Used both as a score boost (+50) when the task already has a
# keyword match, and as a fallback when there is no keyword match at all.
# Each value is a list of milestone patterns tried in order (first match wins).
SECTION_HINTS = {
    "sponsor": [
        r"goals.*sponsor|sponsor.*sales|ticket.*sales|sales.*target|sponsorship.*revenue|revenue.*target",
        r"budget|vendor.*contract|contract.*closed",  # fallback: budget
    ],
    "invitation": [SPEAKER_AGENDA_PATTERN],
    "registration": [SPEAKER_AGENDA_PATTERN],
    "poster": [r"graphic|brand.*asset"],
    "in-tray": None,
    "done": None,
}


def api_get(path, params=None):
    """GET request to Asana API with pagination support."""
    url = f"{BASE_URL}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ✗ API error {e.code}: {body}", file=sys.stderr)
        return {"data": []}


def api_get_all(path, params=None):
    """GET with automatic pagination."""
    results = []
    params = dict(params or {})
    params["limit"] = 100
    while True:
        data = api_get(path, params)
        results.extend(data.get("data", []))
        np = data.get("next_page")
        if np and np.get("offset"):
            params["offset"] = np["offset"]
        else:
            break
    return results


def api_post(path, payload):
    """POST request to Asana API."""
    url = f"{BASE_URL}{path}"
    body = json.dumps({"data": payload}).encode()
    req = urllib.request.Request(url, data=body, headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ✗ API error {e.code}: {body}", file=sys.stderr)
        return None


def strip_summit_prefix(name):
    """Remove [CODE] or CODE - prefix from milestone name → category string."""
    # Handle [CODE] prefix
    result = re.sub(r"^\[.*?\]\s*", "", name).strip()
    # Handle CODE - prefix (e.g. "AI26M - Budget...")
    result = re.sub(r"^[A-Z]+\d+[A-Z]?\s*[-–]\s*", "", result).strip()
    return result


def match_task_to_milestone(task_name, milestones, section_name=None):
    """
    Given a task name and list of milestones, return the best milestone GID
    and name, or (None, None) if no match.

    Each milestone is a dict: {gid, name, category} where category is the
    name with the [CODE] prefix stripped.
    """
    task_lower = task_name.lower()
    sec_lower = (section_name or "").lower()

    # Determine which milestone category the section hints at (if any)
    section_boosted_patterns = []
    for sec_key, ms_patterns in SECTION_HINTS.items():
        if sec_key in sec_lower and ms_patterns:
            section_boosted_patterns = ms_patterns if isinstance(ms_patterns, list) else [ms_patterns]
            break
    section_boosted_pattern = section_boosted_patterns[0] if section_boosted_patterns else None

    best_milestone = None
    best_score = 0

    for ms in milestones:
        cat = ms["category"].lower()
        for pattern, keywords, weight in MILESTONE_RULES:
            if not re.search(pattern, cat):
                continue
            # Score: number of matching keywords × weight
            score = sum(1 for kw in keywords if kw in task_lower) * weight
            # Boost score if the task's section aligns with this milestone
            if score > 0 and section_boosted_pattern and re.search(section_boosted_pattern, cat):
                score += 50
            if score > best_score:
                best_score = score
                best_milestone = ms

    # Section-based candidate: always give the section-hinted milestone a
    # baseline score of 15, so it wins over single weak keyword matches
    # (score 10) from an unrelated milestone, but loses to strong matches.
    # Tries each pattern in order (primary, then fallback).
    if not best_milestone or best_score <= 5:
        for sp in section_boosted_patterns:
            matched = False
            for ms in milestones:
                cat = ms["category"].lower()
                if re.search(sp, cat):
                    section_score = 15
                    if section_score > best_score:
                        best_milestone = ms
                        best_score = section_score
                    matched = True
                    break
            if matched:
                break

    # Special heuristic: if task name looks like a person's name with a
    # summit prefix (e.g. "TEMS: ZACK VOELL"), likely a speaker/participant invitation
    if not best_milestone:
        # Pattern: "CODE: PERSON NAME" or "INVITE: name" or "INVITE PFH26: ..."
        if re.match(r"^[A-Z]+\d*:\s+[A-Z]", task_name) or \
           re.match(r"^INVITE\s", task_name, re.IGNORECASE) or \
           "invite" in task_lower:
            for ms in milestones:
                cat = ms["category"].lower()
                if re.search(SPEAKER_AGENDA_PATTERN, cat):
                    best_milestone = ms
                    best_score = 5
                    break

    # Catch-all: if still no match, assign to Final Confirmations Checklist
    # (or the closest equivalent like "checklist", "confirmations", "run of show").
    if not best_milestone:
        catchall_patterns = [
            r"final.*confirm|confirm.*checklist|checklist",
            r"run.*show",
        ]
        for cp in catchall_patterns:
            for ms in milestones:
                cat = ms["category"].lower()
                if re.search(cp, cat):
                    best_milestone = ms
                    best_score = 1  # catch-all
                    break
            if best_milestone:
                break

    return best_milestone, best_score


def set_task_parent(task_gid, parent_gid):
    """Set a task's parent (make it a subtask of the milestone)."""
    return api_post(f"/tasks/{task_gid}/setParent", {"parent": parent_gid})


def move_task_to_section(task_gid, project_gid, section_gid):
    """Move a task to a different section within a project."""
    return api_post(f"/sections/{section_gid}/addTask", {"task": task_gid})


def process_project(project_gid, project_name, dry_run=True):
    """Process a single project: find milestones, find loose tasks, assign."""
    print(f"\n{'='*70}")
    print(f"PROJECT: {project_name} ({project_gid})")
    print(f"{'='*70}")

    # 1. Get sections to find MILESTONES section
    sections = api_get_all(f"/projects/{project_gid}/sections")
    milestone_section = None
    for s in sections:
        if s["name"].upper().strip() == "MILESTONES":
            milestone_section = s
            break

    if not milestone_section:
        print("  ⏭  No MILESTONES section found — skipping")
        return {"project": project_name, "loose": 0, "assigned": 0, "unmatched": 0, "evicted": 0}

    # 1b. Find the "In Tray" section (fallback: first section that isn't MILESTONES)
    intray_section = None
    first_other_section = None
    for s in sections:
        sname = s["name"].upper().strip()
        if "IN TRAY" in sname or "IN-TRAY" in sname or "INTRAY" in sname:
            intray_section = s
            break
        if sname != "MILESTONES" and first_other_section is None:
            first_other_section = s
    intray_section = intray_section or first_other_section

    # 2. Get all tasks in the project
    tasks = api_get_all(
        f"/projects/{project_gid}/tasks",
        {
            "opt_fields": "name,resource_subtype,memberships.section.name,parent.name,completed",
        },
    )

    # 3. Separate milestones, loose tasks, and non-milestone tasks in MILESTONES section
    milestones = []
    loose_tasks = []
    misplaced_tasks = []  # non-milestone tasks sitting in MILESTONES section

    for t in tasks:
        subtype = t.get("resource_subtype", "")
        parent = t.get("parent")
        section_name = ""
        memberships = t.get("memberships", [])
        if memberships:
            section_name = memberships[0].get("section", {}).get("name", "")

        if subtype == "milestone":
            milestones.append({
                "gid": t["gid"],
                "name": t["name"],
                "category": strip_summit_prefix(t["name"]),
            })
        elif parent is None and not t.get("completed", False):
            loose_tasks.append({
                "gid": t["gid"],
                "name": t["name"],
                "section": section_name,
            })
            # Track non-milestone tasks that are in the MILESTONES section
            if section_name.upper().strip() == "MILESTONES":
                misplaced_tasks.append({
                    "gid": t["gid"],
                    "name": t["name"],
                })

    print(f"  Milestones: {len(milestones)}")
    for ms in milestones:
        print(f"    • {ms['name']}")

    print(f"  Loose tasks: {len(loose_tasks)}")

    # 3b. Evict non-milestone tasks from MILESTONES section → In Tray
    evicted = 0
    if misplaced_tasks and intray_section:
        print(f"\n  🧹 {len(misplaced_tasks)} non-milestone task(s) in MILESTONES section:")
        for task in misplaced_tasks:
            action = "→"
            if not dry_run:
                result = move_task_to_section(task["gid"], project_gid, intray_section["gid"])
                if result:
                    action = "✓"
                    time.sleep(0.15)
                else:
                    action = "✗"
            print(f"    {action} \"{task['name']}\" → {intray_section['name']}")
            evicted += 1
    elif misplaced_tasks:
        print(f"\n  ⚠  {len(misplaced_tasks)} non-milestone task(s) in MILESTONES but no In Tray section to move them to")

    if not milestones:
        print("  ⏭  No milestones to assign to — skipping")
        return {"project": project_name, "loose": len(loose_tasks), "assigned": 0, "unmatched": len(loose_tasks), "evicted": evicted}

    # 4. Match each loose task to a milestone
    assigned = 0
    unmatched = 0
    unmatched_tasks = []

    for task in loose_tasks:
        ms, score = match_task_to_milestone(task["name"], milestones, task["section"])
        if ms:
            action = "→"
            if not dry_run:
                result = set_task_parent(task["gid"], ms["gid"])
                if result:
                    action = "✓"
                    time.sleep(0.15)  # Rate limit buffer
                else:
                    action = "✗"
            print(f"  {action} [{task['section']:20s}] \"{task['name']}\"")
            print(f"       ↳ {ms['name']} (score: {score})")
            assigned += 1
        else:
            unmatched += 1
            unmatched_tasks.append(task)

    if unmatched_tasks:
        print(f"\n  ⚠  {unmatched} task(s) could not be matched:")
        for task in unmatched_tasks:
            print(f"    ? [{task['section']:20s}] \"{task['name']}\"")

    return {
        "project": project_name,
        "loose": len(loose_tasks),
        "assigned": assigned,
        "unmatched": unmatched,
        "evicted": evicted,
    }


def main():
    parser = argparse.ArgumentParser(description="Assign loose Asana tasks to milestones")
    parser.add_argument("--execute", action="store_true", help="Actually assign tasks (default: dry-run)")
    parser.add_argument("--project", type=str, help="Process a single project GID only")
    args = parser.parse_args()

    dry_run = not args.execute

    if dry_run:
        print("╔══════════════════════════════════════════════════════════╗")
        print("║  DRY RUN — no changes will be made. Use --execute to   ║")
        print("║  actually assign tasks to milestones.                   ║")
        print("╚══════════════════════════════════════════════════════════╝")
    else:
        print("╔══════════════════════════════════════════════════════════╗")
        print("║  EXECUTE MODE — tasks will be assigned to milestones!  ║")
        print("╚══════════════════════════════════════════════════════════╝")

    # Get projects
    if args.project:
        proj_data = api_get(f"/projects/{args.project}", {"opt_fields": "name,archived"})
        projects = [proj_data.get("data", {})]
    else:
        projects = api_get_all(
            "/projects",
            {"workspace": WORKSPACE_GID, "opt_fields": "name,archived"},
        )

    # Filter to non-archived
    projects = [p for p in projects if not p.get("archived", False)]
    print(f"\nFound {len(projects)} active project(s) to scan.\n")

    # Process each project
    results = []
    for proj in projects:
        result = process_project(proj["gid"], proj["name"], dry_run=dry_run)
        results.append(result)

    # Summary
    print(f"\n{'='*70}")
    print("SUMMARY")
    print(f"{'='*70}")
    total_loose = sum(r["loose"] for r in results)
    total_assigned = sum(r["assigned"] for r in results)
    total_unmatched = sum(r["unmatched"] for r in results)
    total_evicted = sum(r["evicted"] for r in results)
    projects_with_milestones = sum(1 for r in results if r["loose"] > 0 or r["assigned"] > 0)

    print(f"  Projects scanned:    {len(results)}")
    print(f"  Projects w/ milestones: {projects_with_milestones}")
    print(f"  Total loose tasks:   {total_loose}")
    print(f"  Assigned:            {total_assigned}")
    print(f"  Unmatched:           {total_unmatched}")
    print(f"  Evicted from MILESTONES: {total_evicted}")

    if dry_run and total_assigned > 0:
        print(f"\n  Run with --execute to apply these {total_assigned} assignment(s).")


if __name__ == "__main__":
    main()
