import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LatLngExpression } from 'leaflet';
import { LAGOS_CENTER } from '../utils/constants';
import { IssueType } from '../utils/api';

interface MapContextType {
  center: LatLngExpression;
  zoom: number;
  selectedIssue: IssueType | null;
  isReportModalOpen: boolean;
  selectedLocation: { lat: number; lng: number } | null;
  issues: IssueType[];
  filteredIssues: IssueType[];
  filters: {
    status: string[];
    type: string[];
  };

  // Actions
  setCenter: (center: LatLngExpression) => void;
  setZoom: (zoom: number) => void;
  setSelectedIssue: (issue: IssueType | null) => void;
  openReportModal: (location?: { lat: number; lng: number }) => void;
  closeReportModal: () => void;
  setSelectedLocation: (location: { lat: number; lng: number } | null) => void;
  setIssues: (issues: IssueType[]) => void;
  addIssue: (issue: IssueType) => void;
  updateIssue: (updatedIssue: IssueType) => void;
  setFilters: (filters: { status: string[]; type: string[] }) => void;
  clearFilters: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const [center, setCenter] = useState<LatLngExpression>([LAGOS_CENTER.lat, LAGOS_CENTER.lng]);
  const [zoom, setZoom] = useState<number>(11);
  const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [issues, setIssues] = useState<IssueType[]>([]);
  const [filters, setFilters] = useState<{ status: string[]; type: string[] }>({
    status: [],
    type: []
  });

  // Filter issues based on current filters
  const filteredIssues = React.useMemo(() => {
    return issues.filter(issue => {
      const statusMatch = filters.status.length === 0 || filters.status.includes(issue.status);
      const typeMatch = filters.type.length === 0 || filters.type.includes(issue.type);
      return statusMatch && typeMatch;
    });
  }, [issues, filters]);

  const openReportModal = useCallback((location?: { lat: number; lng: number }) => {
    setSelectedLocation(location || null);
    setIsReportModalOpen(true);
  }, []);

  const closeReportModal = useCallback(() => {
    setIsReportModalOpen(false);
    setSelectedLocation(null);
  }, []);

  const addIssue = useCallback((issue: IssueType) => {
    setIssues(prev => [issue, ...prev]);
  }, []);

  const updateIssue = useCallback((updatedIssue: IssueType) => {
    setIssues(prev =>
      prev.map(issue =>
        issue._id === updatedIssue._id ? updatedIssue : issue
      )
    );

    // Update selectedIssue if it's the one being updated
    if (selectedIssue && selectedIssue._id === updatedIssue._id) {
      setSelectedIssue(updatedIssue);
    }
  }, [selectedIssue]);

  const clearFilters = useCallback(() => {
    setFilters({ status: [], type: [] });
  }, []);

  const value: MapContextType = {
    center,
    zoom,
    selectedIssue,
    isReportModalOpen,
    selectedLocation,
    issues,
    filteredIssues,
    filters,

    // Actions
    setCenter,
    setZoom,
    setSelectedIssue,
    openReportModal,
    closeReportModal,
    setSelectedLocation,
    setIssues,
    addIssue,
    updateIssue,
    setFilters,
    clearFilters,
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = (): MapContextType => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
