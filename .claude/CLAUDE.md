# Bitcoin Park — Claude Code Setup

## Dependencies

The skills in this repo require the following tools. Install everything before using `/stitchdesign` or `/videoanalysis`.

### Core tools

```bash
# Google Workspace CLI (Drive operations)
# Install: https://github.com/nicholasgasior/gws
go install github.com/nicholasgasior/gws@latest

# gcloud CLI (authentication)
# Install: https://cloud.google.com/sdk/docs/install
gcloud auth login andrew@bitcoinpark.com
gcloud auth application-default login
gcloud auth application-default set-quota-project bitcoin-park-claude-code-ad
```

### Gemini CLI (Stitch design generation)

```bash
npm install -g @google/gemini-cli

# First run — authenticates via OAuth:
gemini

# Add the Stitch MCP server:
gemini mcp add stitch npx @_davideast/stitch-mcp proxy \
  --scope user --trust \
  -e GOOGLE_APPLICATION_CREDENTIALS=$HOME/.config/gcloud/application_default_credentials.json \
  -e CLOUDSDK_CONFIG=$HOME/.config/gcloud \
  -e HOME=$HOME \
  -e "PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
  -e STITCH_PROJECT_ID=bitcoin-park-claude-code-ad \
  -e GOOGLE_CLOUD_PROJECT=bitcoin-park-claude-code-ad

# Verify:
gemini mcp list   # should show "stitch"
```

### Video analysis tools

```bash
brew install ffmpeg      # frame extraction + ffprobe
pip3 install yt-dlp      # Loom/YouTube video downloads
```

## Verify everything works

```bash
gws --help               # Google Workspace CLI
gemini --version          # Gemini CLI
gcloud auth list          # gcloud authenticated
ffmpeg -version           # ffmpeg installed
yt-dlp --version          # yt-dlp installed
gemini mcp list           # Stitch MCP registered
```
