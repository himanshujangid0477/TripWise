
import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const initialPlaces = {
  available: [
    { id: "place-1", name: "Hawa Mahal", category: "Historical" },
    { id: "place-2", name: "City Palace", category: "Historical" },
    { id: "place-3", name: "Jal Mahal", category: "Nature" },
    { id: "place-4", name: "Albert Hall Museum", category: "Museum" },
  ],
  "day-1": [],
  "day-2": [],
  "day-3": [],
};

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
          {places.map((place) => (
            <SortablePlace key={place.id} place={place} />
          ))}
        </SortableContext>

        {places.length === 0 && (
          <p className="itinerary-empty">Drag places here</p>
        )}
      </div>
    </div>
  );
}

import { useDroppable } from "@dnd-kit/core";

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
        if (oldIndex === -1 || newIndex === -1) return currentItems;

        return {
          ...currentItems,
          [source]: arrayMove(sourceItems, oldIndex, newIndex),
        };
      }

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
          <DayColumn id="day-1" title="Day 1" places={items["day-1"]} />
          <DayColumn id="day-2" title="Day 2" places={items["day-2"]} />
          <DayColumn id="day-3" title="Day 3" places={items["day-3"]} />
        </div>
      </DndContext>
    </section>
  );
}
