import React, { useState, useEffect } from 'react';
import { AlertCircle, Trash2, Edit2, MapPin, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import DeleteLocationDialog from './DeleteLocationDialog';
import LocationEditorModal from './admin/LocationEditorModal';

const LocationManager = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/locations');
      if (!response.ok) throw new Error('Failed to load locations');
      const data = await response.json();
      console.log('Loaded locations:', data);
      setLocations(data);
      setError(null);
    } catch (err) {
      console.error('Load error:', err);
      setError('Failed to load locations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (location) => {
    console.log('Delete initiated for location:', location);
    setLocationToDelete(location);
    setShowDeleteDialog(true);
    setError(null);
  };

  const handleEdit = (location) => {
    console.log('Opening edit modal for location:', location);
    setEditingLocation(location);
    setEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditingLocation(null);
    setEditModalOpen(false);
  };

  const handleSaveEdit = async () => {
    await loadLocations();
    handleCloseEdit();
  };

  const handleCancelDelete = () => {
    setLocationToDelete(null);
    setShowDeleteDialog(false);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!locationToDelete?.id) {
      console.error('No location selected for deletion or missing ID');
      setError('Cannot delete: Invalid location data');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/locations/${locationToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete location');
      }

      setLocations(prev => prev.filter(loc => loc.id !== locationToDelete.id));
      setDeleteSuccess(`Successfully deleted "${locationToDelete.name}"`);
      setShowDeleteDialog(false);
      setLocationToDelete(null);

      // Refresh locations after a delay
      setTimeout(loadLocations, 1500);
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete location: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewMap = (location) => {
    console.log('View location on map:', location);
  };

  if (loading) return <div className="p-4">Loading locations...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Locations</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {deleteSuccess && (
        <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{deleteSuccess}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {locations.map((location, index) => (
          <div key={location.id || index} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">
                  {typeof location.name === 'string' ? location.name : location.name.current}
                </h3>
                <p className="text-gray-600 mt-1">
                  {location.shortDescription || (location.content && location.content.summary)}
                </p>
                <div className="mt-2 text-sm text-gray-500">
                  ID: {location.id || 'None'}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Status: {location.isDraft ? 'Draft' : 'Verified'}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Coordinates: {location.coordinates ? 
                    `${location.coordinates.lat.toFixed(6)}, ${location.coordinates.lng.toFixed(6)}` :
                    `${location.location?.coordinates.lat.toFixed(6)}, ${location.location?.coordinates.lng.toFixed(6)}`
                  }
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewMap(location)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  View Map
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(location)}
                  className="text-green-600 hover:text-green-800 hover:bg-green-50"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(location)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Dialog */}
      <DeleteLocationDialog
        location={locationToDelete}
        isOpen={showDeleteDialog}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={error}
      />

      {/* Edit Modal */}
      <LocationEditorModal
        open={editModalOpen}
        onClose={handleCloseEdit}
        location={editingLocation}
      />
    </div>
  );
};

export default LocationManager;