import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { MapPin, AlertCircle, ChevronDown, Plus, X } from 'lucide-react';
import { MediaUploader } from '../media/MediaUploader';

const HISTORICAL_PERIODS = [
  '1700s', '1800s', '1900s',
  'Pre-Colonial', 'Colonial', 'Territorial',
  'Statehood', 'Modern'
];

const AVAILABLE_TAGS = [
  'military', 'industry', 'natural', 'settlement',
  'native', 'maritime', 'archaeology', 'architecture',
  'cultural', 'transportation', 'agriculture'
];

export default function LocationEditorModal({ location, open, onClose }) {
  const [formData, setFormData] = useState(location || {
    name: '',
    coordinates: { lat: '', lng: '' },
    shortDescription: '',
    historicalPeriods: [],
    tags: [],
    photos: []
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  console.log('LocationEditorModal render:', { location, open, formData });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/locations/${location?.id || ''}`, {
        method: location ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save location');
      }

      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSaving(false);
    }
  };

  const addPeriod = (period) => {
    if (!formData.historicalPeriods.includes(period)) {
      setFormData(prev => ({
        ...prev,
        historicalPeriods: [...prev.historicalPeriods, period]
      }));
    }
  };

  const removePeriod = (periodToRemove) => {
    setFormData(prev => ({
      ...prev,
      historicalPeriods: prev.historicalPeriods.filter(period => period !== periodToRemove)
    }));
  };

  const addTag = (tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {location ? 'Edit Location' : 'New Location'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.shortDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                rows={3}
              />
              {errors.shortDescription && (
                <p className="text-sm text-red-500">{errors.shortDescription}</p>
              )}
            </div>

            {/* Coordinates */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Coordinates</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setFormData(prev => ({
                            ...prev,
                            coordinates: {
                              lat: position.coords.latitude,
                              lng: position.coords.longitude
                            }
                          }));
                        },
                        (error) => {
                          setErrors(prev => ({ ...prev, coordinates: error.message }));
                        }
                      );
                    }
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Get Current Location
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={formData.coordinates.lat}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      coordinates: { ...prev.coordinates, lat: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={formData.coordinates.lng}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      coordinates: { ...prev.coordinates, lng: e.target.value }
                    }))}
                  />
                </div>
              </div>
              {errors.coordinates && (
                <p className="text-sm text-red-500">{errors.coordinates}</p>
              )}
            </div>

            {/* Historical Periods */}
            <div className="space-y-2">
              <Label>Historical Periods</Label>
              <div className="flex flex-wrap gap-2">
                {formData.historicalPeriods.map((period) => (
                  <Badge
                    key={period}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removePeriod(period)}
                  >
                    {period}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Period
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {HISTORICAL_PERIODS
                      .filter(period => !formData.historicalPeriods.includes(period))
                      .map(period => (
                        <DropdownMenuItem
                          key={period}
                          onClick={() => addPeriod(period)}
                        >
                          {period}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tag
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {AVAILABLE_TAGS
                      .filter(tag => !formData.tags.includes(tag))
                      .map(tag => (
                        <DropdownMenuItem
                          key={tag}
                          onClick={() => addTag(tag)}
                        >
                          {tag}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

          </div>

          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
