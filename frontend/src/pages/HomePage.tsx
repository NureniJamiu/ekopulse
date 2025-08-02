import React, { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMap } from '../contexts/MapContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useUserLocation } from '../hooks/useUserLocation';
import { issuesAPI, IssueType } from '../utils/api';
import MapComponent from '../components/map/MapComponent';
import IssueReportModal from '../components/issues/IssueReportModal';
import IssueDetailPanel from '../components/issues/IssueDetailPanel';
import MapFilters from '../components/map/MapFilters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LocationReportButton from '../components/common/LocationReportButton';
import AgencyLandingBanner from '../components/landing/AgencyLandingBanner';
import toast from 'react-hot-toast';

const HomePage: React.FC = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const {
    setIssues,
    addIssue,
    updateIssue,
    selectedIssue,
    isReportModalOpen,
    closeReportModal
  } = useMap();

  useUserLocation();

  const handleNewIssue = useCallback((newIssue: IssueType) => {
    addIssue(newIssue);
  }, [addIssue]);

  const handleIssueUpdate = useCallback((updatedIssue: IssueType) => {
    updateIssue(updatedIssue);
  }, [updateIssue]);

  const handleMapUpdate = useCallback((mapUpdate: { type: string; data: IssueType }) => {
    if (mapUpdate.type === 'new_issue') {
      addIssue(mapUpdate.data);
    } else if (mapUpdate.type === 'issue_updated') {
      updateIssue(mapUpdate.data);
    }
  }, [addIssue, updateIssue]);

  useWebSocket(handleNewIssue, handleIssueUpdate, handleMapUpdate);

  useEffect(() => {
    const loadIssues = async () => {
      try {
        const response = await issuesAPI.getIssues({ limit: 100 });
        setIssues(response.data);
      } catch (error) {
        console.error('Error loading issues:', error);
        toast.error('Failed to load issues');
      }
    };

    loadIssues();
  }, [setIssues]);

  const handleIssueCreated = (newIssue: any) => {
    addIssue(newIssue);
    closeReportModal();
    toast.success('Issue reported successfully!');
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50 relative">
      {/* Agency Landing Banner for unauthenticated users - positioned absolutely */}
      <AgencyLandingBanner />

      <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Main Map Area */}
        <div className="flex-1 relative">
        {/* Map Filters */}
        <div className="absolute top-4 left-4 z-10">
          <MapFilters />
        </div>

        {/* Location-based Report Button */}
        <div className="absolute bottom-8 right-6 md:bottom-8 md:right-8 z-20">
          <LocationReportButton />
        </div>

        {/* Map Component */}
        <MapComponent />

        {/* Issue Report Modal */}
        {isReportModalOpen && (
          <IssueReportModal
            isOpen={isReportModalOpen}
            onClose={closeReportModal}
            onIssueCreated={handleIssueCreated}
          />
        )}
      </div>

      {/* Issue Detail Panel */}
      {selectedIssue && (
        <div className="w-96 bg-white shadow-lg border-l border-gray-200">
          <IssueDetailPanel
            issue={selectedIssue}
            onUpdate={updateIssue}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default HomePage;
