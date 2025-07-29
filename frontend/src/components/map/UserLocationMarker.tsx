import React from 'react';
import { Marker } from 'react-leaflet';
import { DivIcon } from 'leaflet';

interface UserLocationMarkerProps {
  position: [number, number];
}

// Create a custom div icon with "You are here" text
const createUserLocationIcon = () => {
  return new DivIcon({
    html: `
      <div class="flex flex-col items-center">
        <div class="relative">
          <div class="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg user-location-marker"></div>
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
        </div>
        <div class="mt-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap">
          📍 You are here
        </div>
      </div>
    `,
    className: 'user-location-div-icon',
    iconSize: [100, 60],
    iconAnchor: [50, 30],
  });
};

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ position }) => {
  return (
    <Marker
      position={position}
      icon={createUserLocationIcon()}
      zIndexOffset={1000} // Ensure it appears above other markers
    />
  );
};

export default UserLocationMarker;
