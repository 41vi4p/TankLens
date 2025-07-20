'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { auth, db, getUserDevices, deleteDevice } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  getDoc 
} from 'firebase/firestore';
import { 
  TrashIcon, 
  PencilSquareIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { SensorDevice } from '@/components/TankLevelDisplay';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<SensorDevice[]>([]);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [calibratingDevice, setCalibratingDevice] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    location: '',
    maxCapacity: 0
  });
  const [calibrationValue, setCalibrationValue] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadDevices(currentUser.uid);
      } else {
        router.push('/auth/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadDevices = async (userId: string) => {
    try {
      // Get all deviceIds this user has access to (same as dashboard)
      const deviceIds = await getUserDevices(userId);
      
      if (deviceIds.length === 0) {
        setDevices([]);
        return;
      }
      
      // Fetch each device data from central devices collection
      const devicesList: SensorDevice[] = [];
      
      for (const deviceId of deviceIds) {
        const deviceRef = doc(db, 'devices', deviceId);
        const deviceSnap = await getDoc(deviceRef);
        
        if (deviceSnap.exists()) {
          const data = deviceSnap.data();
          devicesList.push({
            id: deviceId,
            name: data.name,
            location: data.location,
            maxCapacity: data.maxCapacity,
            data: data.data || [],
            lastUpdated: data.lastUpdated
          });
        }
      }
      
      setDevices(devicesList);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      if (!user) return;
      
      // Use the same delete function as dashboard
      const success = await deleteDevice(deviceId, user.uid);
      
      if (success) {
        // Update local state
        setDevices(devices.filter(device => device.id !== deviceId));
        setDeleteConfirm(null);
      } else {
        console.error('Failed to delete device');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  const startEditing = (device: SensorDevice) => {
    setFormValues({
      name: device.name,
      location: device.location,
      maxCapacity: device.maxCapacity
    });
    setEditingDevice(device.id);
  };

  const startCalibrating = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (device && device.data.length > 0) {
      setCalibrationValue(device.data[device.data.length - 1].level);
    } else {
      setCalibrationValue(0);
    }
    setCalibratingDevice(deviceId);
  };

  const handleSaveEdit = async () => {
    try {
      if (!user || !editingDevice) return;
      
      // Validate form
      if (!formValues.name || !formValues.location || formValues.maxCapacity <= 0) {
        return;
      }
      
      // Update in central devices collection
      const deviceRef = doc(db, 'devices', editingDevice);
      await updateDoc(deviceRef, {
        name: formValues.name,
        location: formValues.location,
        maxCapacity: formValues.maxCapacity
      });
      
      // Update local state
      setDevices(devices.map(device => 
        device.id === editingDevice 
          ? { ...device, ...formValues } 
          : device
      ));
      
      setEditingDevice(null);
    } catch (error) {
      console.error('Error updating device:', error);
    }
  };

  const handleSaveCalibration = async () => {
    try {
      if (!user || !calibratingDevice) return;
      
      // Validate calibration value
      if (calibrationValue < 0 || calibrationValue > 100) {
        return;
      }
      
      const device = devices.find(d => d.id === calibratingDevice);
      if (!device) return;
      
      // Update the latest reading in central devices collection
      const deviceRef = doc(db, 'devices', calibratingDevice);
      
      // Get the latest data point and update it
      const updatedData = [...device.data];
      if (updatedData.length > 0) {
        updatedData[updatedData.length - 1] = {
          ...updatedData[updatedData.length - 1],
          level: calibrationValue
        };
      } else {
        // If no data points exist, create one
        updatedData.push({
          timestamp: new Date().toISOString(),
          level: calibrationValue
        });
      }
      
      await updateDoc(deviceRef, {
        data: updatedData,
        lastUpdated: new Date().toISOString()
      });
      
      // Update local state
      setDevices(devices.map(d => 
        d.id === calibratingDevice 
          ? { ...d, data: updatedData, lastUpdated: new Date().toISOString() } 
          : d
      ));
      
      setCalibratingDevice(null);
    } catch (error) {
      console.error('Error calibrating device:', error);
    }
  };

  const cancelEdit = () => {
    setEditingDevice(null);
  };

  const cancelCalibration = () => {
    setCalibratingDevice(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: name === 'maxCapacity' ? parseInt(value) || 0 : value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Header isAuthenticated={!!user} />
      
      <main className="flex-1 container mx-auto px-4 py-8 pt-24"> {/* Added pt-24 for fixed header spacing */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Device Settings</h1>
          <p className="text-foreground/70">
            Manage your IoT water level monitoring devices
          </p>
        </div>
        
        {devices.length === 0 ? (
          <div className="card text-center py-12">
            <h2 className="text-xl font-semibold mb-3">No Devices Added Yet</h2>
            <p className="text-foreground/70 mb-6">
              Add your first IoT water level monitoring device from the dashboard.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card bg-secondary/30 mb-6 p-4 flex items-start gap-3">
              <InformationCircleIcon className="h-6 w-6 flex-shrink-0 text-primary" />
              <div>
                <p className="text-sm">
                  Here you can manage your devices, update information, calibrate sensors, and remove devices 
                  you no longer use. Calibration helps ensure accurate water level readings.
                </p>
              </div>
            </div>
            
            {devices.map((device) => (
              <div key={device.id} className="card">
                {editingDevice === device.id ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Edit Device</h3>
                    
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Device Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formValues.name}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-border rounded-md bg-background"
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
                        value={formValues.location}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-border rounded-md bg-background"
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
                        value={formValues.maxCapacity}
                        onChange={handleInputChange}
                        min="1"
                        className="w-full p-2 border border-border rounded-md bg-background"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : calibratingDevice === device.id ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Calibrate Sensor</h3>
                    <p className="text-sm text-foreground/70">
                      Adjust the water level reading to match the actual level in your tank.
                    </p>
                    
                    <div>
                      <label htmlFor="calibration" className="block text-sm font-medium mb-1">
                        Current Water Level (%)
                      </label>
                      <input
                        type="number"
                        id="calibration"
                        value={calibrationValue}
                        onChange={(e) => setCalibrationValue(parseInt(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className="w-full p-2 border border-border rounded-md bg-background"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={cancelCalibration}
                        className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveCalibration}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Save Calibration
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{device.name}</h3>
                        <p className="text-sm text-foreground/70">{device.location}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => startEditing(device)}
                          className="p-2 rounded-full hover:bg-secondary transition-colors"
                          aria-label="Edit device"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => startCalibrating(device.id)}
                          className="p-2 rounded-full hover:bg-secondary transition-colors"
                          aria-label="Calibrate device"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(device.id)}
                          className="p-2 rounded-full hover:bg-error/10 text-error transition-colors"
                          aria-label="Delete device"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-foreground/70">Capacity</p>
                        <p className="font-bold">{device.maxCapacity} L</p>
                      </div>
                      <div>
                        <p className="text-sm text-foreground/70">Last Updated</p>
                        <p className="font-bold">
                          {new Date(device.lastUpdated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {deleteConfirm === device.id && (
                      <div className="mt-4 p-3 border border-error rounded-md bg-error/10">
                        <p className="text-sm text-error mb-3">
                          Are you sure you want to delete this device? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1 rounded-md border border-border bg-background hover:bg-secondary transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteDevice(device.id)}
                            className="px-3 py-1 rounded-md bg-error text-white hover:bg-error/90 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      
      <BottomNav isAuthenticated={!!user} />
    </div>
  );
}