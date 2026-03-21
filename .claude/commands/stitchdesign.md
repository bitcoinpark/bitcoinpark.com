---
description: "Design graphics for Bitcoin Park summit projects using Stitch and save them to Google Drive. Use when the user wants to create event graphics, social media assets, banners, speaker cards, or any visual design for summits like NEMS, BT, GB, TEMS, IF, CTS, or GBS."
---

# Stitch Design for Bitcoin Park Summits

## Prerequisites

Verify before starting: `gws --help`, `gemini --version`, `gcloud auth list`. All three must work.

## Calling Stitch via Gemini CLI

All Stitch operations use Gemini CLI headless mode. Verify `gemini mcp list` shows `stitch`. If missing:

```bash
gemini mcp add stitch npx @_davideast/stitch-mcp proxy \
  --scope user --trust \
  -e GOOGLE_APPLICATION_CREDENTIALS=/Users/andrewdavis/.config/gcloud/application_default_credentials.json \
  -e CLOUDSDK_CONFIG=/Users/andrewdavis/.config/gcloud \
  -e HOME=/Users/andrewdavis \
  -e "PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
  -e STITCH_PROJECT_ID=bitcoin-park-claude-code-ad \
  -e GOOGLE_CLOUD_PROJECT=bitcoin-park-claude-code-ad
```

**Call pattern** — every Stitch tool call uses this:

```bash
gemini -p "<instruction to call stitch tool with params>. Return only the raw JSON result." -o json --yolo 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['response'])"
```

First call may be slow (~30s, MCP cold start). Do NOT retry — just wait.

**Quota errors?** Re-add the MCP server with correct env vars above, and set `~/.stitch-mcp/config/configurations/config_default` to `[core]\nproject = bitcoin-park-claude-code-ad`.

## Video & Image Input

If the user provides a video (Loom URL, local MP4/MOV, remote URL) or image, invoke `/videoanalysis` first. The video describes what the final graphic should look like — treat the analysis output as the design brief. Extract layout, colors, text content, style cues, and any spoken/on-screen instructions, then use those details directly as the Stitch design prompt in Step 3.

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

**Find or create two subfolders** inside the year folder:
- `SPEC - [<PROJECT_CODE>] STITCH CREATIVES AND GRAPHICS` — drafts (default upload target)
- `FINAL - [<PROJECT_CODE>] STITCH CREATIVES AND GRAPHICS` — approved designs

Search with the same `gws drive files list` pattern (query for `name contains "STITCH CREATIVES AND GRAPHICS"`). Create any missing ones with `gws drive files create`.

## Step 3: Create Stitch Project & Design

**Create project:**
```
stitch create_project with title '<PROJECT_CODE> - <description>'
```
Extract the numeric project ID from the `name` field (e.g., `projects/1234567890` → `1234567890`).

**Generate screen:**
```
stitch generate_screen_from_text with projectId '<ID>', prompt '<design prompt>', deviceType '<DESKTOP|MOBILE|TABLET|AGNOSTIC>'
```
Add `modelId 'GEMINI_3_1_PRO'` for highest quality, `'GEMINI_3_FLASH'` for speed.

Present `outputComponents` text/suggestions to the user.

**Edit existing screen:**
```
stitch edit_screens with projectId '<ID>', selectedScreenIds ['<SCREEN_ID>'], prompt '<changes>'
```

## Step 4: Export to Google Drive

**Get screen** to retrieve the image URL:
```
stitch get_screen with projectId '<ID>', screenId '<SCREEN_ID>', name 'projects/<ID>/screens/<SCREEN_ID>'
```

**Download and upload:**
```bash
curl -L -o /tmp/stitch_design.png "<IMAGE_URL>"
gws drive files create --upload /tmp/stitch_design.png \
  --json '{"name": "<PROJECT_CODE>-<descriptive-name>.png", "parents": ["<SPEC_FOLDER_ID>"]}' \
  --params '{"supportsAllDrives": true}'
```

**Move to FINAL** when approved:
```bash
gws drive files update --params '{"fileId": "<FILE_ID>", "addParents": "<FINAL_FOLDER_ID>", "removeParents": "<SPEC_FOLDER_ID>", "supportsAllDrives": true}'
```

## Step 5: Confirm

Share with the user: Stitch URL (`https://stitch.withgoogle.com/projects/<PROJECT_ID>`), Drive folder location, and offer to create more designs or variations.
