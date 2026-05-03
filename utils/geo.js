// Формула Haversine — обчислює відстань між двома GPS-точками в км
export const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // радіус Землі в км
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Знайти найближче місто з заданого списку
export const findClosestCity = (lat, lon, cityList) => {
  let closest = null;
  let minDistance = Infinity;
  for (const c of cityList) {
    const d = getDistanceKm(lat, lon, c.latitude, c.longitude);
    if (d < minDistance) {
      minDistance = d;
      closest = c;
    }
  }
  return closest;
};