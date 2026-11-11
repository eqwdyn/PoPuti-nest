const RADIUS_TO_LAT_DEG = 1 / 111; // 1 градус широты ≈ 111 км

export function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm * RADIUS_TO_LAT_DEG;
  // 1 градус долготы короче на высоких широтах — делим на cos(lat)
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}
