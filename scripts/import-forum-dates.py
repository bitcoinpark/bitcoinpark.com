#!/usr/bin/env python3
"""Import the 2027 Dates tab's proposed dates for local date/idea exploration."""
import argparse
import datetime
import json
import subprocess
from pathlib import Path

SHEET_ID = '1VdQQGNRkeEOY1D5SJAg2KesD8gsf-hwbwWavCBwngrQ'
TAB_ID = 467340070
ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--input', type=Path)
args = parser.parse_args()
if args.input:
    response = json.loads(args.input.read_text())
else:
    result = subprocess.run(['gws', 'sheets', 'spreadsheets', 'values', 'get', '--params',
                             json.dumps({'spreadsheetId': SHEET_ID, 'range': '2027 Dates!A1:I1004'})],
                            check=True, capture_output=True, text=True)
    response = json.loads(result.stdout)
rows = response.get('values', [])
if not rows or rows[0][:4] != ['Month', 'Slot', 'Proposed Date', 'Backup Date']:
    raise SystemExit('The date columns have changed. No files written.')
dates = []
for row_number, row in enumerate(rows[1:], 2):
    if len(row) < 3 or row[2].strip().lower() in ('', 'none'):
        continue
    date = datetime.datetime.strptime(row[2].strip(), '%a, %b %d, %Y').date()
    if date.strftime('%a') != row[2].split(',')[0]:
        raise SystemExit(f'Weekday mismatch on row {row_number}. No files written.')
    dates.append({'id': date.isoformat(), 'date': date.isoformat(),
                  'label': f'{date:%A, %B} {date.day}, {date.year}',
                  'monthDay': f'{date:%b} {date.day}', 'year': date.year,
                  'weekday': date.strftime('%a'),
                  'sourceRow': row_number})
if not dates or len({d['id'] for d in dates}) != len(dates):
    raise SystemExit('Missing or duplicate proposed dates. No files written.')
dates.sort(key=lambda d: d['date'])
data = {'sourceUrl': f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit?gid={TAB_ID}#gid={TAB_ID}',
        'sourceSheet': '2027 Dates', 'importedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'dates': dates}
(ROOT / 'forum' / 'dates-data.js').write_text('// Proposed dates only; backup dates are alternatives, not separate slots.\nexport const datesData = '
                                           + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')
print(json.dumps({'dates': len(dates), 'first': dates[0]['label'], 'last': dates[-1]['label']}))
