---
description: "Design static graphic images for Bitcoin Park and Imagine IF summit projects using Stitch and save them to Google Drive. Use when the user wants to create event graphics, social media assets, banners, speaker cards, or any visual design for summits like NEMS, BT, GB, TEMS, IF, CTS, GBS, or PF."
---

# Stitch Graphic Design for Bitcoin Park & Imagine IF

## Step 0: Pre-Flight Checks

Before any Stitch operation, run these checks in order:

**1. Token freshness:**
```bash
gcloud auth application-default print-access-token 2>&1
```
- If success → proceed
- If failure → tell user: "Your gcloud token has expired. Please run: `gcloud auth application-default login`" and STOP.

**2. Quota config:**
```bash
cat ~/.stitch-mcp/config/configurations/config_default
```
- Must contain `project = bitcoin-park-claude-code-ad`
- If wrong or missing → overwrite the file:
  ```
  [core]
  project = bitcoin-park-claude-code-ad
  ```

**3. Stitch connection — determine which method to use:**
- **Primary (fastest):** If `mcp__stitch__*` tools are available in the session, use them for all Stitch calls.
- **Fallback (reliable):** If MCP tools are NOT available, use the CLI tool for all Stitch calls. The CLI requires a `STITCH_API_KEY` — ask the user for it if not already known in this session:
  ```bash
  STITCH_API_KEY="<ask user for key>" \
    npx @_davideast/stitch-mcp tool <tool_name> -d '<json_args>'
  ```
  Available CLI tools: `create_project`, `list_projects`, `list_screens`, `get_screen`, `generate_screen_from_text`, `edit_screens`, `generate_variants`, `get_project`.
- Pick one method at the start and use it consistently for the entire session. Do not mix methods.

**Mid-flow errors:** If any Stitch call fails (500, rate limit, timeout), surface the exact error to the user and ask whether to retry. Do not auto-retry.

## Video & Image Input (optional)

If the user provides a video (Loom URL, local MP4/MOV, remote URL) or image as a design brief, invoke `/videoanalysis` first. Requires `ffmpeg` and `yt-dlp` — if missing, ask the user to describe the design instead.

Treat the analysis output as the design brief. Extract layout, colors, text content, style cues, and any spoken/on-screen instructions, then feed those details into Step 4 (Prompt Enhancement) as the user intent.

## Step 1: Identify Summit & Brand

If not already specified, ask the user which summit. Project code = summit code + year suffix (e.g., CTS26, PFH26).

### Summit → Org Mapping

| Org | Summits |
|-----|---------|
| **Bitcoin Park** | NEMS, BT, GB, TEMS, CTS, GBS, PF{topic}{YY}, Nashville meetups, Austin meetups |
| **Imagine IF** | IF |

If the summit code starts with `PF`, it's a Park Forum event (Bitcoin Park brand).
If the summit code is `IF`, use Imagine IF brand.
If the user references `HB`, treat it as `PFH` (Park Forum: Health) — the HB code is deprecated.
Everything else uses Bitcoin Park brand.

### Bitcoin Park Brand Tokens

```
Colors:
  Primary:   Park Orange #FF9974, Dark Green #0A2B07, Park Purple #DABDFF
  Secondary: Coral #F27979, Muted Peach #FFC69C, Sage Green #9BCE9C
  Neutral:   Dark Grey #212121, White #FFFFFF

Typography:
  Headlines: Optima Extra Bold / Bold
  Body:      Source Sans Pro (Regular, Bold)

Style:
  - Flat vector and line-work illustrations
  - Color blocking with primary/secondary palette
  - Noise textures and subtle stylistic treatments
  - Sophisticated, minimalistic, straightforward
  - NO gradients (flat color only)
```

### Imagine IF Brand Tokens

```
Colors:
  Primary:   Sunrise Orange #e68158, Royal Purple #7958ed, Midnight Blue #070c70
  Accent:    Coral #ffc6c2, Light Purple #b683ed

Typography:
  Headlines: Rethink Sans Bold
  Body:      Rethink Sans Regular
  Special:   Cormorant Garamond Bold Italic (ONLY for "Imagine IF" phrase in hero moments)

Style:
  - Futuristic yet warm aesthetic
  - Clean, minimalist with moments of imaginative flair
  - Warm gradients on the orange-to-purple spectrum
  - Geometric, abstract illustrations (circles, arcs, lines)
  - High contrast between warm foreground and deep background
```

## Step 2: Determine Upload Folder

**IMPORTANT: Do NOT create new Drive folders.** The folder structure already exists.

**If the user provides a Drive folder URL or ID**, use that directly. Extract folder ID from URLs like `https://drive.google.com/drive/u/0/folders/<FOLDER_ID>`.

**If no URL is provided**, use the summit's parent folder ID:

| Code | Name | Drive Parent Folder ID |
|------|------|----------------------|
| NEMS | Nashville Energy and Mining Summit | `1lKma4acIwosjj2fTHSa3tAT4jkTlFV6Y` |
| BT | Bitcoin Takeover SXSW | `1BE5OJDcDOEdt30ppZPcwTFpKLCXEog89` |
| GB | Grassroots Bitcoin | `1scZCZBtLDg2qjmobdMlCSAPMv7iOMLSm` |
| TEMS | Texas Energy and Mining Summit | `1PvJsYEDNMfzo6NAnB5nYKNeDToWHui2h` |
| IF | Imagine IF | `1eXC2Zz933q3LJ-z992r3MSJElnMVBIno` |
| CTS | Bitcoin Custody & Treasury Summit | `1rYc0Mdu3ZGnNAvs4VB74ygKY4s0PK4L0` |
| GBS | Global Bitcoin Summit | `1vEG7f5NLs7GM6hziDo6phjZjw3O_qzMZ` |
| PF | Park Forum (all topics) | `1H3zhJOH_R-UagYz84Uub8eucTeO2veTf` |

All summits except IF live under **2C. SUMMITS**. IF lives under **3. IMAGINE IF**.

Non-summit routing: Nashville meetups → `1-2bXWOqiX3iDPei_vkDCfXrsIhF-TbSK`, Austin meetups → `10Is_LMlL-Mbum-9Q_9GwUnyGTlWuoRTg`, everything else → `1xvnBVITH-uOb90guBIuSj1a9t9reDWIi`.

**Folder structure:** GRAPHICS_SPEC is nested inside GRAPHICS_FINAL. To find the SPEC folder:

1. First find the summit's year folder (e.g., `PFH26`) inside the parent:
```bash
gws drive files list --params '{"q": "mimeType=\"application/vnd.google-apps.folder\" and name contains \"<SUMMIT_CODE>\" and \"<PARENT_FOLDER_ID>\" in parents", "fields": "files(id,name)", "driveId": "0AEtADa_AopTlUk9PVA", "corpora": "drive", "includeItemsFromAllDrives": true, "supportsAllDrives": true}'
```

2. Then find GRAPHICS_FINAL inside it:
```bash
gws drive files list --params '{"q": "mimeType=\"application/vnd.google-apps.folder\" and name contains \"GRAPHICS_FINAL\" and \"<SUMMIT_YEAR_FOLDER_ID>\" in parents", "fields": "files(id,name)", "driveId": "0AEtADa_AopTlUk9PVA", "corpora": "drive", "includeItemsFromAllDrives": true, "supportsAllDrives": true}'
```

3. Then find GRAPHICS_SPEC inside FINAL:
```bash
gws drive files list --params '{"q": "mimeType=\"application/vnd.google-apps.folder\" and name contains \"GRAPHICS_SPEC\" and \"<FINAL_FOLDER_ID>\" in parents", "fields": "files(id,name)", "driveId": "0AEtADa_AopTlUk9PVA", "corpora": "drive", "includeItemsFromAllDrives": true, "supportsAllDrives": true}'
```

If you cannot find the SPEC folder, **ask the user for the folder link**. Shared drive ID: `0AEtADa_AopTlUk9PVA`. All `gws drive` calls need `supportsAllDrives: true`.

## Step 3: Select Platform & Graphic Type

Ask the user which platform if not specified. Default to **LinkedIn post (landscape)** when unclear.

| Platform | Type | Viewport | Aspect | Layout Notes |
|----------|------|----------|--------|--------------|
| **Meetup** | Event cover | 1200×675 | 16:9 | Bold event name as focal point, date/location in bottom strip, summit logo prominent |
| **Zaprite** | Event/ticket page | 1200×675 | 16:9 | Event name as focal point, clean composition, works alongside ticket purchase context |
| **LinkedIn** | Post (landscape) | 1200×627 | 1.91:1 | Bold headline, minimal text, strong single visual — most versatile default |
| **LinkedIn** | Post (square) | 1080×1080 | 1:1 | Centered content, good for speaker spotlights and announcements |
| **LinkedIn** | Event cover | 1776×444 | 4:1 | Ultrawide — keep ALL text in center safe zone (1600×400), brand elements on flanks |
| **LinkedIn** | Article/newsletter | 1280×720 | 16:9 | Hero image style, supports longer headline treatment |
| **Custom** | User-specified | User-specified | Any | When user provides explicit dimensions, use those directly |

The render script (`stitch_render.mjs`) applies 2x device scale factor automatically. Pass the **Viewport** values above, NOT doubled values.

## Step 4: Enhance Prompt

Before generating, construct a structured prompt from three layers: brand tokens (Step 1) + platform recipe (Step 3) + user intent.

### Prompt Construction Process

1. **Select brand tokens** from Step 1 based on summit org
2. **Select recipe** from Step 3 based on platform
3. **Enhance user intent** — rephrase vague user language into precise graphic design terminology using the brand tokens. This is a general instruction, not a fixed lookup. Examples:
   - "nice background" → "textured color-blocked background using Park Orange #FF9974"
   - "add the logo" → "brand logo anchored top-right at 10% canvas height"
   - "make it pop" → "high-contrast focal headline in Optima Extra Bold"
4. **Assemble** using the template below
5. **Present the enhanced prompt** to user before generating (so they can adjust)

### Prompt Template

```
A static graphic image for [platform]. This is NOT a website or app screen.

[Org-specific atmosphere:
  BP: "Sophisticated, minimalistic Bitcoin community event graphic with flat color blocking and clean typography"
  IF: "Futuristic yet warm event graphic with geometric abstractions and orange-to-purple warmth"]

**BRAND SYSTEM:**
- Organization: [Bitcoin Park / Imagine IF]
- Primary Palette: [3 primary colors with hex and role]
- Accent Palette: [2-3 accent colors with hex]
- Headline Font: [font name + weight]
- Body Font: [font name]
- Style: [org-specific style directives]

**CANVAS:**
- Format: Static graphic image (NOT a webpage — no UI chrome)
- Platform: [Meetup / Zaprite / LinkedIn]
- Type: [Event cover / Post / Banner]
- Dimensions: [W × H pixels]

**COMPOSITION:**
- Focal point: [main headline or visual element]
- Supporting text: [date, location, tagline, speaker name]
- Logo space: Leave clear space in the top-left corner (~200x60px) with no text or imagery — the real logo will be composited in post-production. Do NOT attempt to draw or recreate the Bitcoin Park or Imagine IF logo.
- Negative space: [breathing room, balance]

**IMAGERY DIRECTION:**
[When the topic relates to a concrete subject — health, energy, mining, education, custody, etc. — include a relevant person, place, or thing as a visual element. Examples:]
- Health/medical topic → flat vector physician with stethoscope, patient silhouette, heartbeat line
- Energy/mining topic → power plant outline, mining rig silhouette, lightning bolt
- Finance/custody topic → vault door, key, shield
- General summit → audience silhouettes, stage/podium, Nashville skyline
[The illustration should be minimalistic flat vector in the org's style, conveying confidence and empowerment. Always include at least one human element when possible.]

**HARD CONSTRAINTS — DO NOT INCLUDE:**
- Navigation menus or menu bars
- Clickable buttons or CTAs styled as buttons
- Form inputs, search bars, or interactive elements
- Links, underlined text, or hover states
- Scrollable sections, cards with shadows, or web layout grids
- Browser chrome, status bars, or device frames
- Footer sections with sitemap links

Think of this as a **poster or print graphic**, not a webpage.
```

## Step 5: Generate via Stitch

Use whichever method was selected in Step 0 check 3 (MCP or CLI). Both produce identical output.

### If using MCP tools:

**Create project:** `mcp__stitch__create_project` with `title: "<SUMMIT_CODE> - <description>"`
**Generate screen:** `mcp__stitch__generate_screen_from_text` with `projectId`, `prompt`, `deviceType: "DESKTOP"`
**Edit screen:** `mcp__stitch__edit_screens` with `projectId`, `selectedScreenIds`, `prompt`
**Generate variants:** `mcp__stitch__generate_variants` with `projectId`, `screenId`

### If using CLI fallback:

```bash
# Create project
STITCH_API_KEY="$STITCH_API_KEY" \
  npx @_davideast/stitch-mcp tool create_project -d '{"title":"<SUMMIT_CODE> - <description>"}'

# Generate screen
STITCH_API_KEY="$STITCH_API_KEY" \
  npx @_davideast/stitch-mcp tool generate_screen_from_text -d '{
    "projectId": "<NUMERIC_ID>",
    "prompt": "<assembled prompt from Step 4>",
    "deviceType": "DESKTOP"
  }'

# Edit screen
STITCH_API_KEY="$STITCH_API_KEY" \
  npx @_davideast/stitch-mcp tool edit_screens -d '{
    "projectId": "<NUMERIC_ID>",
    "selectedScreenIds": ["<SCREEN_ID>"],
    "prompt": "edit description"
  }'

# Generate variants
STITCH_API_KEY="$STITCH_API_KEY" \
  npx @_davideast/stitch-mcp tool generate_variants -d '{
    "projectId": "<NUMERIC_ID>",
    "screenId": "<SCREEN_ID>"
  }'
```

### Response format (both methods):

Extract the numeric project ID from the `name` field (e.g., `projects/1234567890` → `1234567890`).

The generate response contains `outputComponents[1].design.screens[0]` with:
- `.name` — screen resource name (contains screen ID)
- `.htmlCode.downloadUrl` — URL to download the HTML source
- `.screenshot.downloadUrl` — low-res thumbnail (do NOT use for final export)

Always use `deviceType: "DESKTOP"` — gives full canvas. Actual dimensions come from the render step.

## Step 6: Export to Google Drive

Export as full-resolution PNG by rendering the HTML source (NOT the screenshot thumbnail).

**1. Download the HTML source** from `outputComponents[1].design.screens[0].htmlCode.downloadUrl`:

```bash
curl -L -o /tmp/stitch_design.html "<HTMLCODE_DOWNLOAD_URL>"
```

**2. Render to full-res PNG** using the Viewport dimensions from the platform recipe in Step 3 (the script applies 2x scaling internally):

```bash
cd ~/.claude/scripts && node stitch_render.mjs /tmp/stitch_design.html /tmp/stitch_design.png <VIEWPORT_WIDTH> <VIEWPORT_HEIGHT>
```

**3. Composite the real logo** — Stitch cannot accurately reproduce the BP or IF logo. Download the real logo from Drive and overlay it using Python/Pillow:

**Bitcoin Park logos** (folder `1vawahqhAe05ZUduiUMh2DKRKrI4oEe-h`):
- White primary logo (for dark backgrounds): `1uq6QQoEMTM1uvWfcOzykoIyL-QGqhUyL` (PNG @3x)
- Dark green primary logo (for light backgrounds): look in `primary logo/dark green/` subfolder `1uY9nt81XMnccRSyhEW2DPOlqKadAwj3u`
- Orange primary logo: look in `primary logo/orange/` subfolder `1ygx9wZYffMQ1kR3u1dc4NGQyRCnXsJw_`

**AI Freedom Lab logos** (folder `1AZxTYSv29F5uFkU28wPoV5-IkC4qbMP_`):
- White primary logo (for dark backgrounds): `1gOPZsRuoQgWcBIeyhdr0EyYwjI9JcFVK` (PNG @2x)
- Black primary logo (for light backgrounds): `1EgU_k6An1tGja2gSPOg2GZ-Ukg9n9jzp` (PNG @2x)
- Electric Cyan/blue primary logo: `1R90o05tLLRr4fMosDHvfKwWtQM685Ks8` (PNG @2x)
- Orange primary logo: `16Laz88zk_Xmu6HnIk7Hqsvzm8RejCesS` (PNG @2x)

**Imagine IF logos** (folder `1XTb9f_pxdxCCNydfqQ8AMTvpOctLbg_L`):
- Primary logo on dark (white text): `10S5jUGsbX9NO3Puw6qIIEFCL-TwS2m0v` (JPG @2x)
- Primary logo on light (color text): `1DUwYnr1QYeV-uflXXG5G-LXqXzHMBMNF` (JPG @2x)
- Brandmark icon (purple): `1D9y12rHnMa3vPpBt5-Mf1NMtJ-qoc_uz` (PNG @2x)
- Header graphics available: `imagine-if-header-01` through `06` in same folder

```bash
# Download the logo (pick color based on background)
gws drive files get --params '{"fileId": "<LOGO_FILE_ID>", "supportsAllDrives": true, "alt": "media"}' -o /tmp/bp_logo.png
```

```python
from PIL import Image
design = Image.open("/tmp/stitch_design.png")
logo = Image.open("/tmp/bp_logo.png")
# Scale logo to ~380px wide at 2x render
ratio = 380 / logo.width
logo_resized = logo.resize((int(logo.width * ratio), int(logo.height * ratio)), Image.LANCZOS)
# Position top-left with padding
design.paste(logo_resized, (60, 50), logo_resized if logo_resized.mode == 'RGBA' else None)
design.save("/tmp/stitch_design_final.png")
```

**4. Upload to the target folder** from Step 2:

```bash
gws drive files create --upload /tmp/stitch_design_final.png \
  --json '{"name": "<SUMMIT_CODE>-<platform>-<descriptive-name>.png", "parents": ["<TARGET_FOLDER_ID>"]}' \
  --params '{"supportsAllDrives": true}'
```

File naming: `<SUMMIT_CODE>-<platform>-<description>.png` (e.g., `TEMS26-linkedin-post-announce.png`, `IF27-meetup-event-cover.png`).

## Step 7: Confirm

Share with the user:
- Stitch project URL: `https://stitch.withgoogle.com/projects/<PROJECT_ID>`
- Drive folder location
- Offer to create more designs, variations, or edits

**Move to FINAL when approved:**

```bash
gws drive files update --params '{"fileId": "<FILE_ID>", "addParents": "<FINAL_FOLDER_ID>", "removeParents": "<SPEC_FOLDER_ID>", "supportsAllDrives": true}'
```
