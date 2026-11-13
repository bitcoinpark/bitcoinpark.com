# Park Forum

`/forum/` is a single public page with a skyline hero above the idea, upcoming forums underneath, and membership information at the bottom. It requires no JavaScript. The first forum is “State of The Network” on January 20, 2027, and attendance is by invitation only. The Apply to Attend button opens the existing application form without guaranteeing an invitation. The date uses a semantic `<time datetime="2027-01-20">` inside the event details. Each forum has its own labeled section within Upcoming forums, followed by “Next forum coming soon.” A short invitation to co-create the next forum appears below, with inquiries linked to `community@bitcoinpark.com` using `mailto:`.

The public page uses a simple, centered document layout with a header, introduction, upcoming forums, and membership footer. All sections scroll with the page on desktop and mobile; there is no fixed panel or nested scrolling region. Libre Caslon Display and DM Sans fonts, the off-white background, blue accent, and Bitcoin Park branding are retained. The header places “Curated by” and the Bitcoin Park wordmark beneath Park Forum, with an Apply to Attend button at the top right. A second Apply to Attend button remains beside the upcoming forum, and both open the same form. Thin rules separate the sections, and the application buttons use the same blue style. Content and links stack on small screens. The public page requires no JavaScript. Its styles in `forum.css` are isolated from the sponsor catalog. Existing catalog URLs and authentication remain available directly.

## Open interest and membership

The Apply to Attend button opens the published [Park Forum interest form](https://docs.google.com/forms/d/e/1FAIpQLSdCAzjdUlGBXuTTsU0Vs8DHZ4lMHYtS9x4o_rNn2LGKZveaTA/viewform). The form is titled “Park Forum — Open Interest” and describes the invitation-only 2027 gatherings. It collects required full name, company, LinkedIn or X profile, and a brief reason for attending. Google Forms collects a required, validated email address with `RESPONDER_INPUT`; visitors do not need to sign in. The form is owned by the Bitcoin Park account used to create it. Responses can be managed privately in the [form editor](https://docs.google.com/forms/d/1bfP1QwMUqZwViGCfhbZMp3JvUY3V157ecKD9vVM_uvk/edit). Publishing the responder form does not grant editor or response access.

The upcoming event places “Support By” beneath the title, alongside the date when space allows, with the small note “Sponsors to be announced, limited to 2.” Description and Speakers share a compact row on desktop; the description spans the full width on small screens. The State of The Network description introduces a review of the past year in Bitcoin and freedomtech, covering progress, challenges, and the outlook for the year ahead. Speakers remain “To Be Announced.” The invitation disclaimer sits directly beneath the event's Apply to Attend button and is linked to it with `aria-describedby`.

Submitting interest does not guarantee an invitation. Attendance is by invitation only. Forum tickets remain included with Bitcoin Park membership, and the original membership application link is retained.

## Sponsor catalog

`/catalog/` is a public password shell. AWS returns the complete catalog HTML and idea/date data only after authentication. `/forum/catalog/` redirects to the same gate. No password, signing secret, or catalog encryption key is shipped in browser code. Sessions last one hour and stay in the current browser tab. Leave catalog clears access.

After password access, the scene slowly approaches a straight-on view of the right-hand arch and opens one engraved catalog window. The compact window has two steps: choose one of 14 dates, then choose from 57 ideas grouped by 10 themes, with Grassroots Bitcoin first. There are no searches or dropdowns. Selecting a date opens the idea list; Change date returns to the first step. A different date clears the previous idea. Sponsors can copy their pairing directly from the second step. Internal scrolling keeps the surrounding arch visible on desktop and mobile. Date and idea selections are drafts for discussion; they do not hold dates or create sponsor records.

## Hosting and access

The website uses the repository's existing GitHub Pages deployment. A Node.js 22 Lambda named `bitcoinpark-forum-access` in AWS account `155335455111`, region `us-east-2`, handles `/api/access` through its Function URL. Its execution role can write only its own CloudWatch logs; logs expire after 14 days. No DNS changes are required.

Lambda environment variables hold `FORUM_PASSWORD_VERIFIER` (salted scrypt), `FORUM_SESSION_SECRET` (signed one-hour sessions), and `FORUM_CATALOG_KEY` (AES-256-GCM catalog decryption). AWS encrypts these variables at rest. Function URL invocation is public so browsers can submit the password; the application checks every catalog request. CORS permits only the two Bitcoin Park origins. Wrong passwords are limited to eight attempts per source IP per 15 minutes within each Lambda instance; this is not a global rate limit.

The repository stores only the encrypted current catalog snapshot under `_forum-gate/private/`. GitHub Pages excludes underscore-prefixed directories. Earlier public revisions of the catalog remain in Git history and may exist in caches; this gate controls the current website and is not retroactive secrecy.

## Refresh and deploy the catalog

Use the authenticated Google Workspace CLI locally:

```sh
python3 scripts/import-forum-ideas.py
python3 scripts/import-forum-dates.py
node --test _forum-gate/tests/*.test.mjs
node scripts/deploy-forum-access.mjs
```

The importers read the existing Title Ideas and 2027 Dates tabs into ignored `_forum-gate/.local/` JSON files. The ideas importer places Grassroots Bitcoin first and preserves sheet order for the remaining themes. The deployment script encrypts these files, packages only runtime files, deploys Lambda through your authenticated AWS CLI, verifies that anonymous access is denied, and writes the actual AWS URL to `forum/gate-config.js`. Review and commit the updated ciphertext and frontend configuration, then publish through GitHub Pages. Never commit the local plaintext JSON or credentials.

On first deployment, or with `node scripts/deploy-forum-access.mjs --rotate-password`, enter the password at the hidden terminal prompt. Rotation also invalidates existing sessions. Without local data files, a subsequent deploy reuses the encrypted snapshot with the existing AWS key. The script checks the AWS account and resource tags before making changes.

## Local preview

The public forum and gate layouts can be previewed with `python3 -m http.server 4174 --bind 127.0.0.1`. Production AWS CORS deliberately excludes localhost. Run the Node tests for authentication and the Lambda adapter; verify the complete login flow on the Bitcoin Park origin after deployment.

## Artwork and fonts

The public hero and social sharing image is `assets/forum-skyline-panorama.jpg`. Built-in imagegen adapted the blue-and-white artwork into a shallow 3:1 panorama with the complete skyline, rooftop antennas, trees, and centered campus houses inside the image boundaries. The logo and Bitcoin sun remain absent. The hero spans the full content width and uses its natural aspect ratio, so taller buildings remain visible without cropping or stretching. Its edit prompt is recorded in `assets/forum-skyline-panorama.prompt.txt`. Earlier recoloring and removal prompts, artwork, and frame assets remain available in `assets/`.

The previous ink artwork's edit prompt and reference roles are recorded in `assets/forum-park-ink.prompt.txt`. The original porch generation prompt and photographic reference roles are in `assets/forum-park-porch.prompt.txt`. Earlier porch, colonnade and campus illustrations and their prompts remain in `assets/`.

The optimized JPEG is self-hosted, as are DM Sans and Libre Caslon Display (license files included in `assets/`). The separate header wordmark is retained. `assets/bitcoin-park-brandmark-white.png` is an unchanged copy of `nems/bitcoinpark_brandmark_white_3@2x.png`, rendered as a blue CSS mask beside the Park Forum title.

The older Roman artwork and styles remain for the separate sponsor catalog and cached pages.

The matching temple perspective is `assets/roman-temple-front.webp`, created with built-in imagegen. Its exact generation prompt and reference roles are recorded in `assets/roman-temple-front.prompt.txt`.

The sponsor catalog uses `assets/roman-arch-front.webp`, also created with built-in imagegen; its prompt is `assets/roman-arch-front.prompt.txt`. `catalog-steps.css` and `catalog-steps.js` implement the compact date-first flow. The previous `catalog.css`, `catalog.js`, `catalog-filters.mjs`, and `ideas.js` remain available so cached copies of earlier templates continue to function during deployment.
