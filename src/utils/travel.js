// Straight-line distance using the Haversine formula (kilometres).
export function calculateDistance(pointA, pointB) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371;

  const lat1 = toRadians(pointA[0]);
  const lat2 = toRadians(pointB[0]);
  const deltaLat = toRadians(pointB[0] - pointA[0]);
  const deltaLon = toRadians(pointB[1] - pointA[1]);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Mock road estimate: 30 km/h average speed and a 1.3 road-distance factor.
export function estimateTravelTime(pointA, pointB) {
  const roadDistance = calculateDistance(pointA, pointB) * 1.3;
  return Math.max(1, Math.round((roadDistance / 30) * 60));
}
