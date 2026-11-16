
import { useMemo } from "react";
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

import useLocalStorage from "../hooks/useLocalStorage";
import { addDays, formatDay } from "../utils/format";
import { estimateTravelTime } from "../utils/travel";
import { defaultTrip, KEYS } from "../utils/tripData";

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

function DayColumn({
  id,
  title,
  subtitle,
  places,
  showTravel = true,
  emptyText = "Drag places here",
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="itinerary-day">
      <h3>
        {title}
        {subtitle && <small className="day-date">{subtitle}</small>}
      </h3>

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

              {showTravel && index < places.length - 1 && (
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
          <p className="itinerary-empty">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

export default function ItineraryPlanner({
  savedPlaces,
  itinerary,
  setItinerary,
}) {
  const [trip] = useLocalStorage(KEYS.trip, defaultTrip);
  const dayDate = (index) => formatDay(addDays(trip.startDate, index));

  const items = useMemo(() => {
    const assigned = new Set(Object.values(itinerary).flat());
    const byId = (id) => savedPlaces.find((place) => place.id === id);

    return {
      available: savedPlaces.filter((place) => !assigned.has(place.id)),
      "day-1": itinerary["day-1"].map(byId).filter(Boolean),
      "day-2": itinerary["day-2"].map(byId).filter(Boolean),
      "day-3": itinerary["day-3"].map(byId).filter(Boolean),
    };
  }, [savedPlaces, itinerary]);

  const setItems = (updater) => {
    const next = updater(items);
    if (next === items) return;

    setItinerary({
      "day-1": next["day-1"].map((place) => place.id),
      "day-2": next["day-2"].map((place) => place.id),
      "day-3": next["day-3"].map((place) => place.id),
    });
  };

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
            showTravel={false}
            emptyText="No unscheduled places. Save places on the map to add them here."
            places={items.available}
          />

          <DayColumn
            id="day-1"
            title="Day 1"
            subtitle={dayDate(0)}
            places={items["day-1"]}
          />

          <DayColumn
            id="day-2"
            title="Day 2"
            subtitle={dayDate(1)}
            places={items["day-2"]}
          />

          <DayColumn
            id="day-3"
            title="Day 3"
            subtitle={dayDate(2)}
            places={items["day-3"]}
          />
        </div>
      </DndContext>
    </section>
  );
}
