import { useCallback, useRef } from 'react';
import { Map as LeafletMap } from 'leaflet';
import { useMap } from '../contexts/MapContext';
import { useAuth } from '../contexts/AuthContext';
import { LAGOS_CENTER, LAGOS_BOUNDS } from '../utils/constants';
import toast from 'react-hot-toast';

export interface UseMapInteractionsReturn {
  mapRef: React.RefObject<LeafletMap | null>;
  handleMapClick: (lat: number, lng: number) => void;
  handleMarkerClick: (issueId: string) => void;
  centerOnLocation: (lat: number, lng: number, zoom?: number) => void;
  fitToBounds: () => void;
  getCurrentMapBounds: () => { north: number; south: number; east: number; west: number } | null;
}

export const useMapInteractions = (): UseMapInteractionsReturn => {
  const mapRef = useRef<LeafletMap | null>(null);
  const {
    setCenter,
    setZoom,
    setSelectedIssue,
    openReportModal,
    issues,
    filteredIssues
  } = useMap();
  const { user, isLoading } = useAuth();

  const handleMapClick = useCallback((lat: number, lng: number) => {
    // Close any selected issue
    setSelectedIssue(null);

    // Check if user is authenticated before allowing report
    if (isLoading) {
      toast.error('Please wait while we load your account...');
      return;
    }

    if (!user) {
      toast.error('Please sign in to report an issue');
      window.location.href = '/login';
      return;
    }

    // Check if click is within Lagos bounds
    const isWithinBounds =
      lat >= LAGOS_BOUNDS.south &&
      lat <= LAGOS_BOUNDS.north &&
      lng >= LAGOS_BOUNDS.west &&
      lng <= LAGOS_BOUNDS.east;

    if (isWithinBounds) {
      // Open report modal with the clicked location
      openReportModal({ lat, lng });
    } else {
      toast.error('Please click within Lagos bounds to report an issue');
    }
  }, [setSelectedIssue, openReportModal, user, isLoading]);

  const handleMarkerClick = useCallback((issueId: string) => {
    const issue = filteredIssues.find(issue => issue._id === issueId);
    if (issue) {
      setSelectedIssue(issue);
      // Center map on the issue
      const [lng, lat] = issue.location.coordinates;
      centerOnLocation(lat, lng, 15);
    }
  }, [filteredIssues, setSelectedIssue]);

  const centerOnLocation = useCallback((lat: number, lng: number, zoom = 13) => {
    setCenter([lat, lng]);
    setZoom(zoom);

    // Also center the actual map if ref is available
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], zoom);
    }
  }, [setCenter, setZoom]);

  const fitToBounds = useCallback(() => {
    const bounds = [
      [LAGOS_BOUNDS.south, LAGOS_BOUNDS.west],
      [LAGOS_BOUNDS.north, LAGOS_BOUNDS.east]
    ] as [[number, number], [number, number]];

    if (mapRef.current) {
      mapRef.current.fitBounds(bounds);
    } else {
      // Fallback to center on Lagos
      setCenter([LAGOS_CENTER.lat, LAGOS_CENTER.lng]);
      setZoom(11);
    }
  }, [setCenter, setZoom]);

  const getCurrentMapBounds = useCallback(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      return {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      };
    }
    return null;
  }, []);

  return {
    mapRef,
    handleMapClick,
    handleMarkerClick,
    centerOnLocation,
    fitToBounds,
    getCurrentMapBounds,
  };
};
