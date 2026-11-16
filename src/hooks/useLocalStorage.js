import { useCallback, useSyncExternalStore } from "react";

// Small shared store on top of localStorage. Every component that uses the
// same key sees the same value and re-renders when it changes (also across
// browser tabs), so import/export and the share view can read and write the
// same data as the planner, budget tracker and checklist.

const listeners = new Set();
const cache = new Map();

function subscribe(callback) {
  listeners.add(callback);
  window.addEventListener("storage", callback);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function readRaw(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function read(key, initialValue) {
  const raw = readRaw(key);
  const cached = cache.get(key);

  if (cached && (cached.raw === raw || (raw === null && cached.memory))) {
    return cached.value;
  }

  let value = initialValue;

  if (raw !== null) {
    try {
      value = JSON.parse(raw);
    } catch {
      value = initialValue;
    }
  }

  cache.set(key, { raw, value });
  return value;
}

function write(key, value) {
  let raw = null;
  let memory = false;

  try {
    raw = JSON.stringify(value);
    window.localStorage.setItem(key, raw);
  } catch {
    // Storage unavailable or full: keep the value in memory for this session.
    raw = null;
    memory = true;
  }

  cache.set(key, { raw, value, memory });
  listeners.forEach((listener) => listener());
}

// For code that is not a React component (import, export, share view).
export function getStored(key, initialValue) {
  return read(key, initialValue);
}

export function setStored(key, value) {
  write(key, value);
}

export default function useLocalStorage(key, initialValue) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, initialValue),
    () => initialValue
  );

  const setValue = useCallback(
    (next) => {
      const current = read(key, initialValue);
      write(key, typeof next === "function" ? next(current) : next);
    },
    // initialValue only matters before the first read, which already happened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  return [value, setValue];
}
