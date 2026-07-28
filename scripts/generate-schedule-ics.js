#!/usr/bin/env node
// Generates schedule.ics from the schedule Google Sheet (via the Apps Script JSON endpoint).
// Run: node scripts/generate-schedule-ics.js
// Output is deterministic for a given sheet state, so the CI workflow only commits real changes.

const fs = require('fs');
const path = require('path');

const FEED_URL = process.env.SCHEDULE_FEED_URL || 'https://script.google.com/macros/s/AKfycbxOrOe84ly3hnCGC-7OfzAmtiNd4OwpzLywLC0wA58piuws1CL0aeCHreQYkFtF3-83/exec';
const OUT_FILE = path.join(__dirname, '..', 'schedule.ics');

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

// Sheet dates arrive as strings like "Mon Nov 10 2025 00:00:00 GMT-0600 (Central Standard Time)".
// Only the calendar date matters (events are all-day), so pull it straight from the text.
function parseSheetDate(value) {
    const m = /^\w{3} (\w{3}) (\d{1,2}) (\d{4})/.exec(String(value || '').trim());
    if (!m || !MONTHS[m[1]]) return null;
    const parsed = { y: +m[3], mo: MONTHS[m[1]], d: +m[2] };
    // Guard against typo years in the sheet (e.g. 0207) — one invalid date can
    // make calendar apps reject the entire feed.
    if (parsed.y < 2020 || parsed.y > 2040) return null;
    return parsed;
}

function fmtDate({ y, mo, d }) {
    return `${y}${String(mo).padStart(2, '0')}${String(d).padStart(2, '0')}`;
}

// Optional "start time"/"end time" columns. Cells arrive either as plain text
// ("6:30 PM", "18:30") or, when Sheets formats the cell as a time, as a Date
// string like "Sat Dec 30 1899 18:30:00 GMT-0546 (Central Standard Time)" —
// the HH:MM in that string is the wall-clock time as entered in the sheet.
function parseSheetTime(value) {
    const s = String(value || '').trim();
    if (!s) return null;
    let m = /^\w{3} \w{3} \d{1,2} \d{4} (\d{1,2}):(\d{2}):\d{2}/.exec(s);
    if (!m) m = /^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?$/i.exec(s);
    if (!m) return null;
    let h = +m[1];
    const mi = +(m[2] || 0);
    const ap = (m[3] || '').toLowerCase();
    if (h > 23 || mi > 59) return null;
    if (ap.startsWith('p') && h < 12) h += 12;
    if (ap.startsWith('a') && h === 12) h = 0;
    return { h, mi };
}

function fmtDateTime(date, { h, mi }) {
    return `${fmtDate(date)}T${String(h).padStart(2, '0')}${String(mi).padStart(2, '0')}00`;
}

// Both campuses (Nashville, Austin) are US Central.
const TZID = 'America/Chicago';
const VTIMEZONE = [
    'BEGIN:VTIMEZONE',
    `TZID:${TZID}`,
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:-0600',
    'TZOFFSETTO:-0500',
    'TZNAME:CDT',
    'DTSTART:19700308T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0600',
    'TZNAME:CST',
    'DTSTART:19701101T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
];

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
        ...VTIMEZONE,
    ];

    // DTSTAMP/LAST-MODIFIED must be the generation time, not the event date:
    // subscribers (notably Google) may skip merging a changed event whose
    // DTSTAMP is identical to the copy they already hold.
    const buildStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');

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
            `DTSTAMP:${buildStamp}`,
            `LAST-MODIFIED:${buildStamp}`
        );

        const startTime = parseSheetTime(row['start time']);
        const endTime = parseSheetTime(row['end time']);
        // Multi-day events stay all-day unless an end time is also given, so a
        // start time alone can't collapse a 3-day summit into a 2-hour event.
        if (startTime && (endTime || fmtDate(end) === fmtDate(start))) {
            let dtend;
            if (endTime) {
                let endDay = end;
                // A same-day end time at or before the start crosses midnight (e.g. 9 PM – 12:30 AM).
                if (fmtDate(endDay) === fmtDate(start) && endTime.h * 60 + endTime.mi <= startTime.h * 60 + startTime.mi) {
                    endDay = addDays(endDay, 1);
                }
                dtend = fmtDateTime(endDay, endTime);
            } else {
                // No end time: default 2-hour duration, matching the schedule page's per-event links.
                const total = startTime.h * 60 + startTime.mi + 120;
                dtend = fmtDateTime(addDays(start, Math.floor(total / 1440)), { h: Math.floor(total / 60) % 24, mi: total % 60 });
            }
            lines.push(
                `DTSTART;TZID=${TZID}:${fmtDateTime(start, startTime)}`,
                `DTEND;TZID=${TZID}:${dtend}`
            );
        } else {
            lines.push(
                `DTSTART;VALUE=DATE:${fmtDate(start)}`,
                `DTEND;VALUE=DATE:${fmtDate(addDays(end, 1))}`
            );
        }
        lines.push(`SUMMARY:${escapeText(name)}`);
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
