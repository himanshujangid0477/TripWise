import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Compass, Printer } from "lucide-react";
import { places } from "../data/places";
import { categories, rates } from "../data/budget";
import { ProgressBar } from "../components/PackingChecklist";
import { countLeaves } from "../utils/checklist";
import { addDays, formatDay, formatINR, formatRange } from "../utils/format";
import { DAY_KEYS } from "../utils/ics";
import { estimateTravelTime } from "../utils/travel";
import { decodeShare, loadTrip, validateTrip } from "../utils/tripData";

function ReadOnlyChecklist({ items }) {
  return (
    <ul className="share-checklist">
      {items.map((node) => (
        <li key={node.id}>
          <label className={node.done ? "done" : ""}>
            <input type="checkbox" checked={node.done} disabled readOnly />
            <span>{node.text}</span>
          </label>
          {node.children?.length > 0 && <ReadOnlyChecklist items={node.children} />}
        </li>
      ))}
    </ul>
  );
}

export default function ShareView() {
  const [params] = useSearchParams();
  const encoded = params.get("d");
  const autoPrint = params.get("print") === "1";

  const result = useMemo(() => {
    if (!encoded) return { source: "local", data: loadTrip() };

    try {
      const checked = validateTrip(decodeShare(encoded));
      return checked.ok
        ? { source: "link", data: checked.value }
        : { error: "This share link contains invalid trip data." };
    } catch {
      return { error: "This share link is damaged or incomplete." };
    }
  }, [encoded]);

  useEffect(() => {
    if (!autoPrint || !result.data) return undefined;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [autoPrint, result]);

  if (result.error) {
    return (
      <div className="share-page">
        <div className="share-card">
          <h1>Link not available</h1>
          <p>{result.error}</p>
          <Link to="/" className="check-small-button">
            Open TripWise
          </Link>
        </div>
      </div>
    );
  }

  const { trip, itinerary, budget, checklist } = result.data;
  const spent = budget.expenses.reduce(
    (sum, expense) => sum + expense.amount * rates[expense.currency],
    0
  );
  const progress = countLeaves(checklist);

  return (
    <div className="share-page">
      <header className="share-header">
        <div>
          <span className="share-badge no-print">
            <Compass size={14} /> Read-only view
            {result.source === "local" ? " · this browser" : ""}
          </span>
          <h1>{trip.name}</h1>
          <p>{formatRange(trip.startDate, DAY_KEYS.length)}</p>
        </div>

        <div className="share-actions no-print">
          <button type="button" className="check-small-button" onClick={() => window.print()}>
            <Printer size={15} /> Print
          </button>
          <Link to="/" className="check-small-button outline">
            Open TripWise
          </Link>
        </div>
      </header>

      <section>
        <h2 className="share-heading">Itinerary</h2>
        <div className="share-days">
          {DAY_KEYS.map((key, index) => {
            const stops = itinerary[key]
              .map((id) => places.find((place) => place.id === id))
              .filter(Boolean);

            return (
              <article className="share-day" key={key}>
                <h3>
                  Day {index + 1}
                  <small>{formatDay(addDays(trip.startDate, index))}</small>
                </h3>

                {stops.length === 0 ? (
                  <p className="share-empty">No stops planned for this day.</p>
                ) : (
                  <ol>
                    {stops.map((place, stopIndex) => (
                      <li key={place.id}>
                        <strong>{place.name}</strong>
                        <span>{place.category}</span>
                        {stopIndex < stops.length - 1 && (
                          <div className="share-travel">
                            ↓ Approx.{" "}
                            {estimateTravelTime(place.position, stops[stopIndex + 1].position)}{" "}
                            min to next stop
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="share-block">
        <h2 className="share-heading">Budget</h2>
        <div className="share-totals">
          <div>
            <span>Total budget</span>
            <strong>{formatINR(budget.total)}</strong>
          </div>
          <div>
            <span>Spent</span>
            <strong>{formatINR(spent)}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>{formatINR(budget.total - spent)}</strong>
          </div>
        </div>

        <div className="share-table-wrap">
          <table className="share-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Budget</th>
                <th>Actual</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((name) => {
                const actual = budget.expenses
                  .filter((expense) => expense.category === name)
                  .reduce((sum, expense) => sum + expense.amount * rates[expense.currency], 0);
                const limit = budget.categoryBudgets[name] ?? 0;

                return (
                  <tr key={name} className={actual > limit ? "over" : ""}>
                    <td>{name}</td>
                    <td>{formatINR(limit)}</td>
                    <td>{formatINR(actual)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="share-block">
        <h2 className="share-heading">Packing checklist</h2>
        {checklist.length === 0 ? (
          <p className="share-empty">No packing items yet.</p>
        ) : (
          <>
            <ProgressBar
              done={progress.done}
              total={progress.total}
              label="Packing progress"
            />
            <p className="share-note">
              {progress.done} of {progress.total} packed
            </p>
            <ReadOnlyChecklist items={checklist} />
          </>
        )}
      </section>
    </div>
  );
}
