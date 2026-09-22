import { useState, useCallback } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        setLoading(false);
      },
      (err) => {
        let msg = 'Failed to obtain current location.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Location permission was denied. Please allow location access in your browser settings to mark attendance.';
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'Location information is currently unavailable.';
            break;
          case err.TIMEOUT:
            msg = 'Request to get location timed out. Please try again.';
            break;
          default:
            msg = err.message || msg;
        }
        setError(msg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  return { location, error, loading, getLocation, setLocation };
}

export default useGeolocation;
