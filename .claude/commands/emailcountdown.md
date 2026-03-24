---
description: "Create countdown email drafts for Bitcoin Park summits (Imagine IF, TEMS, CTS, NEMS, GBS, etc.). Generates a numbered series of emails (01-14) from 180 days out through post-event recap, matching Bitcoin Park's established email voice and format. Outputs each email as a Google Doc in the summit's [SUMMIT]_EMAILS Drive folder."
---

# Email Countdown — Bitcoin Park Summit Email Series

Generate the full countdown email sequence for any Bitcoin Park summit. The series follows a proven 14-email arc from 180 days before the event through a post-event recap, matching the tone, format, and cadence established by the Imagine IF email series.

## Required Inputs

Before drafting, gather these from the user (ask if not provided):

1. **Summit name and abbreviation** — e.g., "Imagine IF" / IF26, "The Economics & Mining Summit" / TEMS26
2. **Event dates** — e.g., October 5-6, 2026
3. **Venue name and address** — e.g., Fisher Center for the Performing Arts, 1 Avenue of the Arts, Nashville, TN 37203
4. **Summit website URL** — e.g., https://www.imagineifnashville.com/
5. **Registration/ticket URL** — e.g., https://bitcoinpark.com/if26
6. **Sponsor list** — current confirmed sponsors

## Optional Inputs (use if available, leave placeholders if not)

- Confirmed speakers with titles/affiliations
- Programming themes or track descriptions
- Side events
- Schedule details (door times, session times)
- Hotel recommendations
- Social handles and hashtags
- Loom video links from Rod
- Any summit-specific tagline or framing prompt (like "Imagine IF")

## How to Gather Content

Before drafting emails, pull content from available sources:

1. **Summit webpage** — Use WebFetch on the provided URL to extract speaker names, bios, themes, schedule, venue details, and any tagline or framing language.
2. **Brief or planning docs** — If the user provides a brief, Google Doc link, or Drive folder, read it for programming direction, speaker confirmations, and logistics.
3. **Brand guidelines** — Read `/Users/andrewdavis/.brand-guidelines/SKILL.md` for voice, tone, and content review checklist. All emails use Rod's voice (warm, conversational, specific, concise, optimistic).

Combine these sources to fill in as much content as possible. For anything still unknown, use clearly marked `[PLACEHOLDER]` brackets.

---

## The 14-Email Series

Each email is numbered 01–14. The numbering appears in both the filename and the Google Doc title.

| # | Email | Tone & Purpose |
|---|-------|----------------|
| 01 | 180 Days to Go | Vision-setting. Introduce the summit, dates, venue, confirmed speakers, sponsors. Set the "why." |
| 02 | 120 Days to Go | Momentum. Speaker updates, programming direction taking shape, sponsor acknowledgment. |
| 03 | 90 Days to Go | Programming themes. Deeper dive into tracks/pillars, new speaker announcements. |
| 04 | 60 Days to Go | Full stack preview. Detailed programming themes, Loom from Rod, member discount reminder. |
| 05 | 45 Days to Go | Agenda preview. Highlight key sessions, both stages, build anticipation. |
| 06 | 30 Days to Go | Full agenda live. Day-by-day overview, side events, hotel recs, logistics intro. |
| 07 | 21 Days to Go | Logistics focus. Travel, parking, meals, what to expect on-site. |
| 08 | 14 Days to Go | Final speaker announcements. Complete lineup, schedule highlights, urgency on tickets. |
| 09 | 7 Days to Go | Everything you need to know. Venue address, door times, check-in, bag storage, day overviews. |
| 10 | 3 Days to Go | Schedule at a glance. Day-by-day timeline, what to bring, stay connected info. |
| 11 | Tomorrow | Short and energized. Final reminders, door times, see-you-there energy. |
| 12 | Today is the Day | Shortest email. Arrival info, today's schedule, food, reminders. "Shorter and sweeter." |
| 13 | Last Day | Day 2 kickoff. Morning schedule, closing sessions, luggage/checkout tips. |
| 14 | Recap and Thank You | Gratitude. Loom from Rod, by-the-numbers, highlights, sponsor thanks, recordings link, membership CTA, what's next. |

---

## Email Format Rules

Every email follows this structure. Deviations are noted per-email in the series above.

### Subject Line

Always includes: countdown + summit name + dates + city.

**Pattern:** `[Countdown] - [Summit Name] [Year] [Optional Hook] [Dates, City]`

Examples:
- `180 Days to Go - Imagine IF 2026 [October 5-6, Nashville]`
- `Less Than 60 Days to Go - Here Is What to Expect at Imagine IF 2026 [October 5-6, Nashville]`
- `Today Is the Day - Imagine IF 2026 Kicks Off [October 5, Nashville]`
- `Thank You - Imagine IF 2026 Recap`

### Greeting

Default: `Members and friends,`

Variations as appropriate:
- `Members, past attendees, and friends,` (emails 04–06, when addressing returning community)
- `Friends,` (email 14, recap — warmer, more intimate)

### Opening Paragraph

Lead with the countdown and key facts. Get right to the point. No fluff.

Example: *"In just 180 days we will host [Summit Name] at [Venue] in [City] on [Dates]."*

### Body Sections

Use clearly labeled section headers. Keep each section to 1–3 short paragraphs. Common sections:

- Confirmed Speakers / Speaker Updates / Speaker Lineup
- What to Expect / Programming Direction / Programming Themes
- The Venue (name, context, why it matters)
- Registration (always present, always with link)
- Sponsor acknowledgment (always present)
- Logistics / What You Need to Know (later emails)
- Side Events
- What to Bring
- Food and Drinks
- Stay Connected
- By the Numbers (recap only)
- Highlights (recap only)
- Content and Recordings (recap only)
- What's Next (recap only)

### Sponsor Acknowledgment

Always present. Same phrasing pattern every email:

*"Thank you to [Sponsor 1], [Sponsor 2], ... and [Last Sponsor] for their [partnership/support]. Their support makes this experience possible."*

### Registration CTA

Always present (except email 14). Short nudge + link. Escalating urgency as the event approaches:

- Early: *"Tickets are available now. Secure your seat early."*
- Mid: *"Space is limited at [Venue]. Secure your seat now."*
- Late: *"A limited number of tickets remain."*
- Day-of: omit or minimal

### Sign-Off

Always: `Rod & The Bitcoin Park Team`

Closing line before the sign-off varies:
- Early emails: *"Looking forward to seeing everyone in [City] in just [X] days."*
- Mid emails: *"More updates coming soon."* or *"MUCH more to come! Please reply with any and all questions."*
- Late emails: *"See you in [City] on [Day]."*
- Day-of: *"See you inside."*
- Recap: *"Until next time,"*

### 100% of Proceeds Line

Include in at least half the emails, varying placement:

*"100% of proceeds from [Summit Name] support Bitcoin Park's mission to accelerate grassroots Bitcoin adoption."*

### Member Discount Mention

Include once or twice in early-to-mid emails:

*"Reminder: Bitcoin Park members receive a discount on their tickets. Reply to this email and we will send you your discount code."*

---

## Tone Guide

Read the brand guidelines at `/Users/andrewdavis/.brand-guidelines/SKILL.md` for the full voice spec. The emails use **Rod's Voice** mode:

- **Warm but professional** — not corporate, not casual. A founder writing to a community he respects.
- **Confident and understated** — no hype words. Very rare use of exclamation marks. Let the content speak.
- **Human and direct** — first person plural ("we are building," "we could not be more excited"). Occasional first person singular from Rod in later emails ("my name is Rod Roudi," "I want to take a moment").
- **Mission-driven** — tie back to Bitcoin Park's mission, 100% of proceeds, grassroots adoption.
- **Inclusive and invitational** — invite the reader into something. Collaborative closings.
- **Progressively urgent** — early emails are expansive and vision-focused. Later emails get shorter, more logistical, more action-oriented.
- **Specific over vague** — real names, real projects, real numbers. Never generic filler.
- **No AI slop** — content reads as human-written, intentional, and specific. No buzzwords, no corporate-speak.

### Recurring Phrases (adapt to each summit's identity)

Each summit should develop its own recurring motifs. The Imagine IF series uses patterns like:

- A repeated structural phrase: *"Two stages. Two days. One question."*
- A values phrase: *"Conversations that matter"*
- A builder phrase: *"Building at the frontier / at the edge"*

Create similar signature phrases for each summit that reflect its unique theme and mission.

---

## IF26 Email Examples

Read `references/if26-email-examples.md` in this skill's directory for 5 complete Imagine IF 2026 email templates (emails 01, 04, 09, 12, 14) that demonstrate the exact tone, format, and structure. Use these as the primary reference when generating emails for other summits.

If the references directory is not accessible, the key patterns are all documented in the format rules above.

---

## Output: Google Doc in Drive

Each email draft is saved as a Google Doc in the summit's email folder on Google Drive.

### Summit Folder Reference

| Code | Name | Drive Parent Folder ID |
|------|------|----------------------|
| NEMS | Nashville Energy and Mining Summit | `1lKma4acIwosjj2fTHSa3tAT4jkTlFV6Y` |
| BT | Bitcoin Takeover SXSW | `1BE5OJDcDOEdt30ppZPcwTFpKLCXEog89` |
| GB | Grassroots Bitcoin | `1scZCZBtLDg2qjmobdMlCSAPMv7iOMLSm` |
| TEMS | Texas Energy and Mining Summit | `1PvJsYEDNMfzo6NAnB5nYKNeDToWHui2h` |
| IF | Imagine IF | `1eXC2Zz933q3LJ-z992r3MSJElnMVBIno` |
| CTS | Bitcoin Custody & Treasury Summit | `1rYc0Mdu3ZGnNAvs4VB74ygKY4s0PK4L0` |
| GBS | Global Bitcoin Summit | `1vEG7f5NLs7GM6hziDo6phjZjw3O_qzMZ` |

### Folder Naming Convention

The email folder is named `[ABBREV]_EMAILS` — e.g., `IF26_EMAILS`, `TEMS26_EMAILS`, `CTS26_EMAILS`.

### Doc Naming Convention

Each doc is titled with its number and subject:

`[##]. [Summit Name] [Year] - [Email Title] Draft`

Examples:
- `01. Imagine IF 2026 - 180 Days to Go Email Draft`
- `09. Imagine IF 2026 - 7 Days to Go Email Draft`
- `14. Imagine IF 2026 - Recap and Thank You Email Draft`

### How to Create the Google Docs

Use the `gws` CLI at `/Users/andrewdavis/.npm-global/bin/gws` for all Google Drive operations. Authenticated as andrew@bitcoinpark.com.

**Step 1: Find the summit's email folder.** Search within the summit's year folder:

```bash
gws drive files list --params '{"q": "name = '\''[ABBREV]_EMAILS'\'' and mimeType = '\''application/vnd.google-apps.folder'\''", "fields": "files(id,name)", "supportsAllDrives": true, "includeItemsFromAllDrives": true}'
```

If the folder doesn't exist, find the summit's year folder first (e.g., "TEMS26" inside the parent folder ID from the table above), then create the `_EMAILS` folder inside it:

```bash
gws drive files list --params '{"q": "mimeType=\"application/vnd.google-apps.folder\" and name contains \"<CODE><YEAR>\" and \"<PARENT_ID>\" in parents", "fields": "files(id,name)", "driveId": "0AEtADa_AopTlUk9PVA", "corpora": "drive", "includeItemsFromAllDrives": true, "supportsAllDrives": true}'
```

```bash
gws drive files create --json '{"name": "<ABBREV>_EMAILS", "mimeType": "application/vnd.google-apps.folder", "parents": ["<YEAR_FOLDER_ID>"]}' --params '{"supportsAllDrives": true}'
```

**Step 2: Create each Google Doc** in the folder:

```bash
gws drive files create --json '{"name": "[##]. [Summit Name] [Year] - [Email Title] Draft", "mimeType": "application/vnd.google-apps.document", "parents": ["FOLDER_ID"]}' --params '{"supportsAllDrives": true}'
```

**Step 3: Write the email content** to each doc:

```bash
gws docs documents batchUpdate --params '{"documentId": "DOC_ID"}' --body '{"requests": [{"insertText": {"location": {"index": 1}, "text": "EMAIL CONTENT HERE"}}]}'
```

Write each email's full text content into its doc. The content should be plain text (no HTML) matching the format of the existing IF26 emails.

### Workflow

1. Gather all inputs (ask the user for anything missing)
2. Fetch content from the summit webpage and any provided briefs
3. Draft all 14 emails
4. Find or confirm the Drive folder
5. Create all 14 Google Docs in the folder
6. Write the email content into each doc
7. Report back with a summary and link to the folder

If the user only wants a subset of emails (e.g., "just draft emails 01-06 for now"), create only what's requested.

---

## Placeholders

When information is not yet available, use clearly marked placeholders so the team can fill them in later:

- `[TIME]` — for unconfirmed times
- `[ADDITIONAL SPEAKERS TO BE ADDED AS CONFIRMED]`
- `[SIDE EVENTS WITH FINAL DETAILS]`
- `[LOOM VIDEO LINK]`
- `[SCHEDULE LINK]`
- `[NEARBY HOTEL OPTIONS WITH LINKS]`
- `[SOCIAL HANDLES AND HASHTAG]`
- `[YOUTUBE CHANNEL / PLAYLIST LINK]`
- `[PHOTO GALLERY LINK]`
- `[KEY SPEAKERS AND SESSIONS FOR DAY 1]`
- `[KEY SPEAKERS AND SESSIONS FOR DAY 2]`
- `[TOP 3-5 MOMENTS OR TAKEAWAYS FROM THE SUMMIT]`
- `[ATTENDANCE COUNT]`
- `[NUMBER]`
- `[UPCOMING BITCOIN PARK EVENTS]`
- `[ANY SPECIFIC ENTRANCE/NAVIGATION INSTRUCTIONS]`

Use the same bracket style consistently. Never fabricate details — if you don't have it, placeholder it.
