# Park Forum

- `/forum/`: the opening hero and “I. The idea,” with links to the catalog.
- `/forum/catalog/`: the complete Park Forum page, including 14 dates and 57 searchable ideas across 10 themes.

Both pages use shared, self-hosted assets and styles under `forum/`. They are plain HTML, CSS, and JavaScript served by the repository’s existing GitHub Pages deployment. No build, runtime service, database, or secrets are required.

Date and idea selections are browser-tab drafts for discussion. They do not hold dates or create sponsor records. The catalog includes the highlighted two-sponsor note, December 15, 2026 and July 16, 2027 dates, and Nashville-only location text.

## Refresh the catalog

Use the existing authenticated Google Workspace CLI locally, then review and commit the generated files:

```sh
python3 scripts/import-forum-ideas.py
python3 scripts/import-forum-dates.py
```

The importers read the existing Title Ideas and 2027 Dates tabs. Google credentials are not included in this site. Source references and import timestamps remain in the generated data files; the webpage does not link to the sheet.

## Local preview

From the repository root:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Open `http://127.0.0.1:4174/forum/` and `http://127.0.0.1:4174/forum/catalog/`.

## Artwork and fonts

The Roman forum artwork and blue Bitcoin Park linework were prepared for this Park Forum design. The Bitcoin Park mark comes from Bitcoin Park. DM Sans and Libre Caslon Display are distributed with their included license files in `assets/`.
