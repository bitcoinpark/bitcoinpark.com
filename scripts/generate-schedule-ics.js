#!/usr/bin/env node
// Generates schedule.ics from the schedule Google Sheet (via the Apps Script JSON endpoint).
// Run: node scripts/generate-schedule-ics.js
// Output is deterministic for a given sheet state, so the CI workflow only commits real changes.

const fs = require('fs');
const path = require('path');

const FEED_URL = 'https://script.google.com/macros/s/AKfycbxOrOe84ly3hnCGC-7OfzAmtiNd4OwpzLywLC0wA58piuws1CL0aeCHreQYkFtF3-83/exec';
const OUT_FILE = path.join(__dirname, '..', 'schedule.ics');

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

// Sheet dates arrive as strings like "Mon Nov 10 2025 00:00:00 GMT-0600 (Central Standard Time)".
// Only the calendar date matters (events are all-day), so pull it straight from the text.
function parseSheetDate(value) {
    const m = /^\w{3} (\w{3}) (\d{1,2}) (\d{4})/.exec(String(value || '').trim());
    if (!m || !MONTHS[m[1]]) return null;
    return { y: +m[3], mo: MONTHS[m[1]], d: +m[2] };
}

function fmtDate({ y, mo, d }) {
    return `${y}${String(mo).padStart(2, '0')}${String(d).padStart(2, '0')}`;
}

function addDays({ y, mo, d }, n) {
    const t = new Date(Date.UTC(y, mo - 1, d + n));
    return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

function escapeText(s) {
    return String(s || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

// RFC 5545: content lines should not exceed 75 octets; continuation lines start with a space.
function foldLine(line) {
    const out = [];
    let rest = line;
    while (Buffer.byteLength(rest, 'utf8') > 73) {
        let cut = 73;
        while (Buffer.byteLength(rest.slice(0, cut), 'utf8') > 73) cut--;
        out.push(rest.slice(0, cut));
        rest = ' ' + rest.slice(cut);
    }
    out.push(rest);
    return out.join('\r\n');
}

async function main() {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`Feed request failed: ${res.status}`);
    const events = await res.json();
    if (!Array.isArray(events) || events.length === 0) {
        throw new Error('Feed returned no events; refusing to overwrite schedule.ics');
    }

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Bitcoin Park//Schedule//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Bitcoin Park Events',
        'X-WR-CALDESC:Events at Bitcoin Park in Nashville and Austin. bitcoinpark.com/schedule',
        'X-PUBLISHED-TTL:PT6H',
        'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    ];

    let count = 0;
    for (const row of events) {
        const name = String(row['event name'] || '').trim();
        const start = parseSheetDate(row['start date']);
        if (!name || !start) continue;

        const end = parseSheetDate(row['end date']) || start;
        const link = String(row['meetup link'] || '').trim();
        const desc = [String(row['description'] || '').trim(), link].filter(Boolean).join('\n');
        const uid = `${fmtDate(start)}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}@bitcoinpark.com`;

        lines.push(
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${fmtDate(start)}T000000Z`,
            `DTSTART;VALUE=DATE:${fmtDate(start)}`,
            `DTEND;VALUE=DATE:${fmtDate(addDays(end, 1))}`,
            `SUMMARY:${escapeText(name)}`
        );
        const location = String(row['location'] || '').trim();
        if (location) lines.push(`LOCATION:${escapeText(location === 'Nashville' ? 'Bitcoin Park Nashville' : location === 'Austin' ? 'Bitcoin Park Austin' : location)}`);
        if (desc) lines.push(`DESCRIPTION:${escapeText(desc)}`);
        if (link) lines.push(`URL:${link}`);
        lines.push('END:VEVENT');
        count++;
    }

    lines.push('END:VCALENDAR');

    fs.writeFileSync(OUT_FILE, lines.map(foldLine).join('\r\n') + '\r\n');
    console.log(`Wrote ${count} events to ${OUT_FILE}`);
}

main().catch(err => {
    console.error(err.message || err);
    process.exit(1);
});
