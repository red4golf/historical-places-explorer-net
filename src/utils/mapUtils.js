import mapboxgl from 'mapbox-gl';

export function getCoordinates(location) {
  console.log('Getting coordinates for:', location);

  if (!location) {
    console.warn('Location is null or undefined');
    return null;
  }

  // Direct coordinates format
  if (location.coordinates?.lat && location.coordinates?.lng) {
    console.log('Using direct coordinates:', location.coordinates);
    return {
      lng: Number(location.coordinates.lng),
      lat: Number(location.coordinates.lat)
    };
  }

  // Nested coordinates format
  if (location.location?.coordinates?.lat && location.location?.coordinates?.lng) {
    console.log('Using nested coordinates:', location.location.coordinates);
    return {
      lng: Number(location.location.coordinates.lng),
      lat: Number(location.location.coordinates.lat)
    };
  }

  // Array format [lng, lat]
  if (Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    console.log('Using array coordinates:', location.coordinates);
    const [lng, lat] = location.coordinates;
    return {
      lng: Number(lng),
      lat: Number(lat)
    };
  }

  console.warn('No valid coordinates found for location:', location);
  return null;
}

export function calculateBounds(locations = [], currentLocation = null) {
  console.log('Calculating bounds for:', { locationCount: locations.length, hasCurrentLocation: !!currentLocation });
  
  if (!locations?.length && !currentLocation) {
    console.warn('No locations to calculate bounds');
    return null;
  }

  const bounds = new mapboxgl.LngLatBounds();
  let hasValidLocation = false;

  locations.forEach((location, index) => {
    const coords = getCoordinates(location);
    if (coords && !isNaN(coords.lng) && !isNaN(coords.lat)) {
      console.log(`Location ${index} coordinates:`, coords);
      bounds.extend([coords.lng, coords.lat]);
      hasValidLocation = true;
    }
  });

  if (currentLocation?.lng && currentLocation?.lat && 
      !isNaN(currentLocation.lng) && !isNaN(currentLocation.lat)) {
    console.log('Adding current location to bounds:', currentLocation);
    bounds.extend([currentLocation.lng, currentLocation.lat]);
    hasValidLocation = true;
  }

  return hasValidLocation ? bounds : null;
}

export function fitMapToBounds(map, bounds, padding = 50) {
  if (!map || !bounds) {
    console.warn('Missing map or bounds for fitMapToBounds');
    return;
  }

  try {
    if (!bounds.isEmpty()) {
      console.log('Fitting to bounds:', bounds);
      map.fitBounds(bounds, {
        padding: {
          top: padding,
          bottom: padding,
          left: padding,
          right: padding
        },
        maxZoom: 12
      });
    } else {
      console.warn('Empty bounds, skipping fitBounds');
    }
  } catch (error) {
    console.error('Error in fitMapToBounds:', error);
  }
}

export function zoomToLocation(map, location, zoom = 15) {
  if (!map || !location?.lng || !location?.lat) {
    console.warn('Invalid parameters for zoomToLocation');
    return;
  }
  
  try {
    console.log('Zooming to location:', location);
    map.flyTo({
      center: [Number(location.lng), Number(location.lat)],
      zoom: zoom,
      duration: 1000
    });
  } catch (error) {
    console.error('Error in zoomToLocation:', error);
  }
}