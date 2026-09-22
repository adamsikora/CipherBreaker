// Port of Azimuth.kt

const EARTH_RADIUS_METERS = 6371000;

const toRad = (degrees: number) => degrees * Math.PI / 180;
const toDeg = (radians: number) => radians * 180 / Math.PI;

/**
 * Returns latitude and longitude of the point reached from given position
 * after travelling given distance (in meters) under given azimuth (in degrees).
 */
export function destination(lat: number, lon: number, distance: number, angle: number): [number, number] {
  const distRatio = distance / EARTH_RADIUS_METERS;
  const radAngle = toRad(angle);
  const radLat = toRad(lat);
  const radLon = toRad(lon);

  const newLat = Math.asin(Math.sin(radLat) * Math.cos(distRatio) + Math.cos(radLat) * Math.sin(distRatio) * Math.cos(radAngle));
  const newLon = radLon + Math.atan2(Math.sin(radAngle) * Math.sin(distRatio) * Math.cos(radLat),
    Math.cos(distRatio) - Math.sin(radLat) * Math.sin(newLat));

  return [toDeg(newLat), toDeg(newLon)];
}
