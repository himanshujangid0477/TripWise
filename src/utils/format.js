export const formatINR = (value) =>
  `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function toUTC(value) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function addDays(value, days) {
  const date = new Date(toUTC(value) + days * 86400000);
  return date.toISOString().slice(0, 10);
}

export function diffDays(from, to) {
  return Math.round((toUTC(to) - toUTC(from)) / 86400000);
}

export function formatDay(value) {
  return new Date(toUTC(value)).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatShort(value) {
  return new Date(toUTC(value)).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatRange(startDate, days) {
  const end = addDays(startDate, days - 1);
  const year = new Date(toUTC(end)).getUTCFullYear();
  return `${formatShort(startDate)} – ${formatShort(end)}, ${year}`;
}
