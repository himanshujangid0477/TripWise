import BudgetTracker from "../components/BudgetTracker";
import ItineraryPlanner from "../components/ItineraryPlanner";
import MapView from "../components/MapView";
import Navbar from "../components/Navbar";
import PackingChecklist from "../components/PackingChecklist";
import TripTools from "../components/TripTools";
import useLocalStorage from "../hooks/useLocalStorage";
import { places } from "../data/places";
import {
  DEFAULT_TOTAL_BUDGET,
  initialExpenses,
  rates,
} from "../data/budget";
import { formatINR, formatRange } from "../utils/format";
import { DAY_KEYS } from "../utils/ics";
import { defaultTrip, emptyItinerary, KEYS } from "../utils/tripData";
import {
  ArrowRight,
  MapPin,
  CalendarDays,
  Plus,
  Compass,
  Plane,
  Wallet,
  Clock3,
  Sparkles,
} from "lucide-react";

const otherTrips = [
  {
    name: "Himalayan Escape",
    location: "Manali, Himachal Pradesh",
    dates: "Jan 10 – Jan 14, 2027",
    days: "5 Days",
    budget: "₹18,000",
    spent: "₹2,000",
    progress: 11,
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=900",
    tag: "Adventure",
  },
];

export default function Dashboard() {
  const [trip] = useLocalStorage(KEYS.trip, defaultTrip);
  const [budget] = useLocalStorage(KEYS.budget, DEFAULT_TOTAL_BUDGET);
  const [expenses] = useLocalStorage(KEYS.expenses, initialExpenses);

  const [savedPlaceIds, setSavedPlaceIds] = useLocalStorage(KEYS.saved, []);
  const [itinerary, setItinerary] = useLocalStorage(
    KEYS.itinerary,
    emptyItinerary
  );

  const savedPlaces = savedPlaceIds
    .map((id) => places.find((place) => place.id === id))
    .filter(Boolean);

  const savePlace = (id) =>
    setSavedPlaceIds((current) =>
      current.includes(id) ? current : [...current, id]
    );

  const removePlace = (id) => {
    setSavedPlaceIds((current) => current.filter((item) => item !== id));
    setItinerary((current) => ({
      "day-1": current["day-1"].filter((item) => item !== id),
      "day-2": current["day-2"].filter((item) => item !== id),
      "day-3": current["day-3"].filter((item) => item !== id),
    }));
  };

  const spent = expenses.reduce(
    (total, expense) => total + expense.amount * rates[expense.currency],
    0
  );
  const plannedDays = DAY_KEYS.filter((key) => itinerary[key].length > 0).length;

  const trips = [
    {
      name: trip.name,
      location: "Jaipur, Rajasthan",
      dates: formatRange(trip.startDate, DAY_KEYS.length),
      days: `${DAY_KEYS.length} Days`,
      budget: formatINR(budget),
      spent: formatINR(spent),
      progress: Math.min(100, Math.round((spent / budget) * 100)),
      image:
        "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=900",
      tag: "Cultural trip",
    },
    ...otherTrips,
  ];

  const stats = [
    { label: "Total trips", value: String(trips.length).padStart(2, "0"), icon: Plane },
    { label: "Places saved", value: String(savedPlaces.length), icon: MapPin },
    { label: "Trip budget", value: formatINR(budget), icon: Wallet },
    { label: "Days planned", value: `${plannedDays} / ${DAY_KEYS.length}`, icon: CalendarDays },
  ];

  const scrollTo = (id) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="app">
      <Navbar />

      <main className="dashboard">
        <section className="welcome-section">
          <div>
            <div className="eyebrow">
              <Sparkles size={15} />
              YOUR NEXT ADVENTURE STARTS HERE
            </div>

            <h1>
              Explore more.
              <br />
              <span>Worry less.</span>
            </h1>

            <p>
              Plan your journeys, discover amazing places and
              organize every detail in one beautiful space.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() => scrollTo("trip-tools")}
            >
              <Plus size={18} />
              Create new trip
            </button>
          </div>

          <div className="hero-decoration">
            <div className="hero-circle circle-one" />
            <div className="hero-circle circle-two" />
            <div className="hero-icon">
              <Compass size={76} strokeWidth={1.2} />
            </div>
            <span className="floating-tag">
              <MapPin size={15} /> Discover somewhere new
            </span>
          </div>
        </section>

        <section className="stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article className="stat-card" key={stat.label}>
                <div className="stat-icon">
                  <Icon size={20} />
                </div>
                <div>
                  <p>{stat.label}</p>
                  <h3>{stat.value}</h3>
                </div>
              </article>
            );
          })}
        </section>

        <section className="map-section" id="explore">
          <div className="section-heading">
            <div>
              <span className="section-label">DISCOVER PLACES</span>
              <h2>Explore the map</h2>
            </div>
          </div>

          <MapView
            savedPlaceIds={savedPlaceIds}
            onSave={savePlace}
            onRemove={removePlace}
          />
        </section>

        <section className="itinerary-section" id="itinerary">
          <ItineraryPlanner
            savedPlaces={savedPlaces}
            itinerary={itinerary}
            setItinerary={setItinerary}
          />
        </section>

        <section className="budget-section-wrapper" id="budget">
          <BudgetTracker />
        </section>

        <section className="checklist-section-wrapper" id="checklist">
          <PackingChecklist />
        </section>

        <section className="tools-section-wrapper">
          <TripTools />
        </section>

        <section className="trips-section" id="trips">
          <div className="section-heading">
            <div>
              <span className="section-label">YOUR JOURNEY</span>
              <h2>Upcoming trips</h2>
            </div>
          </div>

          <div className="trip-grid">
            {trips.map((item) => (
              <article className="trip-card" key={item.name}>
                <div className="trip-image">
                  <img src={item.image} alt={item.name} />
                  <span className="trip-tag">{item.tag}</span>
                </div>

                <div className="trip-content">
                  <h3>{item.name}</h3>

                  <div className="trip-detail">
                    <MapPin size={15} />
                    {item.location}
                  </div>

                  <div className="trip-detail">
                    <CalendarDays size={15} />
                    {item.dates}
                  </div>

                  <div className="trip-divider" />

                  <div className="trip-budget">
                    <span>Budget used</span>
                    <strong>
                      {item.spent} <small>/ {item.budget}</small>
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  <div className="trip-footer">
                    <span>
                      <Clock3 size={14} /> {item.days}
                    </span>
                    <button
                      type="button"
                      aria-label={`Open ${item.name}`}
                      onClick={() => scrollTo("explore")}
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bottom-banner">
          <div>
            <span>READY FOR YOUR NEXT ADVENTURE?</span>
            <h2>The world is waiting for you.</h2>
            <p>Start planning your next unforgettable journey.</p>
          </div>
          <Plane size={55} strokeWidth={1.2} />
        </section>

        <footer className="footer">
          <span>© 2026 TripWise</span>
          <span>Made for curious travellers.</span>
        </footer>
      </main>
    </div>
  );
}
