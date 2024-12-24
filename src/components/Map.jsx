import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LocationDetailModal from './LocationDetailModal';
import { calculateBounds, fitMapToBounds, zoomToLocation } from '../utils/mapUtils';

mapboxgl.accessToken = 'pk.eyJ1IjoiY2VpbmFyc29uIiwiYSI6ImNtNGEybmN0ajAzOWQycXE1M2VibWNiZjkifQ.7JrNDHO9geEP_L9UT4hGgg';

const Map = ({ locations, currentLocation }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Helper function to get coordinates from a location object
  const getCoordinates = (location) => {
    if (location.coordinates) {
      return location.coordinates;
    }
    if (location.location && location.location.coordinates) {
      return location.location.coordinates;
    }
    return null;
  };

  // Helper function to get name from a location object
  const getName = (location) => {
    if (typeof location.name === 'string') {
      return location.name;
    }
    if (location.name && location.name.current) {
      return location.name.current;
    }
    return 'Unnamed Location';
  };

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    try {
      console.log('Initializing map...');
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-98.5795, 39.8283], // Center of US
        zoom: 3
      });

      map.current.addControl(new mapboxgl.NavigationControl());
      
      // Initial bounds fitting if locations exist
      if (locations?.length) {
        const bounds = calculateBounds(locations);
        map.current.on('load', () => {
          fitMapToBounds(map.current, bounds);
        });
      }
      
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!map.current || !locations) return;

    console.log('Updating location markers...', locations);

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for all locations
    locations.forEach(location => {
      const coords = getCoordinates(location);
      if (!coords) return;

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div>
          <h3 class="font-bold">${getName(location)}</h3>
          <p class="text-sm">${location.shortDescription || location.content?.summary || ''}</p>
          <button 
            onclick="window.showLocationDetails('${location.id}')"
            class="mt-2 text-sm text-blue-600 hover:underline"
          >
            View Details
          </button>
        </div>
      `);

      const marker = new mapboxgl.Marker()
        .setLngLat([coords.lng, coords.lat])
        .setPopup(popup)
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Fit map to all locations
    const bounds = calculateBounds(locations, currentLocation);
    fitMapToBounds(map.current, bounds);

    // Add global handler for the "View Details" button
    window.showLocationDetails = (locationId) => {
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        setSelectedLocation(location);
      }
    };
  }, [locations]);

  // Update current location marker and zoom
  useEffect(() => {
    if (!map.current || !currentLocation) return;

    console.log('Setting current location:', currentLocation);

    try {
      // Remove existing current location marker
      const currentMarker = markers.current.find(m => m._isCurrentLocation);
      if (currentMarker) {
        currentMarker.remove();
        markers.current = markers.current.filter(m => !m._isCurrentLocation);
      }

      // Add new marker for current location
      const marker = new mapboxgl.Marker({ color: '#FF0000' })
        .setLngLat([currentLocation.lng, currentLocation.lat])
        .addTo(map.current);
      
      // Tag this marker as current location
      marker._isCurrentLocation = true;
      markers.current.push(marker);

      // Zoom to current location
      zoomToLocation(map.current, currentLocation);
    } catch (error) {
      console.error('Error updating current location:', error);
    }
  }, [currentLocation]);

  return (
    <>
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
        style={{ 
          minHeight: '400px',
          width: '100%',
          height: '100%'
        }} 
      />
      {selectedLocation && (
        <LocationDetailModal 
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </>
  );
};

export default Map;