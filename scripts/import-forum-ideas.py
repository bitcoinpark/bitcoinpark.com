#!/usr/bin/env python3
"""Import the linked sheet's Title, Theme, and Idea columns using gws."""
import argparse
import datetime
import json
import re
import subprocess
from pathlib import Path

SHEET_ID = '1VdQQGNRkeEOY1D5SJAg2KesD8gsf-hwbwWavCBwngrQ'
TAB_ID = 1187250020
SOURCE_URL = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit?gid={TAB_ID}#gid={TAB_ID}'
ROOT = Path(__file__).resolve().parent.parent

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--input', type=Path, help='Use a previously fetched gws JSON response.')
args = parser.parse_args()
if args.input:
    response = json.loads(args.input.read_text())
else:
    result = subprocess.run([
        'gws', 'sheets', 'spreadsheets', 'values', 'get', '--params',
        json.dumps({'spreadsheetId': SHEET_ID, 'range': 'Title Ideas!A1:D1000'})
    ], check=True, capture_output=True, text=True)
    response = json.loads(result.stdout)

rows = response.get('values', [])
if not rows or rows[0][1:4] != ['Title', 'Theme', 'Idea']:
    raise SystemExit('Expected Title, Theme, and Idea in columns B, C, and D. No files changed.')
themes = {}
for row_number, row in enumerate(rows[1:], 2):
    if len(row) < 4 or not str(row[3]).strip():
        continue
    title, theme, text = (str(value).strip() for value in row[1:4])
    if not theme:
        raise SystemExit(f'Missing theme on row {row_number}. No files changed.')
    if theme not in themes:
        themes[theme] = {'id': re.sub(r'[^a-z0-9]+', '-', theme.lower()).strip('-'), 'name': theme, 'ideas': []}
    themes[theme]['ideas'].append({'title': title, 'text': text, 'sourceRow': row_number})
if not themes:
    raise SystemExit('No ideas found. No files changed.')

data = {
    'sourceUrl': SOURCE_URL,
    'sourceSheet': 'Title Ideas',
    'importedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    # Keep the lead theme first; preserve sheet order for every other theme.
    'themes': sorted(themes.values(), key=lambda theme: theme['id'] != 'grassroots-bitcoin'),
}
output = ROOT / '_forum-gate' / '.local' / 'ideas-data.json'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'ideas': sum(len(t['ideas']) for t in themes.values()),
                  'themes': {theme['name']: len(theme['ideas']) for theme in data['themes']}, 'output': str(output)}))
