import { places } from "../data/places";
import { addDays, diffDays, isValidDate } from "./format";
import { estimateTravelTime } from "./travel";

export const DAY_KEYS = ["day-1", "day-2", "day-3"];

const START_MINUTES = 9 * 60; // each day starts at 09:00
const STOP_MINUTES = 90; // mock visit length

const pad = (value) => String(value).padStart(2, "0");

function stamp(date, minutes) {
  const day = addDays(date, Math.floor(minutes / 1440)).replace(/-/g, "");
  const inDay = minutes % 1440;
  return `${day}T${pad(Math.floor(inDay / 60))}${pad(inDay % 60)}00`;
}

const escapeText = (text) =>
  String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

const unescapeText = (text) =>
  text.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");

// Long lines are folded at 75 octets as the iCalendar format requires.
function fold(line) {
  const encoder = new TextEncoder();
  const lines = [];
  let current = "";
  let bytes = 0;

  for (const char of line) {
    const size = encoder.encode(char).length;

    if (bytes + size > 75) {
      lines.push(current);
      current = ` ${char}`;
      bytes = 1 + size;
    } else {
      current += char;
      bytes += size;
    }
  }

  lines.push(current);
  return lines.join("\r\n");
}

export function buildICS({ trip, itinerary }) {
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TripWise//Itinerary//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(trip.name)}`,
  ];

  DAY_KEYS.forEach((key, dayIndex) => {
    const date = addDays(trip.startDate, dayIndex);
    const stops = (itinerary[key] ?? [])
      .map((id) => places.find((place) => place.id === id))
      .filter(Boolean);

    let cursor = START_MINUTES;

    stops.forEach((place, index) => {
      const start = cursor;
      const end = start + STOP_MINUTES;
      const next = stops[index + 1];
      cursor = end + (next ? estimateTravelTime(place.position, next.position) : 0);

      lines.push(
        "BEGIN:VEVENT",
        `UID:tripwise-${place.id}-day${dayIndex + 1}@tripwise`,
        `DTSTAMP:${now}Z`,
        `DTSTART:${stamp(date, start)}`,
        `DTEND:${stamp(date, end)}`,
        `SUMMARY:${escapeText(place.name)}`,
        `LOCATION:${escapeText(place.name)}`,
        `GEO:${place.position[0]};${place.position[1]}`,
        `CATEGORIES:${escapeText(place.category)}`,
        `DESCRIPTION:${escapeText(
          `${place.description} (Day ${dayIndex + 1}, stop ${index + 1} of ${stops.length})`
        )}`,
        "END:VEVENT"
      );
    });
  });

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

function normalizeEvent(raw, index) {
  const summary = (raw.SUMMARY ?? "").trim();
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/.exec(raw.DTSTART ?? "");

  if (!summary || !match) return null;

  const date = `${match[1]}-${match[2]}-${match[3]}`;
  if (!isValidDate(date)) return null;

  return {
    summary,
    uid: raw.UID ?? "",
    date,
    // null means "no time given"; such events keep their file order instead
    // of all being crammed onto the first slot of the day.
    minutes: match[4] ? Number(match[4]) * 60 + Number(match[5]) : null,
    index,
  };
}

export function parseICS(text) {
  if (!/BEGIN:VCALENDAR/i.test(text)) {
    return {
      error: "This file is not a valid iCalendar (.ics) file.",
      events: [],
      total: 0,
    };
  }

  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n");

  const raws = [];
  let current = null;
  let order = 0;

  lines.forEach((line) => {
    if (/^BEGIN:VEVENT/i.test(line)) {
      current = {};
    } else if (/^END:VEVENT/i.test(line)) {
      if (current) {
        current._order = order++;
        raws.push(current);
      }
      current = null;
    } else if (current) {
      const index = line.indexOf(":");
      if (index < 0) return;
      const name = line.slice(0, index).split(";")[0].toUpperCase();
      current[name] = unescapeText(line.slice(index + 1));
    }
  });

  return {
    events: raws.map((raw) => normalizeEvent(raw, raw._order)).filter(Boolean),
    total: raws.length,
  };
}

function findPlace(event) {
  // A TripWise-exported event carries its place id in the UID, which is the
  // most reliable match. Anything else must match a place name exactly.
  const byUid = /^tripwise-(\d+)-/.exec(event.uid);

  if (byUid) {
    const place = places.find((item) => item.id === Number(byUid[1]));
    if (place) return place;
  }

  return places.find(
    (place) => place.name.toLowerCase() === event.summary.toLowerCase()
  );
}

// Turns parsed calendar events into a 3-day itinerary. The earliest event
// date becomes Day 1. Events that match no known place, or fall after Day 3,
// are counted and reported instead of being imported.
export function eventsToItinerary(events) {
  const matched = [];
  let unmatched = 0;

  events.forEach((event) => {
    const place = findPlace(event);
    if (place) matched.push({ event, place });
    else unmatched += 1;
  });

  const itinerary = { "day-1": [], "day-2": [], "day-3": [] };

  if (matched.length === 0) {
    return { itinerary, startDate: null, imported: 0, unmatched, outOfRange: 0 };
  }

  const startDate = matched
    .map((item) => item.event.date)
    .sort()[0];

  matched.sort(
    (a, b) =>
      a.event.date.localeCompare(b.event.date) ||
      (a.event.minutes ?? Infinity) - (b.event.minutes ?? Infinity) ||
      a.event.index - b.event.index
  );

  let imported = 0;
  let outOfRange = 0;
  let duplicates = 0;
  const seen = new Set();

  matched.forEach(({ event, place }) => {
    const dayIndex = diffDays(startDate, event.date);

    if (dayIndex < 0 || dayIndex > 2) {
      outOfRange += 1;
      return;
    }

    if (seen.has(place.id)) {
      duplicates += 1;
      return;
    }
    seen.add(place.id);

    itinerary[DAY_KEYS[dayIndex]].push(place.id);
    imported += 1;
  });

  return {
    itinerary,
    startDate,
    imported,
    unmatched,
    outOfRange,
    duplicates,
  };
}
