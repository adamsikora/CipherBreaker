import { describe, expect, it } from 'vitest';
import { destination } from '../src/logic/azimuth';

// Roughly a centimeter
const delta = 1e-7;

function expectDestination(expectedLat: number, expectedLon: number,
                           lat: number, lon: number, distance: number, angle: number) {
  const [destLat, destLon] = destination(lat, lon, distance, angle);
  expect(Math.abs(destLat - expectedLat)).toBeLessThan(delta);
  expect(Math.abs(destLon - expectedLon)).toBeLessThan(delta);
}

describe('destination', () => {
  it('stays in place at zero distance', () => {
    expectDestination(50.0, 14.0, 50.0, 14.0, 0.0, 0.0);
    expectDestination(50.0, 14.0, 50.0, 14.0, 0.0, 123.0);
  });

  it('follows cardinal directions', () => {
    expectDestination(50.0089932, 14.0, 50.0, 14.0, 1000.0, 0.0);
    expectDestination(49.9999992, 14.0139910, 50.0, 14.0, 1000.0, 90.0);
    expectDestination(49.9910068, 14.0, 50.0, 14.0, 1000.0, 180.0);
    expectDestination(49.9999992, 13.9860090, 50.0, 14.0, 1000.0, 270.0);
  });

  it('treats a full circle as north', () => {
    expectDestination(50.0089932, 14.0, 50.0, 14.0, 1000.0, 360.0);
  });

  it('handles a general azimuth', () => {
    expectDestination(50.0063587, 14.0098944, 50.0, 14.0, 1000.0, 45.0);
    expectDestination(50.0821268, 14.3980316, 50.0833514, 14.3950931, 250.0, 123.0);
  });

  it('reaches a quarter of the globe', () => {
    const quarter = 6371000 * Math.PI / 2;
    expectDestination(90.0, 0.0, 0.0, 0.0, quarter, 0.0);
    expectDestination(0.0, 90.0, 0.0, 0.0, quarter, 90.0);
  });
});
