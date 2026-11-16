
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet.markercluster";

import { places, colors } from "../data/places";

export default function MapView({ savedPlaceIds, onSave, onRemove }) {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const savedPlaces = savedPlaceIds
    .map((id) => places.find((place) => place.id === id))
    .filter(Boolean);

  // Popups are created once, so they read the latest props through refs.
  const onSaveRef = useRef(onSave);
  const savedIdsRef = useRef(savedPlaceIds);

  useEffect(() => {
    onSaveRef.current = onSave;
    savedIdsRef.current = savedPlaceIds;
  }, [onSave, savedPlaceIds]);

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

      // Place detail popover shown on the pin itself.
      const popup = document.createElement("div");
      popup.className = "map-popup";

      const title = document.createElement("strong");
      title.textContent = place.name;

      const category = document.createElement("span");
      category.textContent = place.category;
      category.style.color = colors[place.category];

      const description = document.createElement("p");
      description.textContent = place.description;

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.addEventListener("click", () => {
        onSaveRef.current(place.id);
        saveButton.textContent = "Saved";
        saveButton.disabled = true;
      });

      popup.append(title, category, description, saveButton);
      marker.bindPopup(popup);

      marker.on("popupopen", () => {
        const saved = savedIdsRef.current.includes(place.id);
        saveButton.textContent = saved ? "Saved" : "+ Save place";
        saveButton.disabled = saved;
      });

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
    if (selectedPlace) onSave(selectedPlace.id);
  };

  const removePlace = (id) => onRemove(id);

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
