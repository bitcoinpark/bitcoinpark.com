---
description: "Design graphics for Bitcoin Park summit projects using Stitch and save them to Google Drive. Use when the user wants to create event graphics, social media assets, banners, speaker cards, or any visual design for summits like NEMS, BT, GB, TEMS, IF, CTS, GBS, or HB."
---

# Stitch Design for Bitcoin Park Summits

## Prerequisites

**Required:**
```bash
gws --help          # Google Workspace CLI — install: go install github.com/nicholasgasior/gws@latest
gcloud auth list    # gcloud CLI — must be authenticated (gcloud auth login && gcloud auth application-default login)
```

**Optional (for video/image input):**
```bash
ffmpeg -version     # brew install ffmpeg
yt-dlp --version    # pip3 install yt-dlp
```

## Calling Stitch

### Primary: CLI `tool` command (fastest, most reliable)

Use the `npx @_davideast/stitch-mcp tool` CLI with the `STITCH_API_KEY` env var. This bypasses MCP connection issues entirely.

```bash
STITCH_API_KEY="AQ.Ab8RN6ImFfrUEft_laPg0VMKuN_hSmrzeh0A-bldkPTXz4cQYQ" \
  npx @_davideast/stitch-mcp tool <tool_name> -d '<json_args>'
```

Available tools: `create_project`, `list_projects`, `list_screens`, `get_screen`, `generate_screen_from_text`, `edit_screens`, `generate_variants`, `get_project`.

**Examples:**
```bash
# Create a project
STITCH_API_KEY="AQ.Ab8RN6ImFfrUEft_laPg0VMKuN_hSmrzeh0A-bldkPTXz4cQYQ" \
  npx @_davideast/stitch-mcp tool create_project -d '{"title":"HB26 LinkedIn Graphics"}'

# Generate a screen
STITCH_API_KEY="AQ.Ab8RN6ImFfrUEft_laPg0VMKuN_hSmrzeh0A-bldkPTXz4cQYQ" \
  npx @_davideast/stitch-mcp tool generate_screen_from_text -d '{
    "projectId": "1234567890",
    "prompt": "detailed design prompt here",
    "deviceType": "DESKTOP"
  }'

# List screens in a project
STITCH_API_KEY="AQ.Ab8RN6ImFfrUEft_laPg0VMKuN_hSmrzeh0A-bldkPTXz4cQYQ" \
  npx @_davideast/stitch-mcp tool list_screens -d '{"projectId": "1234567890"}'
```

### Fallback: Direct MCP tools (if connected)

If `mcp__stitch__*` tools are available in the session, use them directly: `mcp__stitch__create_project`, `mcp__stitch__generate_screen_from_text`, `mcp__stitch__edit_screens`, `mcp__stitch__get_screen`, `mcp__stitch__get_project`, `mcp__stitch__list_projects`, `mcp__stitch__list_screens`, `mcp__stitch__generate_variants`.

**Quota errors?** Check that `STITCH_PROJECT_ID=bitcoin-park-claude-code-ad` is set in the MCP server config, and that `~/.stitch-mcp/config/configurations/config_default` contains `[core]\nproject = bitcoin-park-claude-code-ad`.

### Last resort: Gemini CLI

Only if both CLI `tool` and MCP tools fail:

```bash
gemini mcp add stitch npx @_davideast/stitch-mcp proxy \
  --scope user --trust \
  -e STITCH_API_KEY="AQ.Ab8RN6ImFfrUEft_laPg0VMKuN_hSmrzeh0A-bldkPTXz4cQYQ" \
  -e STITCH_PROJECT_ID=bitcoin-park-claude-code-ad
```

## Video & Image Input (optional)

If the user provides a video (Loom URL, local MP4/MOV, remote URL) or image, invoke `/videoanalysis` first. Requires `ffmpeg` and `yt-dlp` — if missing, ask the user to describe the design instead. The video describes what the final graphic should look like — treat the analysis output as the design brief. Extract layout, colors, text content, style cues, and any spoken/on-screen instructions, then use those details directly as the Stitch design prompt in Step 3.

## Step 1: Identify Summit

If not already specified, ask the user which summit. Project code = summit code + year suffix (e.g., CTS26).

| Code | Name | Drive Parent Folder ID |
|------|------|----------------------|
| NEMS | Nashville Energy and Mining Summit | `1lKma4acIwosjj2fTHSa3tAT4jkTlFV6Y` |
| BT | Bitcoin Takeover SXSW | `1BE5OJDcDOEdt30ppZPcwTFpKLCXEog89` |
| GB | Grassroots Bitcoin | `1scZCZBtLDg2qjmobdMlCSAPMv7iOMLSm` |
| TEMS | Texas Energy and Mining Summit | `1PvJsYEDNMfzo6NAnB5nYKNeDToWHui2h` |
| IF | Imagine IF | `1eXC2Zz933q3LJ-z992r3MSJElnMVBIno` |
| CTS | Bitcoin Custody & Treasury Summit | `1rYc0Mdu3ZGnNAvs4VB74ygKY4s0PK4L0` |
| GBS | Global Bitcoin Summit | `1vEG7f5NLs7GM6hziDo6phjZjw3O_qzMZ` |
| HB | Park Forum: Bitcoin in Healthcare | `1ZIdrVyzIE0wgjy5okDpNue-vAziTon38` |

All summits except IF live under **2C. SUMMITS**. IF lives under **3. IMAGINE IF**.

**If the user provides a Drive folder URL**, extract the folder ID from it and use that directly as the parent — do NOT use the table above. The user knows where they want files to go.

Non-summit routing: Nashville meetups → `1-2bXWOqiX3iDPei_vkDCfXrsIhF-TbSK`, Austin meetups → `10Is_LMlL-Mbum-9Q_9GwUnyGTlWuoRTg`, everything else → `1xvnBVITH-uOb90guBIuSj1a9t9reDWIi`.

## Step 2: Determine Upload Folder

**IMPORTANT: Do NOT create new Drive folders.** The folder structure already exists for each summit. Your job is to find the right SPEC folder and upload there.

**If the user provides a Drive folder URL or ID**, use that directly as the upload target. Extract the folder ID from URLs like `https://drive.google.com/drive/u/0/folders/<FOLDER_ID>`.

**If no URL is provided**, find the existing SPEC folder using the summit's parent folder ID from the table above:

```bash
# Search for the GRAPHICS_SPEC folder inside the summit's parent folder tree
gws drive files list --params '{"q": "mimeType=\"application/vnd.google-apps.folder\" and name contains \"GRAPHICS_SPEC\"", "fields": "files(id,name,parents)", "driveId": "0AEtADa_AopTlUk9PVA", "corpora": "drive", "includeItemsFromAllDrives": true, "supportsAllDrives": true}'
```

If you truly cannot find the SPEC folder, **ask the user for the folder link** rather than creating new folders. Shared drive ID for all queries: `0AEtADa_AopTlUk9PVA`. All `gws drive` calls need `supportsAllDrives: true`.

## Step 3: Create Stitch Project & Design

**Create project:**
```bash
STITCH_API_KEY="AQ.Ab8RN6ImFfrUEft_laPg0VMKuN_hSmrzeh0A-bldkPTXz4cQYQ" \
  npx @_davideast/stitch-mcp tool create_project -d '{"title":"<PROJECT_CODE> - <description>"}'
```

Extract the numeric project ID from the `name` field (e.g., `projects/1234567890` → `1234567890`).

**Generate screen:**
```bash
STITCH_API_KEY="AQ.Ab8RN6ImFfrUEft_laPg0VMKuN_hSmrzeh0A-bldkPTXz4cQYQ" \
  npx @_davideast/stitch-mcp tool generate_screen_from_text -d '{
    "projectId": "<NUMERIC_ID>",
    "prompt": "<detailed design prompt>",
    "deviceType": "DESKTOP"
  }'
```

The response contains `outputComponents[1].design.screens[0]` with:
- `.name` — screen resource name (contains screen ID)
- `.htmlCode.downloadUrl` — URL to download the HTML source
- `.screenshot.downloadUrl` — URL to the thumbnail (low-res, don't use for final export)

**Edit existing screen:**
```bash
STITCH_API_KEY="AQ.Ab8RN6ImFfrUEft_laPg0VMKuN_hSmrzeh0A-bldkPTXz4cQYQ" \
  npx @_davideast/stitch-mcp tool edit_screens -d '{
    "projectId": "<NUMERIC_ID>",
    "selectedScreenIds": ["<SCREEN_ID>"],
    "prompt": "description of changes"
  }'
```

**Generate variants** for quick variations of existing screens:
```bash
STITCH_API_KEY="AQ.Ab8RN6ImFfrUEft_laPg0VMKuN_hSmrzeh0A-bldkPTXz4cQYQ" \
  npx @_davideast/stitch-mcp tool generate_variants -d '{
    "projectId": "<NUMERIC_ID>",
    "screenId": "<SCREEN_ID>"
  }'
```

## Step 4: Export to Google Drive

Export designs as **full-resolution PNGs** by rendering the HTML source, NOT by downloading the screenshot thumbnail.

**Extract the `htmlCode.downloadUrl`** from the generate response at `outputComponents[1].design.screens[0].htmlCode.downloadUrl`.

**Download HTML, render to full-res PNG, upload to the user's target folder:**
```bash
# 1. Download the HTML source
curl -L -o /tmp/stitch_design.html "<HTMLCODE_DOWNLOAD_URL>"

# 2. Render to full-resolution PNG (1920x1080 @2x = 3840x2160 output)
cd ~/.claude/scripts && node stitch_render.mjs /tmp/stitch_design.html /tmp/stitch_design.png 1920 1080

# 3. Upload directly to the target folder (from Step 2 — user-provided or found SPEC folder)
gws drive files create --upload /tmp/stitch_design.png \
  --json '{"name": "<PROJECT_CODE>-<descriptive-name>.png", "parents": ["<TARGET_FOLDER_ID>"]}' \
  --params '{"supportsAllDrives": true}'
```

The render script lives at `~/.claude/scripts/stitch_render.mjs` with puppeteer installed locally. It uses Chrome to render the HTML at the specified viewport size with 2x device scale factor for retina-quality output. Default is 1920x1080 → 3840x2160 PNG.

**Common sizes:**
- LinkedIn graphic: `1200 628`
- Square (Instagram): `1080 1080`
- Stories: `1080 1920`
- Standard 16:9: `1920 1080`

**Move to FINAL** when approved (move from SPEC up to its parent FINAL folder):
```bash
gws drive files update --params '{"fileId": "<FILE_ID>", "addParents": "<FINAL_FOLDER_ID>", "removeParents": "<SPEC_FOLDER_ID>", "supportsAllDrives": true}'
```

## Step 5: Confirm

Share with the user: Stitch URL (`https://stitch.withgoogle.com/projects/<PROJECT_ID>`), Drive folder location, and offer to create more designs or variations.
