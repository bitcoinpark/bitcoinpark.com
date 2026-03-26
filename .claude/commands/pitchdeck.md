---
description: "Use when creating, upgrading, or restructuring Google Slides pitch decks, grant presentations, sponsor proposals, or partner decks for Bitcoin Park, AI Freedom Lab, or Imagine IF. Also trigger when user says /pitchdeck, 'slides', 'deck', 'build a deck for [audience]', 'upgrade the presentation', or references an existing Google Slides URL in the context of pitching, fundraising, or grant applications."
---

# Pitch Deck Builder — Bitcoin Park, AI Freedom Lab & Imagine IF

Creates polished, brand-correct Google Slides presentations that tell a story to external audiences. Every deck follows a narrative arc, not a feature list. Supports creating new decks, upgrading existing ones, and restructuring into variant layouts.

## Required Inputs

Ask the user if not provided:
1. **Audience** — Who is this for? (e.g., "The Reynolds Foundation Freedom Accelerator", "HRF", "a corporate sponsor")
2. **Primary subject** — Which orgs to feature? (BP only, AFL only, BP + AFL, BP + AFL + IF, etc.)
3. **Specific ask** — What grant, sponsorship, or partnership? (e.g., "Freedom Accelerator grant", "TEMS27 title sponsor")
4. **Existing materials** — LOI, one-pager, Google Doc, or existing presentation URL to draw from?

## Step 0: Create, Upgrade, or Restructure?

### Upgrade an existing deck
If the user provides an **existing presentation URL**:
1. GET the presentation to extract all slide IDs, element IDs, and current text
2. Read any source docs the user links — extract key themes, updated stats, and language
3. Map each element that needs updating
4. Use the **Python batching pattern** (see Execution Mechanics) to update in bulk
5. Preserve existing images/logos unless asked to change visuals

### Create a variant from an existing deck
If the user wants a restructured version (e.g., "make a shorter version", "one focused on the orgs"):
1. **Copy the presentation** via Drive API: `gws drive files copy --params '{"fileId":"SOURCE_ID"}' --json '{"name":"New Title"}'`
2. GET the copy's slide structure to find all slide objectIds
3. **Delete unwanted slides** by objectId (not index) in one batch
4. **Create new slides** at the correct insertion indices between kept slides
5. Populate new slides with content (see From-Scratch Slide Building)

### Fresh build
If no existing deck, proceed to Step 1.

## Step 1: Load Brand Guidelines

Invoke the `/bpbrand` skill before doing anything else. This loads the full visual identity for Bitcoin Park, AI Freedom Lab, and Imagine IF — colors, fonts, voice, and usage rules.

## Step 2: Research the Audience

Use WebFetch to pull the audience's website, mission page, and program-specific pages. Extract:
- Their exact language and terminology (mirror it in the deck)
- What they fund and why
- Their theory of change
- Any stats or frameworks they reference
- Names of leadership to address

If their site is Wix/JS-heavy, fall back to WebSearch for press coverage and third-party descriptions.

## Step 3: Extract Source Document Themes

When the user provides an LOI, one-pager, or other source doc, read it via `gws docs documents get` and extract:
- **Thesis/framing** — the conceptual hook (e.g., "The Mispricing of Freedom", "Freedom Alpha")
- **Updated stats** — always use the most recent numbers from the source doc
- **Key phrases** — language the audience will recognize (e.g., "The mission is the boss", "Simplicity compounds")
- **Structural model** — how the orgs are framed (e.g., "three-layer accelerator: Community, Financial, Intelligence")
- **The ask** — specific grant/partnership request and how it's structured
- **Audience-specific references** — mirror their investments, publications, or frameworks back to them

**Important:** The deck should tell the same story as the source doc but in different words. Never copy LOI wording verbatim into slides. Same facts, fresh language.

## Step 4: Discover Logo Assets

Search Google Drive for approved brand logos. Search for BOTH white (dark backgrounds) and dark/colored (light backgrounds) variants:

```bash
GWS=/Users/andrewdavis/.npm-global/bin/gws

# Bitcoin Park — white (for dark bg) and dark green (for light bg)
$GWS drive files list --params '{"q":"name contains '\''bitcoinpark_primarylogo'\'' and mimeType='\''image/png'\''","pageSize":10,"fields":"files(id,name)"}' 2>/dev/null

# Bitcoin Park brandmark
$GWS drive files list --params '{"q":"name contains '\''bitcoinpark_brandmark'\'' and mimeType='\''image/png'\''","pageSize":10,"fields":"files(id,name)"}' 2>/dev/null

# Imagine IF — white, orange, purple, coral variants
$GWS drive files list --params '{"q":"name contains '\''ImagineIf'\'' and name contains '\''Logo'\'' and mimeType='\''image/png'\''","pageSize":10,"fields":"files(id,name)"}' 2>/dev/null
```

**Match logo color to background.** White logos on dark backgrounds, dark green/colored logos on light backgrounds. Prefer @2x PNGs.

## Step 5: Choose a Deck Structure

### Structure A: Story Arc (9 slides)
Full narrative for grant applications and detailed proposals. Two problem slides build tension before the solution.

| # | Section | Purpose |
|---|---------|---------|
| 1 | **Title** | Bold headline + org names + audience + date |
| 2 | **The Moment** (Why Now) | Market forces, urgency, stats that create tension |
| 3 | **The Gap** (Challenges) | The pain the audience cares about |
| 4 | **The Unlock** (Vision) | The world we're building |
| 5 | **The Bridge** (Solution) | Three-layer model: Community + Financial + Intelligence |
| 6 | **The Convergence** (optional) | Imagine IF: Bitcoin + AI + Energy |
| 7 | **Why Believe** (Proof) | Stats, receipts, AI Hack results |
| 8 | **The Path** (Next Steps) | What funding unlocks, specific asks |
| 9 | **Close** | Tagline + contact info |

### Structure B: Org-Focused (8 slides)
Leaner structure that gives each org its own dedicated slide. One problem slide, more room for showcasing what each org does.

| # | Section | Purpose |
|---|---------|---------|
| 1 | **Title** | Bold headline + org names + audience + date |
| 2 | **The Landscape** | ONE consolidated problem slide (civic + intelligence gaps) |
| 3 | **Bitcoin Park** | Dedicated: stats, community, HRF partnership |
| 4 | **AI Freedom Lab** | Dedicated: self-custodial AI, programs, "The Unlock" |
| 5 | **AI Hack for Freedom** | Proof showcase: dissidents, tools shipped, results |
| 6 | **Imagine IF** | The convergence: bitcoin + AI + energy |
| 7 | **The Path Forward** | Two-card layout: BP ask + AFL ask |
| 8 | **Close** | Tagline + contact info |

**When to use which:** Structure A when the audience needs convincing about the problem space (cold outreach, new relationships). Structure B when the audience already understands the landscape and wants to learn about the orgs (warm introductions, follow-up decks).

### The Three-Layer Model

When presenting BP + AFL together, frame as a three-layer system:

| Layer | Org | What It Provides |
|-------|-----|-----------------|
| **Community** | Bitcoin Park | Physical infrastructure, campuses, free public programming |
| **Financial** | Bitcoin/GBS | Open-source financial tools, HRF Global Freedom Tech Summit |
| **Intelligence** | AI Freedom Lab | Sovereign AI tools, hackathons, education |

### Unified Theme Option

All slides can use the same Warm White (#F7F5F0) background with Dark Green headlines and Park Orange accents. This creates a clean, professional look. When using a unified theme:
- All accent bars: Park Orange
- Headlines: Dark Green (#0A2B07)
- Body text: Dark Gray (0.35)
- Stats/accents: Park Orange
- Card boxes: Subtle warm gray fill (0.94, 0.93, 0.91) with Dark Green outline
- Logos: Use dark green / colored variants (white logos are invisible on light backgrounds)

## Step 6: Brand System

**Bitcoin Park slides:**
- Dark bg: Dark Green #0A2B07, Park Orange accents, Hanken Grotesk Bold + Inter
- Light bg: Warm White, Dark Green headlines, Park Orange accents

**AI Freedom Lab slides:**
- Dark bg: Deep Black #171C1E, Electric Cyan #00E5FF accents, Hanken Grotesk Bold + Inter
- Light bg: Warm White, Dark Green headlines, Park Orange accents

**Imagine IF slides:**
- Dark bg: Midnight Blue #070C70, Sunrise Orange #E68158 + Royal Purple #7958ED, Rethink Sans Bold + Cormorant Garamond Bold Italic
- Light bg: Warm White, Park Orange accents, Cormorant Garamond for "Imagine IF" hero text

**Card-style text boxes** (for org cards on any background):

| Segment | Font | Size | Style | Dark bg color | Light bg color |
|---------|------|------|-------|---------------|----------------|
| Org name | Hanken Grotesk (Cormorant Garamond for IF) | 14-16pt | Bold | Primary accent | Dark Green |
| Subtitle | Hanken Grotesk (Rethink Sans for IF) | 10-11pt | Bold | Secondary accent | Park Orange |
| Body | Inter (Rethink Sans for IF) | 9-10pt | Regular | Light Gray (0.8) | Dark Gray (0.35) |
| Accent closer | Inter (Rethink Sans for IF) | 9-10pt | Bold Italic | Primary accent | Dark Green |

**Every slide** gets a thin accent bar at top (80000 EMU height). **Never blend** org palettes on the same slide.

### Voice

All narrative text uses Rod's voice — see `/bpbrand` for full details:
- Warm, specific, concise, optimistic
- No em-dashes. No AI writing tells. No corporate buzzwords.
- Specific numbers beat vague claims ("6,000+ members" not "a large community")
- Short punchy sentences mixed with longer flowing ones
- Closings invite collaboration, never talk at the audience
- Key phrases: "The mission is the boss", "Simplicity compounds", "Not your memory, not your brain", "Open doors, open source, open minds", "Built at Bitcoin Park. Built for everyone."

## Step 7: Execution Mechanics

### Python Batching Pattern (Preferred)

Build a Python script that constructs all API calls and executes in batches. This handles text length calculations automatically and avoids shell escaping issues:

```python
#!/usr/bin/env python3
import subprocess, json, sys

GWS = "/Users/andrewdavis/.npm-global/bin/gws"
PRES_ID = "your_presentation_id"

# Colors (0-1 floats for Slides API)
WARM_WHITE = {"red": 0.969, "green": 0.961, "blue": 0.941}
ORANGE = {"red": 1, "green": 0.6, "blue": 0.455}
DGREEN = {"red": 0.039, "green": 0.169, "blue": 0.027}
DEEP_BLACK = {"red": 0.09, "green": 0.11, "blue": 0.118}
DGRAY = {"red": 0.35, "green": 0.35, "blue": 0.35}

def batch_update(requests, label=""):
    r = subprocess.run(
        [GWS, "slides", "presentations", "batchUpdate",
         "--params", json.dumps({"presentationId": PRES_ID}),
         "--json", json.dumps({"requests": requests})],
        capture_output=True, text=True)
    print(f"{'OK' if r.returncode == 0 else 'FAIL'}: {label}")
    return r.returncode == 0

def styled_requests(oid, segments):
    """Replace text + style per segment. segments: [(text, font, size, bold, color, italic), ...]"""
    full_text = "".join(s[0] for s in segments)
    reqs = [
        {"deleteText": {"objectId": oid, "textRange": {"type": "ALL"}}},
        {"insertText": {"objectId": oid, "text": full_text}}
    ]
    if len(segments) == 1:
        _, font, size, bold, color, italic = segments[0]
        reqs.append({"updateTextStyle": {
            "objectId": oid, "textRange": {"type": "ALL"},
            "style": {"fontFamily": font, "fontSize": {"magnitude": size, "unit": "PT"},
                      "bold": bold, "italic": italic,
                      "foregroundColor": {"opaqueColor": {"rgbColor": color}}},
            "fields": "fontFamily,fontSize,bold,italic,foregroundColor"}})
    else:
        pos = 0
        for text, font, size, bold, color, italic in segments:
            end = pos + len(text)
            reqs.append({"updateTextStyle": {
                "objectId": oid,
                "textRange": {"type": "FIXED_RANGE", "startIndex": pos, "endIndex": end},
                "style": {"fontFamily": font, "fontSize": {"magnitude": size, "unit": "PT"},
                          "bold": bold, "italic": italic,
                          "foregroundColor": {"opaqueColor": {"rgbColor": color}}},
                "fields": "fontFamily,fontSize,bold,italic,foregroundColor"}})
            pos = end
    return reqs
```

**Batch by slide group** (2-3 slides per batch) for debugging isolation. If one batch fails, you know which slides were affected.

### From-Scratch Slide Building Helpers

When creating new slides (not updating existing ones), use these helpers:

```python
def textbox(oid, page_id, x, y, w, h):
    return {"createShape": {"objectId": oid, "shapeType": "TEXT_BOX",
        "elementProperties": {"pageObjectId": page_id,
            "size": {"width": {"magnitude": w, "unit": "EMU"}, "height": {"magnitude": h, "unit": "EMU"}},
            "transform": {"scaleX": 1, "scaleY": 1, "translateX": x, "translateY": y, "unit": "EMU"}}}}

def accent_bar(oid, page_id, color):
    return [
        {"createShape": {"objectId": oid, "shapeType": "RECTANGLE",
            "elementProperties": {"pageObjectId": page_id,
                "size": {"width": {"magnitude": 9144000, "unit": "EMU"}, "height": {"magnitude": 80000, "unit": "EMU"}},
                "transform": {"scaleX": 1, "scaleY": 1, "translateX": 0, "translateY": 0, "unit": "EMU"}}}},
        {"updateShapeProperties": {"objectId": oid,
            "shapeProperties": {
                "shapeBackgroundFill": {"solidFill": {"color": {"rgbColor": color}}},
                "outline": {"propertyState": "NOT_RENDERED"}},
            "fields": "shapeBackgroundFill,outline"}}]

def card_box(oid, page_id, x, y, w, h, border_color=DGREEN):
    return [
        {"createShape": {"objectId": oid, "shapeType": "ROUND_RECTANGLE",
            "elementProperties": {"pageObjectId": page_id,
                "size": {"width": {"magnitude": w, "unit": "EMU"}, "height": {"magnitude": h, "unit": "EMU"}},
                "transform": {"scaleX": 1, "scaleY": 1, "translateX": x, "translateY": y, "unit": "EMU"}}}},
        {"updateShapeProperties": {"objectId": oid,
            "shapeProperties": {
                "shapeBackgroundFill": {"solidFill": {"color": {"rgbColor": {"red": 0.94, "green": 0.93, "blue": 0.91}}, "alpha": 0.5}},
                "outline": {"outlineFill": {"solidFill": {"color": {"rgbColor": border_color}}},
                    "weight": {"magnitude": 1.5, "unit": "PT"}}},
            "fields": "shapeBackgroundFill,outline"}}]
```

### Raw gws Patterns

For quick one-off operations:

1. **Create presentation:** `gws slides presentations create --json '{"title":"..."}'`
2. **Create slides:** `createSlide` with unique `objectId` and `insertionIndex`
3. **Set backgrounds:** `updatePageProperties` with `pageBackgroundFill` → `solidFill`
4. **Text boxes:** `createShape` TEXT_BOX → `insertText` → `updateTextStyle`
5. **CRITICAL:** End indices exceeding text length cause 400 errors. Use `python3 -c "print(len('...'))"`.
6. **Accent bars:** `createShape` RECTANGLE → `updateShapeProperties` with `outline: { "propertyState": "NOT_RENDERED" }`
7. **Images from Drive:** Make public → `createImage` with download URL → revoke permission
8. **Delete placeholders:** Get first slide elements, delete placeholders by objectId

## Step 8: Insert Logos

```bash
GWS=/Users/andrewdavis/.npm-global/bin/gws

# 1. Make temporarily public
$GWS drive permissions create --params '{"fileId":"FILE_ID"}' --json '{"role":"reader","type":"anyone"}'

# 2. Insert (use Python batch for multiple logos)
$GWS slides presentations batchUpdate --params '{"presentationId":"PRES_ID"}' --json '{
  "requests": [{"createImage": {
    "objectId": "unique_id",
    "url": "https://drive.google.com/uc?export=download&id=FILE_ID",
    "elementProperties": {
      "pageObjectId": "slide_id",
      "size": {"width": {"magnitude": 1800000, "unit": "EMU"}, "height": {"magnitude": 1200000, "unit": "EMU"}},
      "transform": {"scaleX": 0.5, "scaleY": 0.5, "translateX": 7000000, "translateY": 300000, "unit": "EMU"}}}}]}'

# 3. Revoke immediately
$GWS drive permissions delete --params '{"fileId":"FILE_ID","permissionId":"anyoneWithLink"}'
```

Batch: make all public, insert all, revoke all. Place logos consistently: top-right for secondary, bottom-left for primary on close.

## Step 9: Return the URL

Return the Google Slides URL and a summary table of all slides.

## EMU Reference

- 914400 EMU = 1 inch. Standard slide: 9144000 x 5143500 EMU (10" x 5.625")
- Margins: 600000 EMU from edges. Accent bar height: 80000 EMU.

| Position | translateX | translateY |
|----------|-----------|-----------|
| Label | 600000 | 300000 |
| Headline | 600000 | 600000 |
| Stats bar | 600000 | 1250000 |
| Body start | 600000 | 1500000-1700000 |
| Bottom text | 600000 | 4300000-4500000 |
| Full width | 600000 (w: 7800000) | varies |
| Left column | 600000 (w: 3500000) | varies |
| Right column | 4700000 (w: 3500000) | varies |

## Common Pitfalls

1. `FIXED_RANGE` endIndex > text length = 400 error. Python `len()` handles this.
2. `outline weight: 0` = 400 error. Use `propertyState: "NOT_RENDERED"`.
3. RGB values are 0-1 floats, not 0-255.
4. Every `update*Style` needs a `fields` string.
5. Each element needs a unique objectId across the entire presentation.
6. gws output starts with keyring message — redirect stderr: `2>/dev/null`.
7. Image 500 errors: Drive file may not be publicly accessible yet. Wait 1-2 seconds.
8. Always include `italic` in updateTextStyle fields — unset italic is inherited from previous content.
9. White logos are invisible on Warm White backgrounds — always match logo color to background.

---

## Key Stats (Updated March 2026)

- **Bitcoin Park:** Founded 2022, 2 campuses (Nashville + Austin), 6,000+ members, 4.9-star event rating, 6 annual summit series, hundreds of free public events, "The mission is the boss"
- **AI Freedom Lab:** Founded 2025, "Build On Your Own Terms" tagline, "The Unlock" metaphor (the moment control shifts from institution to individual), self-custodial AI framework, Claws & Coffee monthly labs, Philosophy for Freedom in the Age of AI
- **AI Hack for Freedom I (Jan 2026, Austin):** First AI hackathon led by human rights advocates under authoritarian regimes, 8 dissident team captains (Venezuela, Russia, China), 8 working tools in 48 hours, 1 BTC prize pool, HRF sponsored. Tools: Pathos (censorship-resistant reporting on Nostr), Corruption Disrespector (hidden financial network investigation), Stringer Safety (journalist protection for conflict zones)
- **AI Hack for Freedom II:** May 2026, Nashville
- **Global Freedom Tech Summit:** HRF partnership, 55+ countries, 6 continents, 100+ participants
- **Imagine IF:** Summit of summits, convergence of Bitcoin + AI + Energy, "Imagine IF..." format where speakers envision and build, curated gathering for capital allocators, entrepreneurs, and policymakers

## Key Narrative Concepts

| Concept | What It Means | When to Use |
|---------|--------------|-------------|
| **The Mispricing of Freedom** | <1% of $900B annual philanthropy reaches freedom/democracy. Not a scarcity problem — a mispriced risk problem. (Dr. Salas Castro) | Grant pitches, especially Reynolds |
| **Freedom Alpha** | Measurable observed outcomes exceeding the counterfactual. Every tool shipped = Freedom Alpha. | When audience uses investment/returns language |
| **The Three-Layer Model** | Community (BP) + Financial (Bitcoin/GBS) + Intelligence (AFL) = one integrated system | Whenever presenting BP + AFL together |
| **The Unlock** | The moment control over intelligence shifts from institution to individual. "Not your memory, not your brain." | AFL-focused slides, vision sections |
| **Simplicity Compounds** | Every event, partnership, and builder compounds. BP's operating philosophy. | BP-focused sections, closing arguments |

## Common Audiences

| Audience | Key Language to Mirror | What They Care About |
|----------|----------------------|---------------------|
| Reynolds Foundation | "Freedom Alpha", "The Mispricing of Freedom", "make freedom investible, measurable, irresistible", "strategic capital". Reference: OpenSats, Cornell Bitcoin Technology Policy Institute, BLISS Summit. | Freedom tech, dissidents, data-driven impact, scaling from <1% to 10% of philanthropy |
| Human Rights Foundation | "Freedom tech", "dissidents", "authoritarian regimes", "financial sovereignty" | Tools for people under authoritarian rule, Bitcoin as human rights tool |
| Foresight Institute | "Existential hope", "long-term flourishing", "intelligent cooperation" | AI governance, decentralized systems, civilizational resilience |
| Corporate Sponsors | ROI, brand alignment, audience demographics, exclusivity tiers | Reach, credibility, networking access |
