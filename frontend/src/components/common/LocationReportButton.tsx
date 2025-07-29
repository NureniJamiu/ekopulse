import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useMap } from '../../contexts/MapContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserLocation } from '../../hooks/useUserLocation';
import toast from 'react-hot-toast';

const LocationReportButton: React.FC = () => {
  const [showPulse, setShowPulse] = useState(true);
  const { openReportModal } = useMap();
  const { user } = useAuth();
  const { loading: isGettingLocation, getCurrentLocation } = useUserLocation();

  // Hide pulse animation after a few seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowPulse(false);
    }, 5000); // Show pulse for 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const getCurrentLocationAndReport = async () => {
    // Stop pulse animation when user interacts
    setShowPulse(false);

    // Check if user is authenticated before proceeding
    if (!user) {
      toast.error('Please sign in to report issues');
      return;
    }

    try {
      const location = await getCurrentLocation({
        showToast: false,
        enableHighAccuracy: true,
        timeout: 10000
      });

      if (location) {
        // Open report modal with user's exact coordinates
        openReportModal({ lat: location.lat, lng: location.lng });
        toast.success('Location found! Report form opened with your current location.');
      }
    } catch (error) {
      // Error handling is done in the hook
      console.error('Location error:', error);
    }
  };  return (
    <div className="relative group/tooltip">
      <button
        onClick={getCurrentLocationAndReport}
        disabled={isGettingLocation}
        className={`
          group flex items-center gap-3 px-6 py-4 rounded-xl font-semibold text-white text-base
          shadow-2xl hover:shadow-3xl transform transition-all duration-200 min-w-[140px] justify-center
          border-2 border-white/20 backdrop-blur-sm
          ${showPulse && !isGettingLocation ? 'animate-pulse shadow-emerald-500/50' : ''}
          ${isGettingLocation
            ? 'bg-emerald-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 hover:scale-105 active:scale-95 hover:shadow-emerald-500/30'
          }
        `}
      >
        {isGettingLocation ? (
          <>
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            <span>Finding you...</span>
          </>
        ) : (
          <>
            <div className="relative">
              <MapPin className="w-6 h-6" />
              <Navigation className="w-4 h-4 absolute -top-1 -right-1 text-emerald-200 group-hover:text-white transition-colors" />
            </div>
            <span>Report Here</span>
          </>
        )}
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg
                      opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200
                      whitespace-nowrap pointer-events-none shadow-xl">
        <div className="relative">
          🎯 Get your location & report instantly
          <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4
                          border-l-transparent border-r-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
};

export default LocationReportButton;
