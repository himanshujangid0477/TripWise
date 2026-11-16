import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarArrowDown,
  Copy,
  FileDown,
  FileUp,
  Link2,
  Printer,
  Eye,
} from "lucide-react";
import useLocalStorage, { getStored, setStored } from "../hooks/useLocalStorage";
import { buildICS, eventsToItinerary, parseICS } from "../utils/ics";
import { isValidDate } from "../utils/format";
import {
  applyTrip,
  buildExport,
  buildShareLink,
  defaultTrip,
  emptyItinerary,
  KEYS,
  validateTrip,
} from "../utils/tripData";

const MAX_FILE_BYTES = 1024 * 1024;

function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const slug = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trip";

export default function TripTools() {
  const [trip, setTrip] = useLocalStorage(KEYS.trip, defaultTrip);
  const [message, setMessage] = useState(null);
  const [shareLink, setShareLink] = useState("");
  const jsonInput = useRef(null);
  const icsInput = useRef(null);
  const navigate = useNavigate();

  const success = (text) => setMessage({ type: "success", text, details: [] });
  const failure = (text, details = []) =>
    setMessage({ type: "error", text, details });

  const exportJSON = () => {
    download(
      `${slug(trip.name)}.tripwise.json`,
      JSON.stringify(buildExport(), null, 2),
      "application/json"
    );
    success("Trip exported as JSON.");
  };

  const readFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return null;

    if (file.size > MAX_FILE_BYTES) {
      failure("That file is too large (limit is 1 MB).");
      return null;
    }

    return file.text();
  };

  const importJSON = async (event) => {
    const text = await readFile(event);
    if (text === null) return;

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      failure("That file is not valid JSON, so nothing was imported.");
      return;
    }

    const result = validateTrip(data);
    if (!result.ok) {
      failure(
        "The file could not be imported. Nothing was changed.",
        result.errors
      );
      return;
    }

    applyTrip(result.value);
    success(
      `Imported "${result.value.trip.name}": ${result.value.savedPlaceIds.length} saved places, ${result.value.budget.expenses.length} expenses, ${result.value.checklist.length} checklist groups.`
    );
  };

  const exportICS = () => {
    const itinerary = getStored(KEYS.itinerary, emptyItinerary);
    const hasStops = Object.values(itinerary).some((list) => list.length > 0);

    if (!hasStops) {
      failure("Add at least one place to a day before exporting the calendar.");
      return;
    }

    download(
      `${slug(trip.name)}.ics`,
      buildICS({ trip, itinerary }),
      "text/calendar"
    );
    success("Itinerary exported as a calendar (.ics) file.");
  };

  const importICS = async (event) => {
    const text = await readFile(event);
    if (text === null) return;

    const parsed = parseICS(text);
    if (parsed.error) {
      failure(parsed.error);
      return;
    }

    const result = eventsToItinerary(parsed.events);
    if (result.imported === 0) {
      failure(
        "No events could be imported. Events must match a place in TripWise, for example Hawa Mahal or Amer Fort.",
        [`${parsed.total} events found, ${result.unmatched} did not match a known place.`]
      );
      return;
    }

    const saved = getStored(KEYS.saved, []);
    const planned = Object.values(result.itinerary).flat();

    setStored(KEYS.itinerary, result.itinerary);
    setStored(KEYS.saved, [...saved, ...planned.filter((id) => !saved.includes(id))]);
    setTrip({ ...trip, startDate: result.startDate });

    const notes = [];
    if (result.unmatched) notes.push(`${result.unmatched} events skipped (no matching place).`);
    if (result.outOfRange) notes.push(`${result.outOfRange} events skipped (after Day 3).`);

    setMessage({
      type: "success",
      text: `Imported ${result.imported} stops. Day 1 is now ${result.startDate}.`,
      details: notes,
    });
  };

  const createShareLink = async () => {
    const link = buildShareLink();
    setShareLink(link);

    try {
      await navigator.clipboard.writeText(link);
      success("Share link copied. Anyone with the link can view this trip, read-only.");
    } catch {
      success("Share link created below. Copy it to share this trip, read-only.");
    }
  };

  return (
    <section className="tools-section" id="trip-tools">
      <div className="section-heading">
        <div>
          <span className="section-label">SAVE &amp; SHARE</span>
          <h2>Trip tools</h2>
        </div>
      </div>

      <div className="budget-panel">
        <div className="tools-trip-fields">
          <label>
            <span>Trip name</span>
            <input
              value={trip.name}
              maxLength={80}
              onChange={(event) =>
                setTrip({ ...trip, name: event.target.value })
              }
              onBlur={() => {
                if (!trip.name.trim()) setTrip({ ...trip, name: defaultTrip.name });
              }}
            />
          </label>

          <label>
            <span>Day 1 date</span>
            <input
              type="date"
              value={trip.startDate}
              onChange={(event) => {
                if (isValidDate(event.target.value)) {
                  setTrip({ ...trip, startDate: event.target.value });
                }
              }}
            />
          </label>
        </div>

        <div className="tools-grid">
          <button type="button" className="tool-button" onClick={exportJSON}>
            <FileDown size={18} /> Export JSON
          </button>
          <button type="button" className="tool-button" onClick={() => jsonInput.current?.click()}>
            <FileUp size={18} /> Import JSON
          </button>
          <button type="button" className="tool-button" onClick={exportICS}>
            <CalendarArrowDown size={18} /> Export calendar (.ics)
          </button>
          <button type="button" className="tool-button" onClick={() => icsInput.current?.click()}>
            <FileUp size={18} /> Import calendar (.ics)
          </button>
          <button type="button" className="tool-button" onClick={createShareLink}>
            <Link2 size={18} /> Create share link
          </button>
          <button type="button" className="tool-button" onClick={() => navigate("/share")}>
            <Eye size={18} /> Open read-only view
          </button>
          <button type="button" className="tool-button" onClick={() => navigate("/share?print=1")}>
            <Printer size={18} /> Print itinerary
          </button>
        </div>

        <input
          ref={jsonInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={importJSON}
        />
        <input
          ref={icsInput}
          type="file"
          accept=".ics,text/calendar"
          hidden
          onChange={importICS}
        />

        {shareLink && (
          <div className="share-link-box">
            <input readOnly value={shareLink} aria-label="Share link" onFocus={(event) => event.target.select()} />
            <button
              type="button"
              className="check-small-button"
              onClick={() => navigator.clipboard?.writeText(shareLink)}
            >
              <Copy size={15} /> Copy
            </button>
          </div>
        )}

        {message && (
          <div className={`tool-message ${message.type}`} role="status">
            <strong>{message.text}</strong>
            {message.details.length > 0 && (
              <ul>
                {message.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="budget-note">
          Calendar events use mock times (Day 1 starts at 09:00, 90 minutes per
          stop plus the estimated travel time). Importing replaces the current
          itinerary with the calendar&apos;s events that match known places.
        </p>
      </div>
    </section>
  );
}
