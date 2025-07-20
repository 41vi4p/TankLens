'use client';

import { useState } from 'react';
import { db, addDeviceAccess } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { SensorDevice } from './TankLevelDisplay';

type DeviceFormProps = {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function DeviceForm({ userId, onSuccess, onCancel }: DeviceFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    maxCapacity: 1000,
    deviceId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'create' | 'link'>('create');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxCapacity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.deviceId) {
      setError('Device ID is required');
      return;
    }

    if (mode === 'create' && (!formData.name || !formData.location)) {
      setError('All fields are required for new devices');
      return;
    }

    if (mode === 'create' && formData.maxCapacity <= 0) {
      setError('Capacity must be greater than 0');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Check if device already exists in system
      const deviceRef = doc(db, 'devices', formData.deviceId);
      const deviceSnap = await getDoc(deviceRef);
      
      if (mode === 'link') {
        // If linking, ensure the device exists
        if (!deviceSnap.exists()) {
          setError('Device ID not found. Please verify the ID or create a new device.');
          setIsSubmitting(false);
          return;
        }

        // Add access for this user
        await addDeviceAccess(formData.deviceId, userId, 'viewer');
      } else {
        // If creating, ensure device doesn't already exist
        if (deviceSnap.exists()) {
          setError('Device ID already exists. You can link to it instead.');
          setIsSubmitting(false);
          return;
        }
        
        // Create a new device document in central Firestore collection
        const newDevice: Omit<SensorDevice, 'id'> = {
          name: formData.name,
          location: formData.location,
          maxCapacity: formData.maxCapacity,
          data: [{
            timestamp: new Date().toISOString(),
            level: 0
          }],
          lastUpdated: new Date().toISOString()
        };
        
        await setDoc(deviceRef, {
          ...newDevice,
          createdBy: userId,
          createdAt: new Date().toISOString()
        });
        
        // Add this user as the owner
        await addDeviceAccess(formData.deviceId, userId, 'owner');
      }
      
      onSuccess();
    } catch (err) {
      console.error('Error adding device:', err);
      setError('Failed to add device. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">{mode === 'create' ? 'Add New Device' : 'Link Existing Device'}</h2>
      
      <div className="mb-6 flex rounded-md overflow-hidden">
        <button
          onClick={() => setMode('create')}
          className={`flex-1 py-2 text-center ${mode === 'create' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
        >
          Create New
        </button>
        <button
          onClick={() => setMode('link')}
          className={`flex-1 py-2 text-center ${mode === 'link' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
        >
          Link Existing
        </button>
      </div>
      
      {error && (
        <div className="bg-error/10 border border-error text-error p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="deviceId" className="block text-sm font-medium mb-1">
              Device ID
            </label>
            <input
              type="text"
              id="deviceId"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleChange}
              className="w-full p-2 border border-border rounded-md bg-background"
              placeholder="ESP32_ABCD1234"
            />
            <p className="text-xs text-foreground/60 mt-1">
              This is the unique identifier for your IoT device
            </p>
          </div>
          
          {mode === 'create' && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Device Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-md bg-background"
                  placeholder="Kitchen Tank"
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-md bg-background"
                  placeholder="Kitchen"
                />
              </div>
              
              <div>
                <label htmlFor="maxCapacity" className="block text-sm font-medium mb-1">
                  Tank Capacity (Liters)
                </label>
                <input
                  type="number"
                  id="maxCapacity"
                  name="maxCapacity"
                  value={formData.maxCapacity}
                  onChange={handleChange}
                  min="1"
                  className="w-full p-2 border border-border rounded-md bg-background"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : mode === 'create' ? 'Add Device' : 'Link Device'}
          </button>
        </div>
      </form>
    </div>
  );
}