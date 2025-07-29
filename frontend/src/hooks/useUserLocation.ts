import { useState, useEffect, useCallback } from 'react';
import { useMap } from '../contexts/MapContext';
import { MAP_CONFIG, LAGOS_CENTER } from '../utils/constants';
import toast from 'react-hot-toast';

interface UserLocationState {
  location: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean | null;
}

export const useUserLocation = () => {
  const [state, setState] = useState<UserLocationState>({
    location: null,
    loading: false,
    error: null,
    hasPermission: null
  });

  const { setCenter, setZoom } = useMap();

  // Get user's current location
  const getCurrentLocation = useCallback(async (options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    showToast?: boolean;
  }) => {
    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 60000,
      showToast = false
    } = options || {};

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy,
            timeout,
            maximumAge
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const location = { lat: latitude, lng: longitude };

      setState(prev => ({
        ...prev,
        location,
        loading: false,
        hasPermission: true,
        error: null
      }));

      if (showToast) {
        toast.success('Location found!');
      }

      return location;
    } catch (error) {
      let errorMessage = 'Failed to get your location';

      if (error instanceof GeolocationPositionError) {
        setState(prev => ({ ...prev, hasPermission: false }));
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      if (showToast) {
        toast.error(errorMessage);
      }

      return null;
    }
  }, []);

  // Center map on user's location
  const centerMapOnUserLocation = useCallback(async (zoomLevel?: number) => {
    const location = await getCurrentLocation({ showToast: true });
    if (location) {
      setCenter([location.lat, location.lng]);
      setZoom(zoomLevel || MAP_CONFIG.userLocationZoom);
      return true;
    }
    return false;
  }, [getCurrentLocation, setCenter, setZoom]);

  // Center map on Lagos with appropriate zoom
  const centerMapOnLagos = useCallback(() => {
    setCenter([LAGOS_CENTER.lat, LAGOS_CENTER.lng]);
    setZoom(MAP_CONFIG.lagosZoom);
  }, [setCenter, setZoom]);

  // Initialize location on mount (silent attempt)
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const location = await getCurrentLocation({
          timeout: 5000,
          showToast: false
        });

        if (location) {
          // Check if user is in Lagos area (rough bounds check)
          const isInLagos =
            location.lat >= 6.3 && location.lat <= 6.8 &&
            location.lng >= 3.0 && location.lng <= 3.7;

          if (isInLagos) {
            // User is in Lagos, center on their location
            setCenter([location.lat, location.lng]);
            setZoom(MAP_CONFIG.userLocationZoom);
          } else {
            // User is outside Lagos, show Lagos bounds but store their location
            centerMapOnLagos();
          }
        } else {
          // Failed to get location, show Lagos
          centerMapOnLagos();
        }
      } catch {
        // Silent fail, just show Lagos
        centerMapOnLagos();
      }
    };

    initializeLocation();
  }, [getCurrentLocation, setCenter, setZoom, centerMapOnLagos]);

  return {
    ...state,
    getCurrentLocation,
    centerMapOnUserLocation,
    centerMapOnLagos
  };
};
