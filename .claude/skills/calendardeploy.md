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

## Zaprite API Key

The Zaprite API key is stored and does not need to be requested from the user:

```
6607fb3f-532c-4db0-a995-baebd14c121e
```

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
| HB | Health & Bitcoin |

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

The Apps Script API requires these to be enabled. If the deploy fails, walk the user through whichever is missing:

1. **OAuth scope** — The `script.projects` scope is already included in the standard gws full scope set. No separate login is needed.
2. **GCP API enabled**: The error message includes the activation URL
3. **User-level toggle ON**: https://script.google.com/home/usersettings

### Deploy

Write the following Python script to a temp file, substituting `SHEET_ID`, `ZAPRITE_API_KEY`, and `ZAPRITE_PL_ID` with the actual values, then run it:

```python
#!/usr/bin/env python3
"""Deploy a container-bound Apps Script to a Google Sheet for Zaprite registration sync."""
import json, base64, urllib.request, urllib.parse
from pathlib import Path

GWS_CONFIG = Path.home() / ".config" / "gws"

# --- Config: substitute these before running ---
SHEET_ID = "__SHEET_ID__"
ZAPRITE_API_KEY = "__ZAPRITE_API_KEY__"
ZAPRITE_PL_ID = "__ZAPRITE_PL_ID__"

# --- Apps Script source code (Zaprite -> Sheet sync) ---
APPS_SCRIPT_CODE = r'''
var ZAPRITE_API_KEY = "''' + ZAPRITE_API_KEY + r'''";
var TARGET_PL_ID = "''' + ZAPRITE_PL_ID + r'''";

function syncRegistrations() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  var lastRow = sheet.getLastRow();
  var existingEmails = {};
  if (lastRow > 1) {
    var emailRange = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < emailRange.length; i++) {
      if (emailRange[i][0]) existingEmails[emailRange[i][0].toString().toLowerCase()] = true;
    }
  }
  var allRegistrants = [];
  var page = 1;
  var totalPages = 1;
  while (page <= totalPages) {
    var url = "https://api.zaprite.com/v1/orders?limit=100&page=" + page;
    var response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: { "Authorization": "Bearer " + ZAPRITE_API_KEY },
      muteHttpExceptions: true
    });
    var data = JSON.parse(response.getContentText());
    if (page === 1 && data.meta) totalPages = data.meta.pagesCount || 1;
    var items = data.items || [];
    for (var i = 0; i < items.length; i++) {
      var order = items[i];
      var pl = order.paymentLink || {};
      if (pl.id === TARGET_PL_ID && order.status === "COMPLETE") {
        var cd = order.customerData || {};
        var email = (cd.email || "").toLowerCase();
        if (email && !existingEmails[email]) {
          var tickets = order.eventTickets || [];
          var ticketType = (tickets.length > 0 && tickets[0].paymentLinkItem) ? tickets[0].paymentLinkItem.title || "" : "";
          allRegistrants.push([cd.email, cd.name || "", cd.company || "", ticketType, (order.paidAt || "").substring(0, 10)]);
          existingEmails[email] = true;
        }
      }
    }
    page++;
  }
  if (allRegistrants.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, allRegistrants.length, 5).setValues(allRegistrants);
    Logger.log("Added " + allRegistrants.length + " new registrants");
  } else {
    Logger.log("No new registrants found");
  }
}

function createDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "syncRegistrations") ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger("syncRegistrations").timeBased().everyDays(1).atHour(5).inTimezone("America/Chicago").create();
  Logger.log("Daily trigger created for 5:00 AM CT");
}
'''

MANIFEST = json.dumps({
    "timeZone": "America/Chicago",
    "dependencies": {},
    "exceptionLogging": "STACKDRIVER",
    "runtimeVersion": "V8",
    "oauthScopes": [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/script.scriptapp",
        "https://www.googleapis.com/auth/script.external_request",
    ],
})

def get_access_token():
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    with open(GWS_CONFIG / ".encryption_key", "r") as f:
        key = base64.b64decode(f.read().strip())
    with open(GWS_CONFIG / "credentials.enc", "rb") as f:
        enc_data = f.read()
    creds = json.loads(AESGCM(key).decrypt(enc_data[:12], enc_data[12:], None))
    cs = json.load(open(GWS_CONFIG / "client_secret.json"))["installed"]
    data = urllib.parse.urlencode({
        "client_id": cs["client_id"], "client_secret": cs["client_secret"],
        "refresh_token": creds["refresh_token"], "grant_type": "refresh_token",
    }).encode()
    return json.loads(urllib.request.urlopen(
        urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    ).read())["access_token"]

def api_call(token, url, body, method="POST"):
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, method=method)
    return json.loads(urllib.request.urlopen(req).read())

token = get_access_token()
project = api_call(token, "https://script.googleapis.com/v1/projects",
    {"title": "Registration Sync", "parentId": SHEET_ID})
script_id = project["scriptId"]
api_call(token, f"https://script.googleapis.com/v1/projects/{script_id}/content",
    {"files": [
        {"name": "Code", "type": "SERVER_JS", "source": APPS_SCRIPT_CODE},
        {"name": "appsscript", "type": "JSON", "source": MANIFEST},
    ]}, method="PUT")
print(f"Apps Script deployed: https://script.google.com/d/{script_id}/edit")
print(json.dumps({"scriptId": script_id, "editorUrl": f"https://script.google.com/d/{script_id}/edit"}))
```

Write this to `/tmp/deploy_apps_script.py` (with the three config values filled in), then run:

```bash
python3 /tmp/deploy_apps_script.py
```

### Activate the trigger

After deploy, instruct the user to:
1. Open the Apps Script editor URL (printed by the script)
2. Select `createDailyTrigger` from the function dropdown
3. Click **Run** and authorize when prompted
4. If they see an "unsafe app" warning: **Advanced** > **Go to Registration Sync (unsafe)**

---

## Execution Summary

Report back with:
- Number of calendar events created (and any skipped past-date emails)
- Table: Email title | Send date
- Registrant sheet link + count
- Apps Script editor link
- Reminder to run `createDailyTrigger`

## Notes

- Zaprite API key is org-level — same key for all BP summits
- Payment link IDs (`pl_xxx`) can be extracted from Zaprite URLs: `.../events/pl_xxx/tickets`
- Use CDT offset (`-05:00`) March–November, CST (`-06:00`) November–March
- If _EMAILS folder doesn't exist, suggest `/summitarchitect` first
- If email drafts don't exist, suggest `/emailcountdown` to generate them
