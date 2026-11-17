import { places } from "../data/places";
import {
  categories,
  DEFAULT_TOTAL_BUDGET,
  defaultCategoryBudgets,
  initialExpenses,
  rates,
} from "../data/budget";
import { getStored, setStored } from "../hooks/useLocalStorage";
import { normalize, uid } from "./checklist";
import { DAY_KEYS } from "./ics";
import { isValidDate } from "./format";

export const KEYS = {
  trip: "tripwise-trip",
  saved: "tripwise-saved-places",
  itinerary: "tripwise-itinerary",
  budget: "tripwise-budget",
  expenses: "tripwise-expenses",
  categoryBudgets: "tripwise-category-budgets",
  checklist: "tripwise-checklist",
};

export const defaultTrip = { name: "Jaipur Explorer", startDate: "2026-12-05" };
export const emptyItinerary = { "day-1": [], "day-2": [], "day-3": [] };

const MAX_EXPENSES = 500;
const MAX_CHECKLIST_ITEMS = 500;
const MAX_DEPTH = 5;

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

// Reads everything the app stores, in the same shape the export file uses.
export function loadTrip() {
  return {
    trip: getStored(KEYS.trip, defaultTrip),
    savedPlaceIds: getStored(KEYS.saved, []),
    itinerary: getStored(KEYS.itinerary, emptyItinerary),
    budget: {
      total: getStored(KEYS.budget, DEFAULT_TOTAL_BUDGET),
      categoryBudgets: getStored(KEYS.categoryBudgets, defaultCategoryBudgets),
      expenses: getStored(KEYS.expenses, initialExpenses),
    },
    checklist: getStored(KEYS.checklist, []),
  };
}

export function buildExport() {
  return {
    app: "TripWise",
    version: 1,
    exportedAt: new Date().toISOString(),
    ...loadTrip(),
  };
}

export function applyTrip(value) {
  setStored(KEYS.trip, value.trip);
  setStored(KEYS.saved, value.savedPlaceIds);
  setStored(KEYS.itinerary, value.itinerary);
  setStored(KEYS.budget, value.budget.total);
  setStored(KEYS.categoryBudgets, value.budget.categoryBudgets);
  setStored(KEYS.expenses, value.budget.expenses);
  setStored(KEYS.checklist, value.checklist);
}

// Checks imported data piece by piece and returns readable problems instead of
// letting bad data reach the app. Nothing is applied unless every check passes.
export function validateTrip(data) {
  const errors = [];
  const fail = (message) => {
    if (errors.length < 10) errors.push(message);
  };

  if (!isObject(data)) {
    return { ok: false, errors: ["The file does not contain a TripWise trip."] };
  }

  if (data.app !== "TripWise") fail('The file is not a TripWise export (missing app "TripWise").');
  if (data.version !== 1) fail(`Unsupported file version: ${String(data.version)} (expected 1).`);

  const placeIds = new Set(places.map((place) => place.id));

  // trip
  const trip = { ...defaultTrip };
  if (!isObject(data.trip)) {
    fail("trip is missing or not an object.");
  } else {
    const name = data.trip.name;
    if (typeof name === "string" && name.trim() && name.length <= 80) {
      trip.name = name.trim();
    } else {
      fail("trip.name must be text of 1 to 80 characters.");
    }

    if (isValidDate(data.trip.startDate)) {
      trip.startDate = data.trip.startDate;
    } else {
      fail("trip.startDate must be a real date in YYYY-MM-DD format.");
    }
  }

  // itinerary
  const itinerary = { "day-1": [], "day-2": [], "day-3": [] };
  const planned = new Set();
  if (!isObject(data.itinerary)) {
    fail("itinerary is missing or not an object.");
  } else {
    DAY_KEYS.forEach((key) => {
      const list = data.itinerary[key];
      if (!Array.isArray(list)) {
        fail(`itinerary.${key} must be a list of place ids.`);
        return;
      }

      list.forEach((id) => {
        if (!placeIds.has(id)) {
          fail(`itinerary.${key} contains an unknown place id: ${String(id)}.`);
        } else if (planned.has(id)) {
          fail(`Place ${id} appears more than once in the itinerary.`);
        } else {
          planned.add(id);
          itinerary[key].push(id);
        }
      });
    });
  }

  // saved places (optional, always includes the planned ones)
  const saved = [];
  if (data.savedPlaceIds !== undefined) {
    if (!Array.isArray(data.savedPlaceIds)) {
      fail("savedPlaceIds must be a list of place ids.");
    } else {
      data.savedPlaceIds.forEach((id) => {
        if (!placeIds.has(id)) fail(`savedPlaceIds contains an unknown place id: ${String(id)}.`);
        else if (!saved.includes(id)) saved.push(id);
      });
    }
  }
  planned.forEach((id) => {
    if (!saved.includes(id)) saved.push(id);
  });

  // budget
  const budget = {
    total: DEFAULT_TOTAL_BUDGET,
    categoryBudgets: { ...defaultCategoryBudgets },
    expenses: [],
  };

  if (!isObject(data.budget)) {
    fail("budget is missing or not an object.");
  } else {
    const { total, categoryBudgets, expenses } = data.budget;

    if (Number.isFinite(total) && total > 0 && total <= 1e9) {
      budget.total = total;
    } else {
      fail("budget.total must be a number greater than 0.");
    }

    if (!isObject(categoryBudgets)) {
      fail("budget.categoryBudgets must be an object.");
    } else {
      categories.forEach((name) => {
        const value = categoryBudgets[name];
        if (value === undefined) return;
        if (Number.isFinite(value) && value >= 0 && value <= 1e9) {
          budget.categoryBudgets[name] = value;
        } else {
          fail(`budget.categoryBudgets.${name} must be a number of 0 or more.`);
        }
      });

      const allocated = categories.reduce(
        (sum, name) => sum + budget.categoryBudgets[name],
        0
      );
      if (allocated > budget.total) {
        fail(
          `Category budgets total ${allocated} but the trip budget is ${budget.total}.`
        );
      }
    }

    if (!Array.isArray(expenses)) {
      fail("budget.expenses must be a list.");
    } else if (expenses.length > MAX_EXPENSES) {
      fail(`budget.expenses has more than ${MAX_EXPENSES} entries.`);
    } else {
      const base = Date.now();
      expenses.forEach((expense, index) => {
        const label = `budget.expenses[${index}]`;
        if (!isObject(expense)) return fail(`${label} must be an object.`);
        if (typeof expense.title !== "string" || !expense.title.trim() || expense.title.length > 100)
          return fail(`${label}.title must be text of 1 to 100 characters.`);
        if (!categories.includes(expense.category))
          return fail(`${label}.category must be one of: ${categories.join(", ")}.`);
        if (!Number.isFinite(expense.amount) || expense.amount <= 0 || expense.amount > 1e9)
          return fail(`${label}.amount must be a number greater than 0.`);
        if (!Object.prototype.hasOwnProperty.call(rates, expense.currency))
          return fail(`${label}.currency must be one of: ${Object.keys(rates).join(", ")}.`);

        budget.expenses.push({
          id: base + index,
          title: expense.title.trim(),
          category: expense.category,
          amount: expense.amount,
          currency: expense.currency,
        });
      });
    }
  }

  // checklist (optional, nested)
  let count = 0;
  const readNode = (node, depth, path) => {
    if (!isObject(node)) {
      fail(`${path} must be an object.`);
      return null;
    }
    count += 1;
    if (count > MAX_CHECKLIST_ITEMS) {
      fail(`The checklist has more than ${MAX_CHECKLIST_ITEMS} items.`);
      return null;
    }
    if (depth > MAX_DEPTH) {
      fail(`${path} is nested deeper than ${MAX_DEPTH} levels.`);
      return null;
    }
    if (typeof node.text !== "string" || !node.text.trim() || node.text.length > 120) {
      fail(`${path}.text must be text of 1 to 120 characters.`);
      return null;
    }
    if (node.children !== undefined && !Array.isArray(node.children)) {
      fail(`${path}.children must be a list.`);
      return null;
    }

    const children = (node.children ?? [])
      .map((child, index) => readNode(child, depth + 1, `${path}.children[${index}]`))
      .filter(Boolean);

    return { id: uid(), text: node.text.trim(), done: Boolean(node.done), children };
  };

  let checklist = [];
  if (data.checklist !== undefined) {
    if (!Array.isArray(data.checklist)) {
      fail("checklist must be a list.");
    } else {
      checklist = normalize(
        data.checklist
          .map((node, index) => readNode(node, 0, `checklist[${index}]`))
          .filter(Boolean)
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    value: { trip, savedPlaceIds: saved, itinerary, budget, checklist },
  };
}

// Share links carry the trip data inside the URL, so they work on any device.
export function encodeShare(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShare(text) {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function buildShareLink() {
  const { exportedAt, ...data } = buildExport();
  void exportedAt;
  return `${window.location.origin}${window.location.pathname}#/share?d=${encodeShare(data)}`;
}
