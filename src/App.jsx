import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import AddLocationButton from './components/AddLocationButton';
import Providers from './providers';

function App() {
  const [locations, setLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        console.log('Loaded locations:', data);
        setLocations(data.verified || []);
      })
      .catch(err => console.error('Failed to load locations:', err));
  }, []);

  const handleNewLocation = (location) => {
    setLocations(prevLocations => [...prevLocations, location]);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(newLocation);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get location: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  return (
    <Providers>
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header className="p-4 bg-white shadow-sm z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Historical Places Explorer</h1>
            <button
              onClick={getCurrentLocation}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Get Location
            </button>
          </div>
        </header>

        {/* Main content */}
        <main style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#f0f0f0' }}>
            <Map 
              locations={locations} 
              currentLocation={currentLocation} 
            />
          </div>

          {/* Add Location Button */}
          <div className="absolute bottom-4 right-4 z-10">
            <AddLocationButton 
              onLocationAdded={handleNewLocation}
              setCurrentLocation={setCurrentLocation}
            />
          </div>
        </main>

        {/* Footer with location info */}
        {currentLocation && (
          <footer className="p-4 bg-white border-t">
            <p className="font-bold">Latest Location:</p>
            <p>Lat: {currentLocation.lat.toFixed(6)}</p>
            <p>Lng: {currentLocation.lng.toFixed(6)}</p>
            <p>Time: {new Date().toLocaleString()}</p>
          </footer>
        )}
      </div>
    </Providers>
  );
}

export default App;