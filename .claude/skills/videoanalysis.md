---
description: "Analyse video and image content using ffmpeg frame extraction and AI vision. Handles Loom URLs, local MP4/MOV files, Riverside exports, and static graphics."
---

# Video & Graphics Analyser

## For images/graphics
Read the file directly with the Read tool. Describe what you see.

## For videos

### Step 1: Get the video file
- **Local file**: Use as-is
- **Loom URL**: `yt-dlp -o "/tmp/video-analysis/video.mp4" "URL"`
- **Remote URL**: `curl -L -o "/tmp/video-analysis/video.mp4" "URL"`

If yt-dlp is missing: `pip3 install yt-dlp`
If ffmpeg is missing: `brew install ffmpeg`

### Step 2: Get metadata
```bash
ffprobe -v quiet -print_format json -show_format -show_streams "VIDEO_PATH"
```

### Step 3: Extract frames
```bash
TMPDIR="/tmp/video-analysis-$(date +%s)"
mkdir -p "$TMPDIR"
```

Pick strategy by duration:
- **Under 1min**: `ffmpeg -hide_banner -y -i INPUT -vf "fps=1/2,scale='min(1280,iw)':-2" -q:v 5 $TMPDIR/frame_%04d.jpg`
- **1-10min**: `ffmpeg -hide_banner -y -i INPUT -vf "select='gt(scene,0.3)',scale='min(1280,iw)':-2" -vsync vfr -q:v 5 $TMPDIR/scene_%04d.jpg`
- **10min+**: `ffmpeg -hide_banner -y -skip_frame nokey -i INPUT -vf "scale='min(1280,iw)':-2" -vsync vfr -q:v 5 $TMPDIR/key_%04d.jpg`

If scene detection gives 0 frames, fall back to 1 frame every 5 seconds. Cap at 80 frames max.

### Step 4: Analyse frames with sub-agents

Split frames into batches of 8-10. Launch parallel Agent sub-agents, each with this prompt:

```
Read each frame image with the Read tool and describe what you see.

FRAMES:
- {path} (timestamp: {MM:SS})
...

For each frame write:
- **Scene**: What is visible
- **Content**: Any text, code, labels on screen
- **Action**: What changed vs previous frame

Write your analysis to: {TMPDIR}/batch_{N}_analysis.md
```

**Key rule**: Never read frame images in the main context. Only sub-agents read images. Main agent only reads the text analysis files they produce.

### Step 5: Synthesise
Read all `batch_*_analysis.md` files. Combine into a timeline with key moments and a summary.

### Step 6: Cleanup
```bash
rm -rf "$TMPDIR"
```
