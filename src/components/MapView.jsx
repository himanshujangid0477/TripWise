
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet.markercluster";

const places = [
  {
    id: 1,
    name: "Hawa Mahal",
    position: [26.9239, 75.8267],
    category: "Historical",
    description: "The famous Palace of Winds in Jaipur.",
  },
  {
    id: 2,
    name: "City Palace",
    position: [26.9258, 75.8237],
    category: "Historical",
    description: "A historic royal palace complex.",
  },
  {
    id: 3,
    name: "Jal Mahal",
    position: [26.9538, 75.8461],
    category: "Nature",
    description: "A beautiful palace situated in Man Sagar Lake.",
  },
  {
    id: 4,
    name: "Albert Hall Museum",
    position: [26.9117, 75.8197],
    category: "Museum",
    description: "A museum showcasing art and history.",
  },
];

const colors = {
  Historical: "#d97706",
  Nature: "#159b75",
  Museum: "#6366f1",
};

export default function MapView() {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [savedPlaces, setSavedPlaces] = useState([]);

  useEffect(() => {
    const map = L.map("tripwise-map").setView(
      [26.9124, 75.7873],
      12
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      }
    ).addTo(map);

    const markers = L.markerClusterGroup();

    places.forEach((place) => {
      const icon = L.divIcon({
        className: "custom-map-marker",
        html: `<div style="
          background:${colors[place.category]};
          width:18px;
          height:18px;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 7px #0005;
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(place.position, { icon });

      marker.on("click", () => {
        setSelectedPlace(place);
      });

      markers.addLayer(marker);
    });

    map.addLayer(markers);

    return () => {
      map.remove();
    };
  }, []);

  const savePlace = () => {
    if (
      selectedPlace &&
      !savedPlaces.some((p) => p.id === selectedPlace.id)
    ) {
      setSavedPlaces((previous) => [
        ...previous,
        selectedPlace,
      ]);
    }
  };

  const removePlace = (id) => {
    setSavedPlaces((previous) =>
      previous.filter((place) => place.id !== id)
    );
  };

  return (
    <div className="map-module">
      <div id="tripwise-map" />

      <div className="map-legend">
        {Object.entries(colors).map(([category, color]) => (
          <span key={category}>
            <i style={{ background: color }} />
            {category}
          </span>
        ))}
      </div>

      {selectedPlace && (
        <div className="place-details">
          <div>
            <span className="section-label">
              {selectedPlace.category}
            </span>

            <h3>{selectedPlace.name}</h3>

            <p>{selectedPlace.description}</p>
          </div>

          <div className="place-actions">
            <button onClick={savePlace}>
              {savedPlaces.some(
                (p) => p.id === selectedPlace.id
              )
                ? "Already saved"
                : "+ Save place"}
            </button>

            <button
              className="close-place"
              onClick={() => setSelectedPlace(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="saved-places">
        <h3>Saved places ({savedPlaces.length})</h3>

        {savedPlaces.length === 0 ? (
          <p>No saved places yet. Select a map marker to save one.</p>
        ) : (
          savedPlaces.map((place) => (
            <div className="saved-place" key={place.id}>
              <div>
                <strong>{place.name}</strong>
                <small>{place.category}</small>
              </div>

              <button onClick={() => removePlace(place.id)}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
