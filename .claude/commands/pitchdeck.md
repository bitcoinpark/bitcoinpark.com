---
description: "Create branded Google Slides pitch decks for Bitcoin Park, AI Freedom Lab, and Imagine IF — grant applications, sponsor proposals, partner presentations, and fundraising decks. Use when the user says /pitchdeck, asks to create a slide deck, pitch deck, grant presentation, sponsor deck, or partner proposal for BP, AFL, or IF. Also trigger for 'create slides for [foundation/sponsor]', 'build a deck for [audience]', 'make a presentation about Bitcoin Park', or any request to create a multi-slide Google Slides presentation that tells the BP/AFL/IF story to an external audience."
---

# Pitch Deck Builder — Bitcoin Park, AI Freedom Lab & Imagine IF

This skill creates polished, brand-correct Google Slides presentations that tell a story to external audiences — foundations, sponsors, partners, and potential collaborators. Every deck follows a narrative arc, not a feature list.

## Required Inputs

Ask the user if not provided:
1. **Audience** — Who is this for? (e.g., "The Reynolds Foundation Freedom Accelerator", "a potential corporate sponsor", "HRF")
2. **Primary subject** — Which orgs to feature? (BP only, AFL only, BP + AFL, BP + AFL + IF, etc.)
3. **Specific ask** — What grant program, sponsorship tier, or partnership? (e.g., "Freedom Accelerator grant", "TEMS27 title sponsor")
4. **Any existing materials** — LOI, one-pager, or Google Doc to draw from?

## Step 1: Load Brand Guidelines

Invoke the `/bpbrand` skill before doing anything else. This loads the full visual identity for Bitcoin Park, AI Freedom Lab, and Imagine IF — colors, fonts, voice, and usage rules. You need this context to build brand-correct slides.

## Step 2: Research the Audience

Use WebFetch to pull the audience's website, mission page, and any program-specific pages. Extract:
- Their exact language and terminology (mirror it in the deck)
- What they fund and why
- Their theory of change
- Any stats or frameworks they reference
- Names of leadership to address

If their site is Wix/JS-heavy and doesn't render, fall back to WebSearch for press coverage, interviews, and third-party descriptions.

## Step 3: Discover Logo Assets

Search Google Drive for approved brand logos. Use the `gws` CLI:

```bash
GWS=/Users/andrewdavis/.npm-global/bin/gws

# Bitcoin Park logos
$GWS drive files list --params '{"q":"name contains '\''bitcoinpark_primarylogo_white'\'' and mimeType='\''image/png'\''","pageSize":5,"fields":"files(id,name)"}' 2>/dev/null

# Bitcoin Park brandmark
$GWS drive files list --params '{"q":"name contains '\''bitcoinpark_brandmark_white'\'' and mimeType='\''image/png'\''","pageSize":5,"fields":"files(id,name)"}' 2>/dev/null

# Imagine IF logos
$GWS drive files list --params '{"q":"name contains '\''ImagineIf-PrimaryLogo-white'\'' and mimeType='\''image/png'\''","pageSize":5,"fields":"files(id,name)"}' 2>/dev/null
```

Prefer @2x or @3x PNGs for resolution. Store the file IDs for later insertion.

## Step 4: Build the Deck

### Story Structure

Every pitch deck follows this narrative arc. Not every slide is required — adapt based on context, but the order matters because it builds emotional momentum:

| Slide | Section | Purpose | Typical Background |
|-------|---------|---------|-------------------|
| 1 | **Title** | Bold headline + org names + who it's for + date | AFL Deep Black (#171C1E) |
| 2 | **The Moment** (Why Now) | Market forces, urgency, stats that create tension | BP Dark Green (#0A2B07) |
| 3 | **The Gap** (Challenges) | The pain the audience cares about, what's missing | AFL Deep Black (#171C1E) |
| 4 | **The Unlock** (Vision) | The world we're building, the dream | AFL Warm White (#F7F5F0) |
| 5 | **The Bridge** (Solution) | BP + AFL as two orgs, one mission | BP Dark Green (#0A2B07) |
| 6 | **The Convergence** (optional) | Imagine IF as summit of summits — Bitcoin + AI + Energy | IF Midnight Blue (#070C70) |
| 7 | **Why Believe** (Proof) | Stats, receipts, AI Hack for Freedom results | AFL Deep Black (#171C1E) |
| 8 | **The Path** (Next Steps) | What funding/partnership unlocks, specific asks | AFL Warm White (#F7F5F0) |
| 9 | **Close** | Tagline + contact info | BP Dark Green (#0A2B07) |

**Visual rhythm:** Alternate dark and light backgrounds. This creates breathing room and keeps the audience engaged.

### Brand System Per Slide

**Bitcoin Park slides** (The Moment, The Bridge, Close):
- Background: Dark Green #0A2B07 (rgb: 0.039, 0.169, 0.027)
- Accent bar: Electric Cyan #00E5FF (rgb: 0, 0.898, 1)
- Headlines: Hanken Grotesk Bold, Warm White #F7F5F0 (rgb: 0.969, 0.961, 0.941)
- Body: Inter Regular, light gray (rgb: 0.8, 0.8, 0.8)
- Accent text: Park Orange #FF9974 (rgb: 1, 0.6, 0.455)
- Section label: Electric Cyan

**AI Freedom Lab slides** (Title, The Gap, Why Believe):
- Background: Deep Black #171C1E (rgb: 0.09, 0.11, 0.118)
- Accent bar: Electric Cyan #00E5FF
- Headlines: Hanken Grotesk Bold, Warm White
- Body: Inter Regular, light gray
- Stat accents: Electric Cyan and Park Orange alternating
- Section label: Electric Cyan

**Light slides** (The Unlock, The Path):
- Background: Warm White #F7F5F0 (rgb: 0.969, 0.961, 0.941)
- Accent bar: Park Orange #FF9974 (rgb: 1, 0.6, 0.455)
- Headlines: Hanken Grotesk Bold, Deep Black #171C1E (rgb: 0.09, 0.11, 0.118)
- Body: Inter Regular, dark gray (rgb: 0.2-0.3)
- Section label: BP Dark Green #0A2B07

**Imagine IF slides** (The Convergence):
- Background: Midnight Blue #070C70 (rgb: 0.027, 0.047, 0.439)
- Accent bar primary: Sunrise Orange #E68158 (rgb: 0.902, 0.506, 0.345)
- Accent bar secondary: Royal Purple #7958ED (rgb: 0.475, 0.345, 0.929)
- Headlines: Rethink Sans Bold, White
- "Imagine IF" hero text: Cormorant Garamond Bold Italic, Sunrise Orange
- Body: Rethink Sans Regular, light blue-white (rgb: 0.8, 0.8, 0.85)
- Italic accent: Light Purple #B683ED (rgb: 0.714, 0.514, 0.929)
- Coral accent: #FFC6C2 (rgb: 1, 0.776, 0.753)

**Every slide** gets a thin accent bar at the top (80000 EMU height) in the slide's primary accent color. **Never blend** org palettes on the same slide.

### Voice

All narrative text uses Rod's voice — see `/bpbrand` for full details. The short version:
- Warm, specific, concise, optimistic
- No em-dashes. No AI writing tells. No corporate buzzwords.
- Specific numbers beat vague claims ("3,000+ members" not "a large community")
- Short punchy sentences mixed with longer flowing ones
- Closings invite collaboration, never talk at the audience

---

## Google Slides API Reference

All operations use `gws` at `/Users/andrewdavis/.npm-global/bin/gws` (authenticated as andrew@bitcoinpark.com).

### Create a Presentation

```bash
$GWS slides presentations create --json '{"title":"My Title"}' 2>/dev/null | grep '"presentationId"'
```

### Create Slides and Set Backgrounds

Create multiple slides in one batch with unique objectIds, then set backgrounds in the same request:

```json
{
  "requests": [
    { "createSlide": { "objectId": "slide_whynow", "insertionIndex": 1 } },
    {
      "updatePageProperties": {
        "objectId": "slide_whynow",
        "pageProperties": {
          "pageBackgroundFill": {
            "solidFill": { "color": { "rgbColor": { "red": 0.039, "green": 0.169, "blue": 0.027 } } }
          }
        },
        "fields": "pageBackgroundFill"
      }
    }
  ]
}
```

RGB values are 0-1 floats (divide hex channel by 255). The default slide (index 0) has objectId `"p"`.

### Add Text (Three-Step Process)

Create text box, insert text, style text:

```json
[
  {
    "createShape": {
      "objectId": "s2_title",
      "shapeType": "TEXT_BOX",
      "elementProperties": {
        "pageObjectId": "slide_whynow",
        "size": { "width": { "magnitude": 7800000, "unit": "EMU" }, "height": { "magnitude": 900000, "unit": "EMU" } },
        "transform": { "scaleX": 1, "scaleY": 1, "translateX": 600000, "translateY": 650000, "unit": "EMU" }
      }
    }
  },
  { "insertText": { "objectId": "s2_title", "text": "Your headline" } },
  {
    "updateTextStyle": {
      "objectId": "s2_title",
      "textRange": { "type": "ALL" },
      "style": {
        "fontFamily": "Hanken Grotesk",
        "fontSize": { "magnitude": 28, "unit": "PT" },
        "bold": true,
        "foregroundColor": { "opaqueColor": { "rgbColor": { "red": 0.969, "green": 0.961, "blue": 0.941 } } }
      },
      "fields": "fontFamily,fontSize,bold,foregroundColor"
    }
  }
]
```

For sub-ranges, use `"type": "FIXED_RANGE"` with `startIndex` and `endIndex`.

### CRITICAL: Pre-Calculate Text Lengths

The #1 source of API errors. `FIXED_RANGE` endIndex must not exceed text length. Always calculate first:

```bash
python3 -c "
text = 'Your exact text here'
print('Total length:', len(text))
print('Title ends at:', text.index('\n'))
"
```

Calculate ALL lengths in one python3 call before constructing the API request.

### Accent Bars

Thin colored rectangle at top of every slide:

```json
[
  {
    "createShape": {
      "objectId": "s2_bar",
      "shapeType": "RECTANGLE",
      "elementProperties": {
        "pageObjectId": "slide_id",
        "size": { "width": { "magnitude": 9144000, "unit": "EMU" }, "height": { "magnitude": 80000, "unit": "EMU" } },
        "transform": { "scaleX": 1, "scaleY": 1, "translateX": 0, "translateY": 0, "unit": "EMU" }
      }
    }
  },
  {
    "updateShapeProperties": {
      "objectId": "s2_bar",
      "shapeProperties": {
        "shapeBackgroundFill": { "solidFill": { "color": { "rgbColor": { "red": 0, "green": 0.898, "blue": 1 } } } },
        "outline": { "propertyState": "NOT_RENDERED" }
      },
      "fields": "shapeBackgroundFill,outline"
    }
  }
]
```

Use `"outline": { "propertyState": "NOT_RENDERED" }` to hide outlines. Do NOT set weight to 0 (causes 400 error).

### Shapes and Cards

`ROUND_RECTANGLE` with alpha for transparency:

```json
{
  "shapeBackgroundFill": { "solidFill": { "color": { "rgbColor": { ... } }, "alpha": 0.5 } },
  "outline": { "outlineFill": { "solidFill": { "color": { "rgbColor": { ... } } } }, "weight": { "magnitude": 1.5, "unit": "PT" } }
}
```

### Arrows

`RIGHT_ARROW` shape. For left-pointing, use `"scaleX": -1` in transform.

### Images from Drive

Three-step: make public, insert, revoke.

```bash
# 1. Make temporarily public
$GWS drive permissions create --params '{"fileId":"FILE_ID"}' --json '{"role":"reader","type":"anyone"}'

# 2. Insert
# URL: https://drive.google.com/uc?export=download&id=FILE_ID
$GWS slides presentations batchUpdate --params '{"presentationId":"PRES_ID"}' --json '{"requests":[{"createImage":{"objectId":"logo","url":"https://drive.google.com/uc?export=download&id=FILE_ID","elementProperties":{"pageObjectId":"slide_id","size":{"width":{"magnitude":1800000,"unit":"EMU"},"height":{"magnitude":1200000,"unit":"EMU"}},"transform":{"scaleX":0.5,"scaleY":0.5,"translateX":7000000,"translateY":300000,"unit":"EMU"}}}}]}'

# 3. Revoke immediately
$GWS drive permissions delete --params '{"fileId":"FILE_ID","permissionId":"anyoneWithLink"}'
```

### Delete Default Placeholders

```bash
$GWS slides presentations get --params '{"presentationId":"PRES_ID"}' 2>/dev/null | python3 -c "
import sys,json
raw = sys.stdin.read()
data = json.loads(raw[raw.index('{'):])
for slide in data.get('slides', []):
    for e in slide.get('pageElements', []):
        if 'shape' in e and 'placeholder' in e['shape']:
            print(e['objectId'])
"
# Then deleteObject for each (typically i0 and i1)
```

### EMU Reference

- 914400 EMU = 1 inch. Standard slide: 9144000 x 5143500 EMU (10" x 5.625")
- Margins: 600000 EMU from edges
- Accent bar height: 80000 EMU

| Position | translateX | translateY |
|----------|-----------|-----------|
| Section label | 600000 | 300000 |
| Headline | 600000 | 650000 |
| Body start | 600000 | 1500000-1900000 |
| Bottom text | 600000 | 4300000-4600000 |
| Full width | 600000 (width: 7800000) | varies |
| Left column | 600000 (width: 3600000) | varies |
| Right column | 4800000 (width: 3600000) | varies |

### Common Pitfalls

1. `FIXED_RANGE` endIndex > text length = 400 error. Always pre-calculate.
2. `outline weight: 0` = 400 error. Use `propertyState: "NOT_RENDERED"`.
3. RGB values are 0-1 floats, not 0-255.
4. Every `update*Style` needs a `fields` string.
5. Each element needs a unique objectId across the entire presentation.
6. gws output often starts with "Using keyring backend:" — skip with `2>/dev/null`.
7. Image 500 errors: Drive file may not be publicly accessible yet.

---

## Key Stats to Have Ready

- **Bitcoin Park:** Founded 2022, 2 campuses (Nashville + Austin), 3,000+ members, 4.9-star rating, 6 annual summit series, 100s of free public events
- **AI Freedom Lab:** Founded 2025, "Build On Your Own Terms", "The Unlock" metaphor, self-custodial AI, CLAWS & Coffee monthly labs, Philosophy for Freedom series
- **AI Hack for Freedom I (Jan 2026, Austin):** First AI hackathon led by human rights advocates under authoritarian regimes, 8 dissident captains (Venezuela, Russia, China), 8 tools in 28 hours, 1 BTC prize, HRF sponsored. Tools: Pathos, Corruption Disrespector, Stringer Safety
- **AI Hack for Freedom II:** May 2026, Nashville
- **Global Bitcoin Summit:** HRF partnership, 55+ countries, 6 continents, 100+ participants
- **Imagine IF:** Summit of summits, convergence of Bitcoin + AI + Energy, "Imagine IF..." format

## Common Audiences

| Audience | Key Language to Mirror | What They Care About |
|----------|----------------------|---------------------|
| Reynolds Foundation | "Make freedom investible, measurable, irresistible", "strategic capital", "capital flywheel" | Freedom tech, dissidents, data-driven impact |
| Human Rights Foundation | "Freedom tech", "dissidents", "authoritarian regimes" | Tools for people under authoritarian rule |
| Foresight Institute | "Existential hope", "long-term flourishing" | AI governance, decentralized systems |
| Corporate Sponsors | ROI, brand alignment, audience demographics | Reach, credibility, networking access |
