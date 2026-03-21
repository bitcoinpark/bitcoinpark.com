---
description: "Design graphics for Bitcoin Park summit projects using Stitch and save them to Google Drive. Use when the user wants to create event graphics, social media assets, banners, speaker cards, or any visual design for summits like NEMS, BT, GB, TEMS, IF, CTS, or GBS."
---

# Stitch Design for Bitcoin Park Summits

Create designs with Google Stitch and save them to the correct summit project folder in the Bitcoin Park Google Shared Drive.

## Prerequisites Check

Before starting, verify the user has the required tools. If any command fails, point them to the setup instructions in the repo README.

1. **gws CLI** — run `gws --help` to verify it's installed
2. **Stitch MCP** — verify `mcp__stitch__list_projects` works (the Stitch MCP tools should be available)
3. **gcloud CLI** — run `gcloud auth list` to verify authentication

If Stitch MCP calls fail with a quota error, run:
```bash
gcloud auth application-default set-quota-project bitcoin-park-claude-code-ad
```
Then restart Claude Code (the MCP server loads at startup).

## Step 1: Identify the Summit Project

Ask the user which summit and year they're designing for. Present these options:

| Code | Summit Name |
|------|-------------|
| NEMS | Nashville Energy and Mining Summit |
| BT   | Bitcoin Takeover SXSW - Power of Payments |
| GB   | Grassroots Bitcoin |
| TEMS | Texas Energy and Mining Summit |
| IF   | Imagine IF |
| CTS  | Bitcoin Custody & Treasury Summit |
| GBS  | Global Bitcoin Summit |

Default year suffix: derive from current year (2026 → 26, 2027 → 27, etc.). The project code combines summit code + year suffix (e.g., NEMS26, BT27).

If the user already specified the project in their prompt (e.g., "design a banner for NEMS26"), skip the question and proceed.

## Step 2: Set Up the Google Drive Folder

Use the `gws` CLI for all Drive operations. Every Drive API call on this shared drive must include `supportsAllDrives` and `includeItemsFromAllDrives` parameters, and use `driveId` + `corpora: drive`.

The shared drive ID is: `0AEtADa_AopTlUk9PVA`

### Summit parent folder IDs

```
NEMS  → 1lKma4acIwosjj2fTHSa3tAT4jkTlFV6Y
BT    → 1BE5OJDcDOEdt30ppZPcwTFpKLCXEog89
GB    → 1scZCZBtLDg2qjmobdMlCSAPMv7iOMLSm
TEMS  → 1PvJsYEDNMfzo6NAnB5nYKNeDToWHui2h
IF    → 1eXC2Zz933q3LJ-z992r3MSJElnMVBIno
CTS   → 1rYc0Mdu3ZGnNAvs4VB74ygKY4s0PK4L0
GBS   → 1vEG7f5NLs7GM6hziDo6phjZjw3O_qzMZ
```

### Find or create the year subfolder

Search for a folder named like the project code (e.g., "NEMS26") inside the parent folder:

```bash
gws drive files list --params '{
  "q": "mimeType=\"application/vnd.google-apps.folder\" and name contains \"<PROJECT_CODE>\" and \"<PARENT_FOLDER_ID>\" in parents",
  "fields": "files(id,name)",
  "driveId": "0AEtADa_AopTlUk9PVA",
  "corpora": "drive",
  "includeItemsFromAllDrives": true,
  "supportsAllDrives": true
}'
```

If the year folder doesn't exist, create it:

```bash
gws drive files create --json '{
  "name": "<PROJECT_CODE>",
  "mimeType": "application/vnd.google-apps.folder",
  "parents": ["<PARENT_FOLDER_ID>"]
}' --params '{"supportsAllDrives": true}'
```

### Find or create the Stitch graphics subfolder

Inside the year folder, look for or create a folder named `[<PROJECT_CODE>] STITCH CREATIVES AND GRAPHICS`:

```bash
gws drive files list --params '{
  "q": "mimeType=\"application/vnd.google-apps.folder\" and name=\"[<PROJECT_CODE>] STITCH CREATIVES AND GRAPHICS\" and \"<YEAR_FOLDER_ID>\" in parents",
  "fields": "files(id,name)",
  "driveId": "0AEtADa_AopTlUk9PVA",
  "corpora": "drive",
  "includeItemsFromAllDrives": true,
  "supportsAllDrives": true
}'
```

If it doesn't exist:

```bash
gws drive files create --json '{
  "name": "[<PROJECT_CODE>] STITCH CREATIVES AND GRAPHICS",
  "mimeType": "application/vnd.google-apps.folder",
  "parents": ["<YEAR_FOLDER_ID>"]
}' --params '{"supportsAllDrives": true}'
```

Save the graphics folder ID — you'll upload files here later.

## Step 3: Create a Stitch Project

Use the Stitch MCP to create a project:

```
mcp__stitch__create_project(title: "<PROJECT_CODE> - <description of what's being designed>")
```

For example: `NEMS26 - Speaker Announcement Cards`

Save the project ID from the response.

## Step 4: Design with Stitch

Ask the user what they want to design if they haven't already said. Good prompts for Stitch include details about:
- What type of asset (social media post, banner, speaker card, event flyer, etc.)
- Dimensions or device type (DESKTOP for wide banners, MOBILE for stories/vertical, AGNOSTIC for flexible)
- Color scheme, branding, style preferences
- Text content to include (event name, dates, speaker names, etc.)

Generate the screen:

```
mcp__stitch__generate_screen_from_text(
  projectId: "<PROJECT_ID>",
  prompt: "<design prompt>",
  deviceType: "<DESKTOP|MOBILE|TABLET|AGNOSTIC>"
)
```

Use `modelId: "GEMINI_3_1_PRO"` for highest quality, or `"GEMINI_3_FLASH"` for faster iteration.

**Important:** Generation can take a few minutes. Do NOT retry if it seems slow. If it fails due to a connection error, try `mcp__stitch__get_screen` later to check if it succeeded.

After generation, check the `output_components` in the response:
- If it contains suggestions, present them to the user
- If the user accepts a suggestion, call `generate_screen_from_text` again with that suggestion as the prompt

### Iterating on designs

If the user wants changes, use `mcp__stitch__edit_screens`:

```
mcp__stitch__edit_screens(
  projectId: "<PROJECT_ID>",
  selectedScreenIds: ["<SCREEN_ID>"],
  prompt: "<what to change>"
)
```

To create variations, generate additional screens with modified prompts.

## Step 5: Export and Upload to Google Drive

After the user approves a design, retrieve the screen details:

```
mcp__stitch__get_screen(
  name: "projects/<PROJECT_ID>/screens/<SCREEN_ID>",
  projectId: "<PROJECT_ID>",
  screenId: "<SCREEN_ID>"
)
```

The screen response contains an `imageUri` or rendered image URL. Download it and upload to the Drive folder:

```bash
# Download the image
curl -L -o /tmp/stitch_design.png "<IMAGE_URL>"

# Upload to the graphics folder
gws drive +upload /tmp/stitch_design.png \
  --params '{"supportsAllDrives": true}' \
  --json '{"name": "<descriptive-filename>.png", "parents": ["<GRAPHICS_FOLDER_ID>"]}'
```

Use a descriptive filename like `NEMS26-speaker-card-john-doe.png` or `BT27-social-announcement-banner.png`.

If `+upload` doesn't work, use the standard files create with upload:

```bash
gws drive files create \
  --upload /tmp/stitch_design.png \
  --json '{"name": "<descriptive-filename>.png", "parents": ["<GRAPHICS_FOLDER_ID>"]}' \
  --params '{"supportsAllDrives": true}'
```

## Step 6: Confirm and Share

After uploading, tell the user:
- The Stitch project URL: `https://stitch.withgoogle.com/projects/<PROJECT_ID>`
- The Google Drive folder where the file was saved
- Offer to create more designs or variations
