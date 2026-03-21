---
description: "Analyse video and image content using ffmpeg frame extraction and AI vision. Handles Loom URLs, local MP4/MOV files, Riverside exports, and static graphics (PNG/JPG/PDF). Use when someone provides a video file, video URL, or image and wants to understand its visual content."
---

# Video & Graphics Analyser

Analyse video files, video URLs, and static graphics by extracting frames with ffmpeg and delegating vision analysis to sub-agents. Produces structured timestamped summaries while preserving the main context window.

## Prerequisites

Before starting, verify the required tools are installed:

```bash
which ffmpeg && which ffprobe && which yt-dlp
```

If any are missing:
- **ffmpeg/ffprobe**: `brew install ffmpeg` (macOS) or `sudo apt install ffmpeg` (Linux)
- **yt-dlp**: `pip3 install yt-dlp` or `brew install yt-dlp`

If prerequisites are missing, show install commands and STOP.

## Supported Inputs

| Input Type | Examples | Handling |
|-----------|----------|----------|
| **Local video** | `.mp4`, `.mov`, `.mkv`, `.webm`, `.avi` | Direct ffmpeg processing |
| **Loom URL** | `loom.com/share/...` | Download via `yt-dlp` or Loom API, then process |
| **Riverside export** | `.mp4` from Riverside | Direct ffmpeg processing (same as local) |
| **Image/graphic** | `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.pdf` | Read directly with vision — no ffmpeg needed |
| **Remote URL** | Direct video file URLs | Download with `curl`, then process |

## Architecture: Context-Efficient Sub-Agent Pipeline

**Problem**: Reading dozens of images into the main conversation consumes most of the context window, leaving no room for synthesis.

**Solution**: A 3-phase pipeline where images never enter the main context:

```
Main Agent                          Sub-Agents (disposable context)
──────────                          ──────────────────────────────
1. Acquire video (download if URL)
2. ffprobe metadata
3. ffmpeg frame extraction
4. Split frames into batches ──►   5. Read frame images (vision)
                                      Write text descriptions
                                      to batch_N_analysis.md
6. Read text files only    ◄───    (sub-agent context discarded)
7. Synthesise final output
```

Images only exist inside sub-agent contexts. The main agent reads lightweight text files. This cuts context usage by ~90%.

## Phase 1: Acquire the Video

### Local files
Verify the file exists and has a video stream:
```bash
test -f "VIDEO_PATH" && ffprobe -v quiet -select_streams v -show_entries stream=codec_type -of csv=p=0 "VIDEO_PATH"
```

### Loom URLs
Loom videos require download first. Try these approaches in order:

**Option A — yt-dlp (preferred):**
```bash
which yt-dlp >/dev/null 2>&1 || pip3 install yt-dlp
yt-dlp -o "$TMPDIR/loom_video.mp4" "LOOM_URL"
```

**Option B — Loom direct download URL:**
Loom share URLs (`loom.com/share/VIDEO_ID`) sometimes expose a direct download. Extract the video ID and try:
```bash
LOOM_ID=$(echo "LOOM_URL" | grep -oE '[a-f0-9]{32}')
curl -L -o "$TMPDIR/loom_video.mp4" "https://www.loom.com/share/$LOOM_ID/download"
```

**Option C — Ask user to export:**
If both fail, ask the user to download the Loom video manually and provide the local file path.

### Remote video URLs
```bash
curl -L -o "$TMPDIR/remote_video.mp4" "VIDEO_URL"
```

### Static images/graphics
Skip all ffmpeg steps. Jump directly to Phase 5 — read the image file with a sub-agent (or directly if only 1-3 images), describe it, and output the analysis.

For images, the output format is:

```markdown
# Image Analysis: [filename]

## Metadata
| Property | Value |
|----------|-------|
| Dimensions | WxH |
| Format | PNG/JPG/etc |
| File Size | N KB/MB |

## Description
[Detailed description of the visual content]

## Text Content
[Any text, labels, or copy visible in the image]

## Design Notes
[Layout, color palette, typography, style observations]
```

## Phase 2: Extract Metadata

```bash
ffprobe -v quiet -print_format json -show_format -show_streams "VIDEO_PATH"
```

Extract and report: duration, resolution (width x height), fps, codec, file size, audio presence.

**Guard rails:**
- No video stream → report "audio-only file" and STOP
- File > 2GB → warn user, suggest analysing a time range with `-ss START -to END`
- Duration > 60min → warn user, suggest a time range or accept that analysis will be high-level

## Phase 3: Extract Frames

Create temp directory:
```bash
TMPDIR="/tmp/video-analysis-$(date +%s)"
mkdir -p "$TMPDIR"
```

Choose strategy based on duration:

| Duration | Strategy | Command |
|----------|----------|---------|
| 0-60s | 1 frame/2s | `ffmpeg -hide_banner -y -i INPUT -vf "fps=1/2,scale='min(1280,iw)':-2" -q:v 5 $TMPDIR/frame_%04d.jpg` |
| 1-10min | Scene detection (0.3) | `ffmpeg -hide_banner -y -i INPUT -vf "select='gt(scene,0.3)',scale='min(1280,iw)':-2" -vsync vfr -q:v 5 $TMPDIR/scene_%04d.jpg` |
| 10-30min | Keyframes | `ffmpeg -hide_banner -y -skip_frame nokey -i INPUT -vf "scale='min(1280,iw)':-2" -vsync vfr -q:v 5 $TMPDIR/key_%04d.jpg` |
| 30min+ | Thumbnail filter | `ffmpeg -hide_banner -y -i INPUT -vf "thumbnail=SEGMENT_FRAMES,scale='min(1280,iw)':-2" -vsync vfr -q:v 5 $TMPDIR/thumb_%04d.jpg` |

For thumbnail filter: `SEGMENT_FRAMES = total_frames / 60` (caps at ~60 frames).

**Fallbacks:**
- Scene detection yields 0 frames → retry with 1 frame/5s interval
- More than 100 frames → subsample evenly to 80
- Extraction fails → try next simpler strategy

**Time range**: When user specifies a range, prepend `-ss START -to END` before `-i`.
**Higher detail**: Double fps rate, lower scene threshold to 0.2.

After extraction, list frames and calculate timestamps from sequence number + extraction rate.

## Phase 4: Batch and Delegate to Sub-Agents

Split extracted frames into batches of 8-10. For each batch, spawn a sub-agent using the `Agent` tool.

**Launch ALL batches in parallel** — they are fully independent.

### Sub-Agent Prompt

Use this prompt for each batch, filling in the placeholders:

```
You are analysing frames extracted from a video file. Read each frame image using the Read tool, then write a structured analysis.

VIDEO: {filename}
DURATION: {duration}
BATCH: {batch_number} of {total_batches}

Read each frame below with the Read tool:
{for each frame}
- {absolute_path} (timestamp: {MM:SS})
{end for}

For each frame, describe:
1. **Scene**: What is visible (layout, UI, environment, people)
2. **Content**: Text, code, labels, menus, dialogue on screen
3. **Action**: What is happening or changed vs the likely previous frame
4. **Details**: Notable specifics (error messages, URLs, file names, button states, speaker names)

After all frames, add a BATCH SUMMARY:
- Content type: Screencast | Presentation | Tutorial | Footage | Animation | Design Review | Other
- Key events in this time range
- Any text/commands/prompts visible (quote exactly)

Write the complete analysis to: {TMPDIR}/batch_{N}_analysis.md

Format:

# Batch {N} Analysis ({start_time} - {end_time})

## Frame-by-Frame

### Frame {seq} ({timestamp})
- **Scene**: ...
- **Content**: ...
- **Action**: ...
- **Details**: ...

## Batch Summary
- **Content Type**: ...
- **Key Events**: ...
- **Quoted Text**: ...
```

### Fallback

If sub-agents are unavailable, read frames directly in the main context but limit to **20 frames max** and warn about context usage.

## Phase 5: Collect and Synthesise

Read all `batch_N_analysis.md` files **in order**:
```bash
ls $TMPDIR/batch_*_analysis.md
```

Synthesise into the final output:

1. Merge frame descriptions chronologically
2. Group into natural segments (same scene/slide/screen)
3. Detect dominant content type across batches
4. Identify 3-7 key moments
5. Extract all quoted text, commands, or prompts
6. Write 2-5 sentence narrative summary

### Output Format

```markdown
# Video Analysis: [filename]

## Metadata
| Property | Value |
|----------|-------|
| Duration | M:SS |
| Resolution | WxH |
| FPS | N |
| Content Type | [detected] |
| Frames Analysed | N |

## Timeline

### [Segment Title] (M:SS - M:SS)
Description of what happens in this segment.

### [Segment Title] (M:SS - M:SS)
Description of what happens in this segment.

## Key Moments
1. **[M:SS] Title**: Description
2. **[M:SS] Title**: Description
3. **[M:SS] Title**: Description

## Quoted Text & Commands
> exact text or commands visible in the video

## Summary
[2-5 sentence narrative summarising the entire video]
```

## Phase 6: Cleanup

```bash
rm -rf "$TMPDIR"
```

Skip cleanup if the user asks to keep frames or if you need them for follow-up work.

## Advanced Options

| Request | Handling |
|---------|----------|
| "Analyse 2:00 to 5:00" | Use `-ss 120 -to 300` in ffmpeg |
| "High detail" | Double frame rate, lower scene threshold to 0.2 |
| "Focus on the code/text" | Emphasise text extraction in sub-agent prompts |
| "Generate a sprite sheet" | `ffmpeg -hide_banner -y -i INPUT -vf "select='not(mod(n,EVERY_N))',scale='min(320,iw)':-2,tile=5xROWS" -frames:v 1 $TMPDIR/sprite.jpg` |
| "Compare these graphics" | Read all images, describe each, then produce a comparison table |
| "What does this design show?" | Single image analysis — skip ffmpeg, use direct vision |

## Error Handling

| Issue | Action |
|-------|--------|
| ffmpeg not installed | Show `brew install ffmpeg` and STOP |
| yt-dlp not installed (for Loom) | Attempt `pip3 install yt-dlp`, or ask user to download manually |
| No video stream | Report audio-only, STOP |
| Scene detection yields 0 frames | Fallback to interval extraction |
| >100 frames | Subsample to 80 |
| >2GB file | Warn, suggest time range |
| Loom download fails | Try alternative download method, then ask user for local file |
| Sub-agent timeout | Read that batch directly as fallback, warn about context |
| Corrupt/unreadable frame | Skip frame, note gap in analysis |
