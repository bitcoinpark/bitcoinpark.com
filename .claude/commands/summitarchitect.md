---
description: "Create or reorganize the full project skeleton for any Bitcoin Park summit — Google Drive folders/docs/sheets and Asana project with milestones, sections, and subtasks. Handles both new summit creation and auditing/fixing existing summits. Populates docs and sheets with formatted skeleton templates."
---

# Summit Architect — Bitcoin Park Summit Project Skeleton

This skill creates or reorganizes the complete project infrastructure for any Bitcoin Park summit in both Google Drive and Asana. It ensures every summit follows the same standardized structure.

## When to Use

Trigger on `/summitarchitect` or when the user asks to:
- Create a new summit project (e.g., "set up TEMS27", "create CTS27 project")
- Reorganize/audit an existing summit (e.g., "organize CTS26", "clean up IF26")
- Check if a summit follows the standard structure

## Required Inputs

Ask the user if not provided:
1. **Summit code + year** — e.g., `TEMS27`, `CTS26`, `IF27`, `NEMS27`, `GB27`, `BT27`, `GFTS27`
2. **Mode** — `new` (create from scratch) or `organize` (audit and fix existing)
3. **Event dates** (optional for skeleton) — e.g., "May 20-21, 2027"

## Summit Type Registry

Use this lookup to resolve codes to full names, Asana project names, and Drive parent folder IDs:

| Code | Full Name | Asana Project Name Pattern | Drive Parent Folder ID (summit type) |
|------|-----------|---------------------------|--------------------------------------|
| IF | Imagine IF | `[IF{YY}] IMAGINE IF` | `1eXC2Zz933q3LJ-z992r3MSJElnMVBIno` ("3. IMAGINE IF") |
| TEMS | Texas Energy & Mining Summit | `[TEMS{YY}] TEXAS ENERGY & MINING SUMMIT` | `1PvJsYEDNMfzo6NAnB5nYKNeDToWHui2h` ("[TEMS] Texas Energy and Mining Summit") |
| CTS | Bitcoin Custody & Treasury Summit | `[CTS{YY}] Bitcoin Custody & Treasury Summit` | `1rYc0Mdu3ZGnNAvs4VB74ygKY4s0PK4L0` ("[CTS] Bitcoin Custody & Treasury Summit") |
| NEMS | Nashville Energy & Mining Summit | `[NEMS{YY}] Nashville Energy & Mining Summit` | `1lKma4acIwosjj2fTHSa3tAT4jkTlFV6Y` ("[NEMS] Nashville Energy and Mining Summit") |
| GB | Grassroots Bitcoin | `[GB{YY}] GRASSROOTS BITCOIN {YYYY}` | `1scZCZBtLDg2qjmobdMlCSAPMv7iOMLSm` ("[GB] Grassroots Bitcoin") |
| GBS | Global Bitcoin Summit | `[GBS{YY}] Global Bitcoin Summit` | `1scZCZBtLDg2qjmobdMlCSAPMv7iOMLSm` ("[GB] Grassroots Bitcoin") |
| BT | Bitcoin Takeover | `[BT{YY}] BITCOIN TAKEOVER{YY}` | `1BE5OJDcDOEdt30ppZPcwTFpKLCXEog89` ("[BT] BITCOIN TAKEOVER SXSW - POWER OF PAYMENTS") |
| GFTS | Global Freedom Tech Summit | `[GFTS{YY}] Global Freedom Tech Summit` | `1vEG7f5NLs7GM6hziDo6phjZjw3O_qzMZ` ("[GFTS] GLOBAL FREEDOM TECH SUMMIT") |

**Asana workspace ID:** `1204176700167886`
**Asana team ID:** `1209092537090911`

For IF summits, the Drive folder name is: `[IF{YY}] IMAGINE IF [DATES]` (e.g., `[IF26] IMAGINE IF [OCT 5 & 6]`).
For all other summits, the Drive folder name is just the code+year: `{CODE}{YY}` (e.g., `TEMS26`, `CTS26`).

---

## Google Drive Structure (Standard)

Every summit year folder lives under its summit-type parent folder. Create this exact structure:

```
{CODE}{YY}/                                          (Folder — root for this summit year)
├── 1. {CODE}{YY}_GOALS                              (Google Doc)
├── 2. {CODE}{YY}_BRIEF                              (Google Doc)
├── 3. {CODE}{YY}_MASTER_Agenda_Speakers              (Google Sheet)
├── 4. {CODE}{YY}_BUDGET_vs_Actuals                   (Google Sheet)
├── 5. {CODE}{YY}_VOLUNTEERS_Schedule                 (Google Sheet)
├── {CODE}{YY}_BWP/                                   (Folder — Big Web Pages)
├── {CODE}{YY}_EMAILS/                                (Folder — countdown email drafts)
├── {CODE}{YY}_GRAPHICS_FINAL/                        (Folder)
│   ├── {CODE}{YY}_GRAPHICS_SPEC/                     (Subfolder)
│   ├── {CODE}{YY}_GRAPHICS_SOCIAL/                   (Subfolder)
│   ├── {CODE}{YY}_GRAPHICS_MEETUP/                   (Subfolder)
│   ├── {CODE}{YY}_GRAPHICS_ZAPRITE/                  (Subfolder)
│   └── {CODE}{YY}_GRAPHICS_EVENT_DISPLAY_SCREENS/    (Subfolder)
└── {CODE}{YY}_SPOTLIGHT/                             (Folder)
```

### How to create Drive items

Use the `gws` CLI. Always include `"supportsAllDrives": true` in params.

**Create a folder:**
```bash
gws drive files create --params '{"supportsAllDrives": true}' <<< '{"name": "FOLDER_NAME", "mimeType": "application/vnd.google-apps.folder", "parents": ["PARENT_ID"]}'
```

**Create a Google Doc:**
```bash
gws drive files create --params '{"supportsAllDrives": true}' <<< '{"name": "DOC_NAME", "mimeType": "application/vnd.google-apps.document", "parents": ["PARENT_ID"]}'
```

**Create a Google Sheet:**
```bash
gws drive files create --params '{"supportsAllDrives": true}' <<< '{"name": "SHEET_NAME", "mimeType": "application/vnd.google-apps.spreadsheet", "parents": ["PARENT_ID"]}'
```

**List folder contents (for audit):**
```bash
gws drive files list --params '{"q": "'\''FOLDER_ID'\'' in parents", "fields": "files(id,name,mimeType)", "supportsAllDrives": true, "includeItemsFromAllDrives": true, "pageSize": 100}'
```

**Move a file to a different folder:**
```bash
gws drive files update --params '{"fileId": "FILE_ID", "addParents": "NEW_PARENT_ID", "removeParents": "OLD_PARENT_ID", "supportsAllDrives": true}' <<< '{}'
```

## Document & Sheet Templates

After creating docs and sheets, populate them with skeleton content using the templates below. Replace placeholders: `{CODE}` = summit code (e.g., CTS), `{YY}` = 2-digit year, `{PREV_YY}` = previous year, `{FULL_NAME}` = full summit name from registry.

### GOALS Doc Template

```
Registrations: [TARGET]
Tickets Sold: [TARGET]
Ticket Revenue: $[TARGET]
Sponsors: [TARGET]
Sponsor Revenue: $[TARGET]
Budget Tracker: $[TARGET]

Speakers Confirmed: [TARGET]
Panels/Fireside Chats: [TARGET]
Post Production BWP's: [TARGET]
```

### BRIEF Doc Template

Title line should be bold, 17pt: `Brief: {FULL_NAME} {YY}`

Then the following body content:

```
Location: [VENUE], [CITY], [STATE]
Dates: [EVENT_DATES]
Format: Two-day, all-inclusive summit

Overview
[empty - to be filled]

Attendees
[empty - to be filled]

Historical Sponsors:

Prospective Sponsors:

Historical Speakers:

Potential Speakers:

Programming Tracks
1.
2.
3.
4.
5.
6.

Accompanying Report
Abstract:

Creative Brief
Core Visual Identity
Color Palette
Typography
Visual Style & Tone
```

Formatting notes:
- "Location:", "Dates:", "Format:" labels are **bold**
- "Overview" and "Attendees" are **HEADING_3** style

### MASTER Agenda Sheet Template

Two tabs:

**Tab 1 — `Master Agenda [2 Days]`** (rename the default Sheet1):
- Header row (row 1) columns: `[blank, Email 1 (Intro), Cal Invite (Update), Email 2 (Finalization), Speaker Cards, Media, Day, Time, Topic, EMCEE, Lead Speaker/Moderator, Speaker 1, Speaker 2, Speaker 3, Abstract]`
- Pre-populate Day 1 and Day 2 time slots:
  - Day 1: 8:00 AM, 8:30 AM, 9:00 AM, 9:30 AM, 10:00 AM, 10:30 AM, 11:00 AM, 11:30 AM, 12:00 PM (Lunch), 1:00 PM, 1:30 PM, 2:00 PM, 2:30 PM, 3:00 PM, 3:30 PM, 4:00 PM, 4:30 PM, 5:00 PM (Happy Hour)
  - Day 2: same time slots

**Tab 2 — `Color codes`** (add new tab):
- Row 3: `[blank, Orange, Draft ready for review]`
- Row 4: `[blank, Green, Review & ready to be shared with speakers]`
- Row 5: `[blank, Blue, Shipped]`

### BUDGET Sheet Template

**Tab name:** `Budget` (rename the default Sheet1)

- Row 1: `["{CODE}{YY}", "F/B"]`
- Row 4 (header): `[Line Item Description, Vendor, {PREV_YY} Actuals, {YY} Estimate, {YY} Actual, Deposit, Status, Signed (Y/N), Latest Date, Contact, Timing, Notes]`
- Pre-populated category rows below header:

```
FOOD/BEVERAGE
  Lunch Day 1
  Tip
  Lunch Day 2
  Tip
  Breakfast Day 1
  Breakfast Day 2
  Tip
  Coffee
  Coffee Cups
  Alcohol
  Non-Alcohol
  Happy Hour
  After Party
  Tip
STAFFING/EVENT
  Audience Chairs
  Stage
  Stage Chairs
MISCELLANEOUS
  Volunteer Tees
  Lanyards
  Poster
  White Paper
  Speaker Cards
```

### VOLUNTEERS Sheet Template

Two tabs:

**Tab 1 — `Combined_Volunteer_Schedule`** (rename the default Sheet1):
- Row 1: `Volunteer Schedule`
- Row 2: `PIC`
- Row 3: `Signal Group:`
- Row 6 header: `[Time, Location, Task, Volunteer 1, Volunteer 2, Volunteer 3, Volunteer 4]`
- Pre-populated standard volunteer shifts below header:
  - Lobby, Kitchen, Registration, Usher, A/V, Timer

**Tab 2 — `Volunteers`** (add new tab):
- Header row: `[Name, Signal, Confirmed]`

### How to Populate Templates After Creation

Use the `gws` CLI to populate docs and sheets after creating them.

**Populate a Google Doc** (insert text at the beginning):
```bash
gws docs documents batchUpdate --params '{"documentId": "DOC_ID"}' --json '{"requests": [{"insertText": {"location": {"index": 1}, "text": "CONTENT_HERE"}}]}'
```

**Rename a sheet tab:**
```bash
gws sheets spreadsheets batchUpdate --params '{"spreadsheetId": "SHEET_ID"}' --json '{"requests": [{"updateSheetProperties": {"properties": {"sheetId": 0, "title": "NEW_NAME"}, "fields": "title"}}]}'
```

**Add a new sheet tab:**
```bash
gws sheets spreadsheets batchUpdate --params '{"spreadsheetId": "SHEET_ID"}' --json '{"requests": [{"addSheet": {"properties": {"title": "TAB_NAME"}}}]}'
```

**Set cell values:**
```bash
gws sheets spreadsheets values batchUpdate --params '{"spreadsheetId": "SHEET_ID"}' --json '{"valueInputOption": "RAW", "data": [{"range": "TabName!A1:O1", "values": [["Col1", "Col2", ...]]}]}'
```

For Google Docs, build the full text content string and insert it with `insertText`. Then apply formatting (bold, heading styles) with additional `updateTextStyle` and `updateParagraphStyle` requests in a second `batchUpdate` call.

For Google Sheets, first rename/add tabs with `spreadsheets batchUpdate`, then populate cell values with `spreadsheets values batchUpdate`.

---

## Asana Structure (Standard)

### Project

Create a project in workspace `1204176700167886`, team `1209092537090911`:
- Name: Use the pattern from the Summit Type Registry above
- Layout: `list`

### Sections (in this order)

1. `MILESTONES`
2. `📥 IN-TRAY`
3. `₿ SPONSORS`
4. `📫 INVITATIONS/REGISTRATIONS`
5. `DONE`

### Milestone Tasks

All milestone tasks go in the `MILESTONES` section. Each is created as a **milestone** (`resource_subtype: milestone`), not a regular task.

The naming pattern is: `[{CODE}{YY}] Milestone Name`

Create these 10 milestones in this order, each with its standard subtasks:

#### 1. `[{CODE}{YY}] Goals - Sponsors & Sales`
Subtasks:
- `[{CODE}{YY}] Sponsor Targets Achieved`
- `[{CODE}{YY}] Ticket Sales Target Achieved`

#### 2. `[{CODE}{YY}] Brief`
No subtasks.

#### 3. `[{CODE}{YY}] MASTER Agenda Speakers`
Subtasks:
- `Invite Initial Speakers`
- `Invite {CODE}{YY} speakers + interview outreach`
- `Create and finalize event agenda`
- `Speaker bios and headshots collected`
- `Review MASTER Agenda/Programming`
- `Schedule posted on webpage`

#### 4. `[{CODE}{YY}] Spotlight`
No subtasks.

#### 5. `[{CODE}{YY}] Budget & Vendor Contracts Closed`
Subtasks:
- `Venue rental agreement signed`
- `Catering vendor confirmed and contract signed`
- `A/V vendor confirmed and contract signed`
- `Print and signage vendor confirmed`
- `Staff and volunteer budget allocated`
- `{CODE}{YY} Budget Tracker`

#### 6. `[{CODE}{YY}] Volunteers`
No subtasks.

#### 7. `[{CODE}{YY}] BWP`
No subtasks.

#### 8. `[{CODE}{YY}] Emails`
Subtasks (14 countdown emails):
- `{CODE}{YY} - 180 Days to Go`
- `{CODE}{YY} - 120 Days to Go`
- `{CODE}{YY} - 90 Days to Go`
- `{CODE}{YY} - 60 Days to Go`
- `{CODE}{YY} - 45 Days to Go`
- `{CODE}{YY} - 30 Days to Go`
- `{CODE}{YY} - 21 Days to Go`
- `{CODE}{YY} - 14 Days to Go`
- `{CODE}{YY} - 7 Days to Go`
- `{CODE}{YY} - 3 Days to Go`
- `{CODE}{YY} - Tomorrow is the Day`
- `{CODE}{YY} - Today is the Day`
- `{CODE}{YY} - Last Day`
- `{CODE}{YY} - Recap and Thank You`

#### 9. `[{CODE}{YY}] Graphics Final`
Subtasks:
- `[{CODE}{YY}] Design - review concept and finalize with all graphics`
- `Social Graphic`
- `Zaprite Graphic`
- `Meetup Graphic`
- `Display Graphic`
- `Poster ordered - AlphaGraphics`

#### 10. `[{CODE}{YY}] Final Confirmations Checklist`
Subtasks:
- `Venue confirmed and reserved`
- `Volunteers confirmed`
- `Audio Tested`
- `Name Badges`
- `Speaker Cards`
- `Setup camera in event space to record`
- `Check lanyards/supplies inventory`
- `Airbnb/lodging for speakers and team`

### How to create Asana items

Use Asana MCP tools. Key operations:

**Create project:** Use `create_project` with `workspace_gid`, `team_gid`, `name`, `default_view: list`.

**Create section:** Use `asana_get_project_sections` to list, then create sections as needed. Sections are created via the Asana API.

**Create milestone:** Use Asana task creation with `resource_subtype: milestone` and assign to the MILESTONES section.

**Create subtask:** Use `asana_set_parent_for_task` or create task as subtask of parent.

**Move tasks between sections:** Use the Asana API to move tasks to the correct section.

**Search for loose tasks:** Use `asana_get_tasks` with section filter to find tasks not in MILESTONES.

---

## Execution Flow

### Mode: NEW

1. **Confirm inputs** — summit code, year, event dates (if known)
2. **Create Google Drive structure:**
   a. Create root folder under the summit-type parent folder
   b. Create numbered docs (1-2) and sheets (3-5) in root
   c. Create subfolders: BWP, EMAILS, GRAPHICS_FINAL, SPOTLIGHT
   d. Create GRAPHICS_FINAL subfolders: SPEC, SOCIAL, MEETUP, ZAPRITE, EVENT_DISPLAY_SCREENS
   e. Populate docs and sheets with skeleton template content (see "Document & Sheet Templates" section)
3. **Create Asana project:**
   a. Create the project in workspace/team
   b. Create sections in order: MILESTONES, IN-TRAY, SPONSORS, INVITATIONS/REGISTRATIONS, DONE
   c. Create all 10 milestone tasks in MILESTONES section
   d. Create all subtasks under each milestone
4. **Report** — Print summary with Drive folder URL and Asana project URL

### Mode: ORGANIZE (audit + fix existing)

1. **Find existing resources:**
   a. List the summit's Drive folder contents
   b. Find the Asana project (search by name pattern)
2. **Audit Google Drive:**
   a. Check all 5 numbered docs/sheets exist — create any missing ones
   b. Check all subfolders exist — create any missing ones
   c. Check GRAPHICS_FINAL subfolders exist — create any missing ones
   d. Identify loose files that should be in subfolders — report and offer to move
3. **Audit Asana:**
   a. Check sections exist and are named correctly — create/rename as needed
   b. Ensure MILESTONES section exists (some older projects use FOCUS instead — rename to MILESTONES)
   c. Check all 10 milestones exist — create any missing ones
   d. Check subtasks under each milestone — create any missing ones
   e. Find loose tasks in IN-TRAY or other sections that belong under a milestone — report and offer to move
   f. Ensure all milestone tasks have `resource_subtype: milestone` (not `default_task`)
4. **Report** — Print audit summary: what was found, what was created, what needs manual attention

---

## Important Notes

- Always use `supportsAllDrives: true` and `includeItemsFromAllDrives: true` for Drive operations
- The workspace ID for Asana is always `1204176700167886`
- The team ID is always `1209092537090911`
- When creating items, do so sequentially to ensure proper ordering (sections, milestones)
- For ORGANIZE mode, always ask before moving files or tasks — present the audit first
- IF (Imagine IF) is special: its Drive folder name includes dates in brackets, e.g., `[IF26] IMAGINE IF [OCT 5 & 6]`
- All other summits use simple `{CODE}{YY}` as the Drive folder name
- When re-organizing, if a section called "FOCUS" exists with milestones in it, rename it to "MILESTONES"
- Add a `DONE` section if one doesn't exist
