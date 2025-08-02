import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { useMap } from '../../contexts/MapContext';
import { useMapInteractions } from '../../hooks/useMapInteractions';
import { useUserLocation } from '../../hooks/useUserLocation';
import { MAP_CONFIG } from '../../utils/constants';
import { getIssueTypeConfig } from '../../utils/helpers';
import UserLocationMarker from './UserLocationMarker';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (type: string) => {
  const config = getIssueTypeConfig(type);

  const svgString = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${config.color}"/>
      <circle cx="12.5" cy="12.5" r="7" fill="white"/>
      <circle cx="12.5" cy="12.5" r="4" fill="${config.color}"/>
    </svg>
  `;

  // Use proper base64 encoding for UTF-8 strings
  // Use proper base64 encoding for UTF-8 strings
  const base64String = btoa(unescape(encodeURIComponent(svgString)));

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${base64String}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

const MapEventHandler: React.FC = () => {
  const { handleMapClick } = useMapInteractions();

  useMapEvents({
    click: (e) => {
      handleMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
};

const MapComponent: React.FC = () => {
  const { filteredIssues, center, zoom } = useMap();
  const { handleMarkerClick } = useMapInteractions();
  const { location: userLocation } = useUserLocation();

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center as LatLngExpression}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        maxBounds={MAP_CONFIG.bounds}
        maxBoundsViscosity={0.8}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
      >
        <TileLayer
          attribution={MAP_CONFIG.attribution}
          url={MAP_CONFIG.tileLayer}
        />

        {/* Map event handler */}
        <MapEventHandler />

        {/* User location marker */}
        {userLocation && (
          <UserLocationMarker position={[userLocation.lat, userLocation.lng]} />
        )}

        {/* Issue markers */}
        {filteredIssues.map((issue) => {
          const [lng, lat] = issue.location.coordinates;
          const icon = createCustomIcon(issue.type);

          return (
            <Marker
              key={issue._id}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{
                click: () => handleMarkerClick(issue._id),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 mb-1">{issue.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      issue.status === 'reported' ? 'bg-yellow-100 text-yellow-800' :
                      issue.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {issue.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-gray-500">
                      {getIssueTypeConfig(issue.type).label}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
