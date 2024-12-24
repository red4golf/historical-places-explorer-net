import mapboxgl from 'mapbox-gl';

export function calculateBounds(locations, currentLocation = null) {
    const bounds = new mapboxgl.LngLatBounds();
    
    // Add location markers to bounds
    locations.forEach(location => {
        if (location.coordinates) {
            bounds.extend([location.coordinates.lng, location.coordinates.lat]);
        }
    });

    // Add current location to bounds if available
    if (currentLocation) {
        bounds.extend([currentLocation.lng, currentLocation.lat]);
    }

    return bounds;
}

export function fitMapToBounds(map, bounds, padding = 50) {
    if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
            padding,
            maxZoom: 15,
            duration: 1000
        });
    }
}

export function zoomToLocation(map, location, zoom = 15) {
    if (!location) return;
    
    map.flyTo({
        center: [location.lng, location.lat],
        zoom: zoom,
        duration: 1000
    });
}