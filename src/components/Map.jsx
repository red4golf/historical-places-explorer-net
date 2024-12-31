import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LocationDetailModal from './LocationDetailModal';
import { calculateBounds, fitMapToBounds, zoomToLocation, getCoordinates } from '../utils/mapUtils';

mapboxgl.accessToken = 'pk.eyJ1IjoiY2VpbmFyc29uIiwiYSI6ImNtNGEybmN0ajAzOWQycXE1M2VibWNiZjkifQ.7JrNDHO9geEP_L9UT4hGgg';

const Map = ({ locations = [], currentLocation }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const popup = useRef(null);

  // Initialize map
  useEffect(() => {
    console.log('Map container ref:', mapContainer.current);
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-122.5199, 47.6262], // Bainbridge Island
        zoom: 12
      });

      map.current.on('load', () => {
        console.log('Map loaded');
        setMapLoaded(true);
      });

      map.current.addControl(new mapboxgl.NavigationControl());

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Setup sources and layers when map is loaded
  useEffect(() => {
    if (!map.current || !mapLoaded) {
      console.log('Waiting for map to load...');
      return;
    }

    console.log('Setting up map sources and layers');
    try {
      // Add source
      map.current.addSource('locations', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Add layers
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'locations',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            10,
            '#f1f075',
            30,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            30,
            40
          ]
        }
      });

      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'locations',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'locations',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#2D60A3',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Add click handlers
      map.current.on('click', 'clusters', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        map.current.easeTo({
          center: features[0].geometry.coordinates,
          zoom: map.current.getZoom() + 2
        });
      });

      map.current.on('click', 'unclustered-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { id, title, description } = e.features[0].properties;

        if (popup.current) popup.current.remove();

        popup.current = new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="p-2">
              <h3 class="font-bold text-lg mb-2">${title}</h3>
              <p class="text-sm mb-4">${description}</p>
              <button 
                onclick="window.showLocationDetails('${id}')"
                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Read Story
              </button>
            </div>
          `)
          .addTo(map.current);
      });

    } catch (error) {
      console.error('Error setting up map layers:', error);
    }
  }, [mapLoaded]);

  // Update locations when they change
  useEffect(() => {
    if (!map.current || !mapLoaded || !locations.length) {
      console.log('Skipping location update:', { hasMap: !!map.current, mapLoaded, locationCount: locations.length });
      return;
    }

    console.log('Updating locations:', locations);
    try {
      const source = map.current.getSource('locations');
      if (!source) {
        console.error('Source not found');
        return;
      }

      const features = locations.map(location => {
        const coords = getCoordinates(location);
        console.log('Processing location:', location.id, coords);
        if (!coords) return null;

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [coords.lng, coords.lat]
          },
          properties: {
            id: location.id,
            title: typeof location.name === 'string' ? location.name : location.name?.current || '',
            description: location.content?.summary || '',
            hasStory: !!location.content?.stories?.length
          }
        };
      }).filter(Boolean);

      console.log('Setting features:', features);
      source.setData({
        type: 'FeatureCollection',
        features
      });

      // Fit map to bounds
      const bounds = calculateBounds(locations);
      if (bounds) {
        fitMapToBounds(map.current, bounds);
      }
    } catch (error) {
      console.error('Error updating locations:', error);
    }
  }, [locations, mapLoaded]);

  // Handle story details
  useEffect(() => {
    window.showLocationDetails = (locationId) => {
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        setSelectedLocation(location);
        if (popup.current) popup.current.remove();
      }
    };

    return () => {
      delete window.showLocationDetails;
    };
  }, [locations]);

  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#e5e7eb'
    }}>
      <div 
        ref={mapContainer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />
      {selectedLocation && (
        <LocationDetailModal 
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
};

export default Map;