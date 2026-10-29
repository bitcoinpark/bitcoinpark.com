# Park Forum

`/forum/` is a single public page with the idea at the top, upcoming forums underneath, and membership information at the bottom. It requires no JavaScript. The first listing is Tuesday, December 15, 2026; the topic and program remain to be announced. Add confirmed future forums as additional `<li class="forum-event">` entries in `index.html`.

The full-bleed campus illustration uses a warm screenprint style based on the Bitcoin Park Nashville houses. `forum.css` is isolated from the sponsor catalog styles. On mobile, the artwork introduces the page above the same continuous content panel. The public page has no sponsor or catalog button, password field, entrance screen, or scene transitions. Existing catalog URLs and authentication remain available directly.

## Waitlist and membership

The Join the waitlist button opens the published [Park Forum waitlist](https://docs.google.com/forms/d/e/1FAIpQLSdCAzjdUlGBXuTTsU0Vs8DHZ4lMHYtS9x4o_rNn2LGKZveaTA/viewform). It collects required full name, company, LinkedIn or X profile, and a brief reason for attending. Google Forms collects a required, validated email address with `RESPONDER_INPUT`; visitors do not need to sign in. The form is owned by the Bitcoin Park account used to create it. Responses can be managed privately in the [form editor](https://docs.google.com/forms/d/1bfP1QwMUqZwViGCfhbZMp3JvUY3V157ecKD9vVM_uvk/edit). Publishing the responder form does not grant editor or response access.

Joining the waitlist does not confirm attendance. Forum tickets remain included with Bitcoin Park membership, and the original membership application link is retained.

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

The public page uses `assets/park-gathering.jpg`, created with built-in imagegen using `assets/bitcoin-park-sketch-blue.png` as an architectural reference. The exact prompt is recorded in `assets/park-gathering.prompt.txt`. The optimized JPEG is self-hosted, as are DM Sans and Libre Caslon Display (license files included in `assets/`). The Bitcoin Park wordmark and mark are retained.

The older Roman artwork and styles remain for the separate sponsor catalog and cached pages.

The matching temple perspective is `assets/roman-temple-front.webp`, created with built-in imagegen. Its exact generation prompt and reference roles are recorded in `assets/roman-temple-front.prompt.txt`.

The sponsor catalog uses `assets/roman-arch-front.webp`, also created with built-in imagegen; its prompt is `assets/roman-arch-front.prompt.txt`. `catalog-steps.css` and `catalog-steps.js` implement the compact date-first flow. The previous `catalog.css`, `catalog.js`, `catalog-filters.mjs`, and `ideas.js` remain available so cached copies of earlier templates continue to function during deployment.
