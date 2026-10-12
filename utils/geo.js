// Haversine distance calculator in kilometers
// Supports coordinates as [longitude, latitude] arrays or { lat, lng } objects
function haversineDistance(coords1, coords2) {
  if (!coords1 || !coords2) return null;

  let lon1, lat1, lon2, lat2;

  if (Array.isArray(coords1)) {
    [lon1, lat1] = coords1;
  } else if (typeof coords1 === "object") {
    lon1 = coords1.lng ?? coords1.lon ?? coords1.longitude;
    lat1 = coords1.lat ?? coords1.latitude;
  }

  if (Array.isArray(coords2)) {
    [lon2, lat2] = coords2;
  } else if (typeof coords2 === "object") {
    lon2 = coords2.lng ?? coords2.lon ?? coords2.longitude;
    lat2 = coords2.lat ?? coords2.latitude;
  }

  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  lat1 = Number(lat1);
  lon1 = Number(lon1);
  lat2 = Number(lat2);
  lon2 = Number(lon2);

  if (Number.isNaN(lat1) || Number.isNaN(lon1) || Number.isNaN(lat2) || Number.isNaN(lon2)) {
    return null;
  }

  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusKm * c;

  return Math.round(distance * 10) / 10;
}

module.exports = {
  haversineDistance,
};
