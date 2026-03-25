---
description: "Deploy summit countdown email calendar events and Zaprite registration tracking for any Bitcoin Park summit. Creates calendar invites on Rod's calendar for each 'Days to Go' email draft, builds a Google Sheet of Zaprite registrants, and deploys an Apps Script for daily sync. Use when scheduling summit emails on Rod's calendar, tracking registrations, or connecting email drafts to calendar events with Zaprite data."
---

# Calendar Deploy — Summit Email Scheduling + Registration Tracking

This skill takes a summit's existing email drafts (in the `[CODE]_EMAILS` Drive folder) and deploys:
1. **Calendar events** on Rod's calendar — one per email, scheduled on the correct send date at 5:30 AM CT
2. **A registrant Google Sheet** — populated from the Zaprite API with all current ticket holders
3. **A daily-sync Apps Script** — bound to the sheet, checks Zaprite every morning for new registrations
4. **Links everything together** — each calendar event description contains the email draft doc link + registrant sheet link

## Required Inputs

Ask the user for anything not provided:

1. **Summit code + year** — e.g., `TEMS26`, `CTS27`, `IF27`
2. **Summit start date** — e.g., "May 20, 2026"
3. **Summit end date** (optional) — for multi-day events. If not provided, assume single-day (start = end)
4. **_EMAILS folder** — Google Drive URL or folder ID for the summit's email drafts folder
5. **Zaprite event page URL or payment link ID** — e.g., `https://app.zaprite.com/org/.../events/pl_uTJen8SBWt/tickets` or just `pl_uTJen8SBWt`
6. **Zaprite API key** — Bearer token for the Zaprite API

## Summit Type Registry

| Code | Full Name |
|------|-----------|
| IF | Imagine IF |
| TEMS | Texas Energy & Mining Summit |
| CTS | Bitcoin Custody & Treasury Summit |
| NEMS | Nashville Energy & Mining Summit |
| GB | Grassroots Bitcoin |
| GBS | Global Bitcoin Summit |
| BT | Bitcoin Takeover |
| GFTS | Global Freedom Tech Summit |

---

## Phase 1: Find Email Drafts

List all files in the _EMAILS folder. These are on a shared drive, so always include shared drive flags:

```bash
gws drive files list --params '{"q":"\"FOLDER_ID\" in parents","fields":"files(id,name)","pageSize":"50","includeItemsFromAllDrives":"true","supportsAllDrives":"true","corpora":"allDrives","orderBy":"name"}'
```

Email drafts follow the naming convention from the `emailcountdown` skill:
`[##]. [Summit Full Name] [Year] - [Email Title] Email Draft`

## Phase 2: Calculate Send Dates

Parse each filename to determine the send date relative to the summit start/end dates.

### Numbered "X Days to Go" emails
Send date = `summit_start_date - X days`

If the calculated date is in the past (before today), **skip it** — don't create a calendar event.

### Special-name emails

| Filename contains | Send date |
|-------------------|-----------|
| "Tomorrow" | `summit_start_date - 1` |
| "Today Is the Day" | `summit_start_date` |
| "Last Day" | `summit_end_date` (falls back to `start_date + 1` if no end date and it's clearly a multi-day event; otherwise same as start) |
| "Recap and Thank You" | `summit_end_date + 1` |

For multi-day events, "Today Is the Day" is the opening day and "Last Day" is the closing day. If the user only provides a start date, ask whether the event is multi-day.

## Phase 3: Create Registrant Sheet

### Fetch registrations from Zaprite

The Zaprite API paginates (100 items/page, `meta.pagesCount` tells total pages). Paginate through ALL pages. For each order, check:
- `order.paymentLink.id === TARGET_PL_ID`
- `order.status === "COMPLETE"`

Extract from each matching order:
- `customerData.email`
- `customerData.name`
- `customerData.company`
- `eventTickets[0].paymentLinkItem.title` (ticket type)
- `paidAt` (truncated to date)

```bash
# Paginate with curl — use a Python script to loop through all pages
curl -s -H "Authorization: Bearer ZAPRITE_API_KEY" "https://api.zaprite.com/v1/orders?limit=100&page=1"
```

### Create the Google Sheet

Create the sheet in the _EMAILS folder:

```bash
gws drive files create --json '{"name":"[CODE][YY] - Registered Emails","mimeType":"application/vnd.google-apps.spreadsheet","parents":["FOLDER_ID"]}' --params '{"supportsAllDrives":"true","fields":"id,name,webViewLink"}'
```

Populate with header row + data using:

```bash
gws sheets spreadsheets values update \
  --params '{"spreadsheetId":"SHEET_ID","range":"Sheet1!A1:E[ROW_COUNT]","valueInputOption":"RAW"}' \
  --json '{"values":[["Email","Name","Company","Ticket Type","Registration Date"], ...]}'
```

## Phase 4: Create Calendar Events

For each email draft with a future send date, create a calendar event on **andrew@bitcoinpark.com** with **rod@bitcoinpark.com** as attendee (we can't write directly to Rod's calendar).

```bash
gws calendar events insert \
  --params '{"calendarId":"andrew@bitcoinpark.com"}' \
  --json '{
    "summary": "Send [Email Title] Email - [CODE][YY]",
    "description": "Email draft: https://docs.google.com/document/d/[DOC_ID]\n\nRegistered emails: [SHEET_URL]",
    "start": {"dateTime": "[DATE]T05:30:00-05:00", "timeZone": "America/Chicago"},
    "end": {"dateTime": "[DATE]T06:00:00-05:00", "timeZone": "America/Chicago"},
    "attendees": [{"email": "rod@bitcoinpark.com"}]
  }'
```

**Title format**: `Send [Email Title] Email - [CODE][YY]`

Examples: `Send 45 Days to Go Email - TEMS26`, `Send Tomorrow Email - CTS27`

## Phase 5: Deploy Apps Script for Daily Registration Sync

Creates a Google Apps Script bound to the registrant sheet that checks Zaprite daily at 5 AM CT.

### Prerequisites

The Apps Script API requires three things. If the deploy fails, walk the user through whichever is missing:

1. **OAuth scope**: `gws auth login --scopes https://www.googleapis.com/auth/script.projects`
   (Re-login with full scopes afterward: `gws auth login`)
2. **GCP API enabled**: The error message includes the activation URL
3. **User-level toggle ON**: https://script.google.com/home/usersettings

### Deploy

Use the helper script at `/Users/andrewdavis/.claude/skills/calendardeploy/scripts/deploy_apps_script.py`:

```bash
python3 /Users/andrewdavis/.claude/skills/calendardeploy/scripts/deploy_apps_script.py \
  "SHEET_ID" "ZAPRITE_API_KEY" "ZAPRITE_PL_ID"
```

This script decrypts gws credentials (AES-GCM), exchanges for an access token, creates a container-bound Apps Script project on the sheet, and pushes the parameterized sync code.

### Activate the trigger

After deploy, instruct the user to:
1. Open the Apps Script editor URL (printed by the deploy script)
2. Select `createDailyTrigger` from the function dropdown
3. Click **Run** and authorize when prompted
4. If they see an "unsafe app" warning: **Advanced** > **Go to Registration Sync (unsafe)**

### Restore full gws scopes

Remind: `gws auth login` (select all scopes)

---

## Execution Summary

Report back with:
- Number of calendar events created (and any skipped past-date emails)
- Table: Email title | Send date
- Registrant sheet link + count
- Apps Script editor link
- Reminder to run `createDailyTrigger` and restore gws scopes

## Notes

- Zaprite API key is org-level — same key for all BP summits
- Payment link IDs (`pl_xxx`) can be extracted from Zaprite URLs: `.../events/pl_xxx/tickets`
- Use CDT offset (`-05:00`) March–November, CST (`-06:00`) November–March
- If _EMAILS folder doesn't exist, suggest `/summitarchitect` first
- If email drafts don't exist, suggest `/emailcountdown` to generate them
