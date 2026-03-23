---
description: "Design graphics for Bitcoin Park summit projects using Stitch and save them to Google Drive. Use when the user wants to create event graphics, social media assets, banners, speaker cards, or any visual design for summits like NEMS, BT, GB, TEMS, IF, CTS, or GBS."
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

Use the Stitch MCP tools directly: `mcp__stitch__create_project`, `mcp__stitch__generate_screen_from_text`, `mcp__stitch__edit_screens`, `mcp__stitch__get_screen`, `mcp__stitch__get_project`, `mcp__stitch__list_projects`, `mcp__stitch__list_screens`, `mcp__stitch__generate_variants`.

Call these tools directly — no Gemini CLI needed. This is the fastest path: Claude Code → Stitch MCP → Stitch API.

**Quota errors?** Check that `STITCH_PROJECT_ID=bitcoin-park-claude-code-ad` is set in the MCP server config, and that `~/.stitch-mcp/config/configurations/config_default` contains `[core]\nproject = bitcoin-park-claude-code-ad`.

### Fallback: Gemini CLI (only if MCP tools are unavailable)

If the `mcp__stitch__*` tools are not connected, fall back to Gemini CLI as a proxy:

```bash
gemini mcp add stitch npx @_davideast/stitch-mcp proxy \
  --scope user --trust \
  -e GOOGLE_APPLICATION_CREDENTIALS=$HOME/.config/gcloud/application_default_credentials.json \
  -e CLOUDSDK_CONFIG=$HOME/.config/gcloud \
  -e HOME=$HOME \
  -e "PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
  -e STITCH_PROJECT_ID=bitcoin-park-claude-code-ad \
  -e GOOGLE_CLOUD_PROJECT=bitcoin-park-claude-code-ad
```

Call pattern (Gemini fallback only):
```bash
gemini -p "<instruction to call stitch tool with params>. Return only the raw JSON result." -o json --yolo 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['response'])"
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

All summits except IF live under **2C. SUMMITS**. IF lives under **3. IMAGINE IF**.

Non-summit routing: Nashville meetups → `1-2bXWOqiX3iDPei_vkDCfXrsIhF-TbSK`, Austin meetups → `10Is_LMlL-Mbum-9Q_9GwUnyGTlWuoRTg`, everything else → `1xvnBVITH-uOb90guBIuSj1a9t9reDWIi`.

## Step 2: Set Up Drive Folders

Shared drive ID: `0AEtADa_AopTlUk9PVA`. All `gws drive` calls need `supportsAllDrives: true`.

**Find the year folder** (e.g., "CTS26") inside the parent:

```bash
gws drive files list --params '{"q": "mimeType=\"application/vnd.google-apps.folder\" and name contains \"<PROJECT_CODE>\" and \"<PARENT_ID>\" in parents", "fields": "files(id,name)", "driveId": "0AEtADa_AopTlUk9PVA", "corpora": "drive", "includeItemsFromAllDrives": true, "supportsAllDrives": true}'
```

If it doesn't exist, **ask the user before creating it**. Then create with:

```bash
gws drive files create --json '{"name": "<PROJECT_CODE>", "mimeType": "application/vnd.google-apps.folder", "parents": ["<PARENT_ID>"]}' --params '{"supportsAllDrives": true}'
```

**Find or create the FINAL folder** inside the year folder:
- `<PROJECT_CODE>_GRAPHICS_FINAL` — approved designs

**Find or create the SPEC folder** inside the FINAL folder:
- `<PROJECT_CODE>_GRAPHICS_SPEC` — drafts (default upload target)

Search with the same `gws drive files list` pattern (query for `name contains "GRAPHICS_FINAL"` or `name contains "GRAPHICS_SPEC"`). Create any missing ones with `gws drive files create`. Note: the SPEC folder's parent is the FINAL folder, not the year folder.

## Step 3: Create Stitch Project & Design

**Create project** using `mcp__stitch__create_project` with a descriptive title like `<PROJECT_CODE> - <description>`.

Extract the numeric project ID from the `name` field (e.g., `projects/1234567890` → `1234567890`).

**Generate screen** using `mcp__stitch__generate_screen_from_text` with:
- `projectId`: the numeric ID
- `prompt`: detailed design prompt
- `deviceType`: `DESKTOP`, `MOBILE`, `TABLET`, or `AGNOSTIC`

Present `outputComponents` text/suggestions to the user.

**Edit existing screen** using `mcp__stitch__edit_screens` with:
- `projectId`: the numeric ID
- `selectedScreenIds`: array of screen IDs to edit
- `prompt`: description of changes

**Generate variants** using `mcp__stitch__generate_variants` for quick variations of existing screens.

## Step 4: Export to Google Drive

Export designs as **full-resolution PNGs** by rendering the HTML source, NOT by downloading the screenshot thumbnail.

**Get screen** using `mcp__stitch__get_screen` to retrieve the `htmlCode.downloadUrl` (the actual design source).

**Download HTML, render to full-res PNG, upload:**
```bash
# 1. Download the HTML source
curl -L -o /tmp/stitch_design.html "<HTMLCODE_DOWNLOAD_URL>"

# 2. Render to full-resolution PNG (1920x1080 @2x = 3840x2160 output)
cd ~/.claude/scripts && node stitch_render.mjs /tmp/stitch_design.html /tmp/stitch_design.png 1920 1080

# 3. Upload to Drive
gws drive files create --upload /tmp/stitch_design.png \
  --json '{"name": "<PROJECT_CODE>-<descriptive-name>.png", "parents": ["<SPEC_FOLDER_ID>"]}' \
  --params '{"supportsAllDrives": true}'
```

The render script lives at `~/.claude/scripts/stitch_render.mjs` with puppeteer installed locally. It uses Chrome to render the HTML at the specified viewport size with 2x device scale factor for retina-quality output. Default is 1920x1080 → 3840x2160 PNG.

For non-16:9 formats, adjust width/height: e.g., `1080 1080` for square, `1080 1920` for stories.

**Move to FINAL** when approved (move from SPEC up to its parent FINAL folder):
```bash
gws drive files update --params '{"fileId": "<FILE_ID>", "addParents": "<FINAL_FOLDER_ID>", "removeParents": "<SPEC_FOLDER_ID>", "supportsAllDrives": true}'
```

## Step 5: Confirm

Share with the user: Stitch URL (`https://stitch.withgoogle.com/projects/<PROJECT_ID>`), Drive folder location, and offer to create more designs or variations.
