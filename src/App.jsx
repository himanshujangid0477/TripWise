
import BudgetTracker from "./components/BudgetTracker";
import ItineraryPlanner from "./components/ItineraryPlanner";
import MapView from "./components/MapView";
import Navbar from "./components/Navbar";
import useLocalStorage from "./hooks/useLocalStorage";
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

const trips = [
  {
    name: "Jaipur Explorer",
    location: "Jaipur, Rajasthan",
    dates: "Nov 12 – Nov 15, 2026",
    days: "4 Days",
    budget: "₹12,000",
    spent: "₹4,500",
    progress: 38,
    image:
      "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=900",
    tag: "Cultural trip",
  },
  {
    name: "Himalayan Escape",
    location: "Manali, Himachal Pradesh",
    dates: "Dec 05 – Dec 09, 2026",
    days: "5 Days",
    budget: "₹18,000",
    spent: "₹2,000",
    progress: 11,
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=900",
    tag: "Adventure",
  },
];

const stats = [
  { label: "Total trips", value: "08", icon: Plane },
  { label: "Places saved", value: "24", icon: MapPin },
  { label: "Total budget", value: "₹45,000", icon: Wallet },
  { label: "Travel days", value: "16", icon: CalendarDays },
];

export default function App() {
  const [savedPlaceIds, setSavedPlaceIds] = useLocalStorage(
    "tripwise-saved-places",
    []
  );

  const savePlace = (id) =>
    setSavedPlaceIds((current) =>
      current.includes(id) ? current : [...current, id]
    );

  const removePlace = (id) =>
    setSavedPlaceIds((current) => current.filter((item) => item !== id));

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

            <button className="primary-button">
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

        <section className="map-section">
  <div className="section-heading">
    <div>
      <span className="section-label">DISCOVER PLACES</span>
      <h2>Explore the map</h2>
    </div>
  </div>

  <MapView savedPlaceIds={savedPlaceIds} onSave={savePlace} onRemove={removePlace} />
</section>
<section className="itinerary-section">
  <ItineraryPlanner />
</section>
<section className="budget-section-wrapper">
  <BudgetTracker />
</section>
        <section className="trips-section">
          <div className="section-heading">
            <div>
              <span className="section-label">YOUR JOURNEY</span>
              <h2>Upcoming trips</h2>
            </div>

            <button className="text-button">
              View all <ArrowRight size={16} />
            </button>
          </div>

          <div className="trip-grid">
            {trips.map((trip) => (
              <article className="trip-card" key={trip.name}>
                <div className="trip-image">
                  <img src={trip.image} alt={trip.name} />
                  <span className="trip-tag">{trip.tag}</span>
                </div>

                <div className="trip-content">
                  <h3>{trip.name}</h3>

                  <div className="trip-detail">
                    <MapPin size={15} />
                    {trip.location}
                  </div>

                  <div className="trip-detail">
                    <CalendarDays size={15} />
                    {trip.dates}
                  </div>

                  <div className="trip-divider" />

                  <div className="trip-budget">
                    <span>Budget used</span>
                    <strong>
                      {trip.spent} <small>/ {trip.budget}</small>
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${trip.progress}%` }}
                    />
                  </div>

                  <div className="trip-footer">
                    <span>
                      <Clock3 size={14} /> {trip.days}
                    </span>
                    <button aria-label={`Open ${trip.name}`}>
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
