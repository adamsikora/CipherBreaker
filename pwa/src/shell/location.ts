// Current position of the device, the counterpart of LocationActivity

import { toast } from './toast';

export interface LatLon {
  lat: number;
  lon: number;
}

/** Resolves with the position, or null after telling the user why there is none */
export function acquireLocation(): Promise<LatLon | null> {
  if (!navigator.geolocation) {
    toast('Geolocation is not available');
    return Promise.resolve(null);
  }
  toast('Acquiring Location...');
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(position => {
      toast('Location Acquired');
      resolve({ lat: position.coords.latitude, lon: position.coords.longitude });
    }, error => {
      toast(error.code === error.PERMISSION_DENIED ? 'Enable Location' : 'Location not available: ' + error.message);
      resolve(null);
    }, { enableHighAccuracy: true, timeout: 15000 });
  });
}
