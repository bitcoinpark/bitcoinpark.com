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

### Drive architecture

The Bitcoin Park Shared Drive is organized as:

```
0. CULTURE & SYSTEMS    → 1Cq49eOmQKTOMcrlpM-o8RN4s6cCt1M-C
1. MEMBERSHIP           → 1_e6W25rMUemEasxlsBGLLhP4yQjjOkFV
2. EXPERIENCES          → 1ewldFexfKCJHR8_Z0uMjPOyQjeArbppL
   ├── 2A. PARK NASHVILLE → 1-2bXWOqiX3iDPei_vkDCfXrsIhF-TbSK
   ├── 2B. PARK AUSTIN    → 10Is_LMlL-Mbum-9Q_9GwUnyGTlWuoRTg
   └── 2C. SUMMITS        → 1Zd7yoMIvidGrA5J0ZTqjjji-MGpwSK9G
3. IMAGINE IF           → 1eXC2Zz933q3LJ-z992r3MSJElnMVBIno
4. OTHER PROJECTS       → 1xvnBVITH-uOb90guBIuSj1a9t9reDWIi
```

**Routing rules:**
- **Summits** (NEMS, BT, GB, TEMS, CTS, GBS) → **2. EXPERIENCES > 2C. SUMMITS**
- **IF** (all years: IF26, IF27, IF28, etc.) → **3. IMAGINE IF**
- **Nashville meetups** → **2. EXPERIENCES > 2A. PARK NASHVILLE**
- **Austin meetups** → **2. EXPERIENCES > 2B. PARK AUSTIN**
- **Everything else** → **4. OTHER PROJECTS**

### Summit parent folder IDs

These are the parent folders for each summit type (year subfolders go inside these):

```
NEMS  → 1lKma4acIwosjj2fTHSa3tAT4jkTlFV6Y   (under 2C. SUMMITS)
BT    → 1BE5OJDcDOEdt30ppZPcwTFpKLCXEog89   (under 2C. SUMMITS)
GB    → 1scZCZBtLDg2qjmobdMlCSAPMv7iOMLSm   (under 2C. SUMMITS)
TEMS  → 1PvJsYEDNMfzo6NAnB5nYKNeDToWHui2h   (under 2C. SUMMITS)
IF    → 1eXC2Zz933q3LJ-z992r3MSJElnMVBIno   (under 3. IMAGINE IF)
CTS   → 1rYc0Mdu3ZGnNAvs4VB74ygKY4s0PK4L0   (under 2C. SUMMITS)
GBS   → 1vEG7f5NLs7GM6hziDo6phjZjw3O_qzMZ   (under 2C. SUMMITS)
```

### Find the year subfolder (or prompt to create a new project folder)

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

**If the year folder does NOT exist**, do NOT silently create it. This means the user is starting a brand new project (e.g., NEMS27, a new meetup series, etc.). Ask the user:

> I don't see a project folder for **<PROJECT_CODE>** in Google Drive yet. Would you like me to create one?
>
> This will create: `<PARENT_SUMMIT_FOLDER>` → `<PROJECT_CODE>`
>
> If this is a new project type (not one of the existing summits), let me know the name and where it should live in the Drive, and I'll set it up.

Only after the user confirms, create the folder:

```bash
gws drive files create --json '{
  "name": "<PROJECT_CODE>",
  "mimeType": "application/vnd.google-apps.folder",
  "parents": ["<PARENT_FOLDER_ID>"]
}' --params '{"supportsAllDrives": true}'
```

If the user names something that isn't one of the known summit codes, determine where it goes based on the routing rules:

- **Nashville meetup** → create under `2A. PARK NASHVILLE` (`1-2bXWOqiX3iDPei_vkDCfXrsIhF-TbSK`)
- **Austin meetup** → create under `2B. PARK AUSTIN` (`10Is_LMlL-Mbum-9Q_9GwUnyGTlWuoRTg`)
- **Anything else** → create under `4. OTHER PROJECTS` (`1xvnBVITH-uOb90guBIuSj1a9t9reDWIi`)

Ask the user to confirm the location if you're unsure which category it falls into.

### Find or create the Stitch graphics subfolders

Each project gets two subfolders inside the year folder:

- `FINAL - [<PROJECT_CODE>] STITCH CREATIVES AND GRAPHICS` — approved, ready-to-use designs
- `SPEC - [<PROJECT_CODE>] STITCH CREATIVES AND GRAPHICS` — speculative/draft designs still being iterated on

Search for both inside the year folder:

```bash
gws drive files list --params '{
  "q": "mimeType=\"application/vnd.google-apps.folder\" and name contains \"STITCH CREATIVES AND GRAPHICS\" and \"<YEAR_FOLDER_ID>\" in parents",
  "fields": "files(id,name)",
  "driveId": "0AEtADa_AopTlUk9PVA",
  "corpora": "drive",
  "includeItemsFromAllDrives": true,
  "supportsAllDrives": true
}'
```

Create whichever don't exist:

```bash
# SPEC folder (drafts go here first)
gws drive files create --json '{
  "name": "SPEC - [<PROJECT_CODE>] STITCH CREATIVES AND GRAPHICS",
  "mimeType": "application/vnd.google-apps.folder",
  "parents": ["<YEAR_FOLDER_ID>"]
}' --params '{"supportsAllDrives": true}'

# FINAL folder (approved designs)
gws drive files create --json '{
  "name": "FINAL - [<PROJECT_CODE>] STITCH CREATIVES AND GRAPHICS",
  "mimeType": "application/vnd.google-apps.folder",
  "parents": ["<YEAR_FOLDER_ID>"]
}' --params '{"supportsAllDrives": true}'
```

Save both folder IDs. New designs upload to the **SPEC** folder by default. When the user approves a design as final, upload (or move) it to the **FINAL** folder.

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

The screen response contains an `imageUri` or rendered image URL. Download it and upload to the **SPEC** folder (drafts go here by default):

```bash
# Download the image
curl -L -o /tmp/stitch_design.png "<IMAGE_URL>"

# Upload to the SPEC folder
gws drive +upload /tmp/stitch_design.png \
  --params '{"supportsAllDrives": true}' \
  --json '{"name": "<descriptive-filename>.png", "parents": ["<SPEC_FOLDER_ID>"]}'
```

Use a descriptive filename like `NEMS26-speaker-card-john-doe.png` or `BT27-social-announcement-banner.png`.

If `+upload` doesn't work, use the standard files create with upload:

```bash
gws drive files create \
  --upload /tmp/stitch_design.png \
  --json '{"name": "<descriptive-filename>.png", "parents": ["<SPEC_FOLDER_ID>"]}' \
  --params '{"supportsAllDrives": true}'
```

### Moving approved designs to FINAL

When the user says a design is final/approved, move it from SPEC to FINAL:

```bash
gws drive files update --params '{"fileId": "<FILE_ID>", "addParents": "<FINAL_FOLDER_ID>", "removeParents": "<SPEC_FOLDER_ID>", "supportsAllDrives": true}'
```

Or if uploading a new final version directly, upload to the FINAL folder instead:

```bash
gws drive files create \
  --upload /tmp/stitch_design.png \
  --json '{"name": "<descriptive-filename>.png", "parents": ["<FINAL_FOLDER_ID>"]}' \
  --params '{"supportsAllDrives": true}'
```

## Step 6: Confirm and Share

After uploading, tell the user:
- The Stitch project URL: `https://stitch.withgoogle.com/projects/<PROJECT_ID>`
- The Google Drive folder where the file was saved
- Offer to create more designs or variations
