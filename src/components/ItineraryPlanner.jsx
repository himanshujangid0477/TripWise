
import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

// Mock places with geographical coordinates
const initialPlaces = {
  available: [
    {
      id: "place-1",
      name: "Hawa Mahal",
      category: "Historical",
      position: [26.9239, 75.8267],
    },
    {
      id: "place-2",
      name: "City Palace",
      category: "Historical",
      position: [26.9258, 75.8237],
    },
    {
      id: "place-3",
      name: "Jal Mahal",
      category: "Nature",
      position: [26.9538, 75.8461],
    },
    {
      id: "place-4",
      name: "Albert Hall Museum",
      category: "Museum",
      position: [26.9117, 75.8197],
    },
  ],
  "day-1": [],
  "day-2": [],
  "day-3": [],
};

// Calculate straight-line distance using the Haversine formula
function calculateDistance(pointA, pointB) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371;

  const lat1 = toRadians(pointA[0]);
  const lat2 = toRadians(pointB[0]);
  const deltaLat = toRadians(pointB[0] - pointA[0]);
  const deltaLon = toRadians(pointB[1] - pointA[1]);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Mock road travel estimate: 30 km/h average speed and 1.3 road factor
function estimateTravelTime(pointA, pointB) {
  const estimatedRoadDistance =
    calculateDistance(pointA, pointB) * 1.3;

  return Math.max(1, Math.round((estimatedRoadDistance / 30) * 60));
}

function SortablePlace({ place }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="itinerary-place"
      {...attributes}
      {...listeners}
    >
      <span className="drag-handle">⠿</span>

      <div>
        <strong>{place.name}</strong>
        <small>{place.category}</small>
      </div>
    </div>
  );
}

function DayColumn({ id, title, places }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="itinerary-day">
      <h3>{title}</h3>

      <div
        ref={setNodeRef}
        className={`itinerary-drop-area ${isOver ? "drag-over" : ""}`}
      >
        <SortableContext
          items={places.map((place) => place.id)}
          strategy={verticalListSortingStrategy}
        >
          {places.map((place, index) => (
            <div key={place.id} className="itinerary-stop">
              <SortablePlace place={place} />

              {index < places.length - 1 && (
                <div className="travel-estimate">
                  <span>↓</span>
                  <span>
                    Approx.{" "}
                    {estimateTravelTime(
                      place.position,
                      places[index + 1].position
                    )}{" "}
                    min to next stop
                  </span>
                </div>
              )}
            </div>
          ))}
        </SortableContext>

        {places.length === 0 && (
          <p className="itinerary-empty">Drag places here</p>
        )}
      </div>
    </div>
  );
}

export default function ItineraryPlanner() {
  const [items, setItems] = useState(initialPlaces);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const findContainer = (id, currentItems) => {
    if (Object.prototype.hasOwnProperty.call(currentItems, id)) {
      return id;
    }

    return Object.keys(currentItems).find((key) =>
      currentItems[key].some((place) => place.id === id)
    );
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    setItems((currentItems) => {
      const source = findContainer(active.id, currentItems);
      const destination = findContainer(over.id, currentItems);

      if (!source || !destination) return currentItems;

      const sourceItems = [...currentItems[source]];
      const destinationItems = [...currentItems[destination]];

      const oldIndex = sourceItems.findIndex(
        (place) => place.id === active.id
      );

      const newIndex = destinationItems.findIndex(
        (place) => place.id === over.id
      );

      if (source === destination) {
        if (oldIndex === -1 || newIndex === -1) {
          return currentItems;
        }

        return {
          ...currentItems,
          [source]: arrayMove(sourceItems, oldIndex, newIndex),
        };
      }

      if (oldIndex === -1) return currentItems;

      const [movedPlace] = sourceItems.splice(oldIndex, 1);

      if (newIndex === -1) {
        destinationItems.push(movedPlace);
      } else {
        destinationItems.splice(newIndex, 0, movedPlace);
      }

      return {
        ...currentItems,
        [source]: sourceItems,
        [destination]: destinationItems,
      };
    });
  };

  return (
    <section className="itinerary-planner">
      <div className="section-heading">
        <div>
          <span className="section-label">PLAN YOUR TRIP</span>
          <h2>Day-by-day itinerary</h2>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="itinerary-board">
          <DayColumn
            id="available"
            title="Available places"
            places={items.available}
          />

          <DayColumn
            id="day-1"
            title="Day 1"
            places={items["day-1"]}
          />

          <DayColumn
            id="day-2"
            title="Day 2"
            places={items["day-2"]}
          />

          <DayColumn
            id="day-3"
            title="Day 3"
            places={items["day-3"]}
          />
        </div>
      </DndContext>
    </section>
  );
}
