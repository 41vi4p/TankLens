'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { TankLevelDisplay, SensorDevice, fetchSensorData } from '@/components/TankLevelDisplay';
import { DeviceForm } from '@/components/DeviceForm';
import { auth, db, getUserDevices } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { PlusIcon, UserCircleIcon, ShareIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<SensorDevice[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [shareModalDevice, setShareModalDevice] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');
  
  // Function to generate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get user's first name from display name
  const getFirstName = (displayName: string) => {
    if (!displayName) return "";
    return displayName.split(" ")[0];
  };

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
      // Get all deviceIds this user has access to
      const deviceIds = await getUserDevices(userId);
      
      if (deviceIds.length === 0) {
        setDevices([]);
        return;
      }
      
      // Fetch each device data
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

  const handleRefreshData = async (deviceId: string) => {
    try {
      if (!user) return;
      
      // Fetch new data from IoT device
      const newData = await fetchSensorData(deviceId);
      
      if (!newData) return;
      
      // Find the device to update
      const deviceIndex = devices.findIndex(device => device.id === deviceId);
      if (deviceIndex === -1) return;
      
      // Update the device data in Firestore (now in central devices collection)
      const deviceRef = doc(db, 'devices', deviceId);
      await updateDoc(deviceRef, {
        data: arrayUnion(newData),
        lastUpdated: new Date().toISOString()
      });
      
      // Update the local state
      const updatedDevices = [...devices];
      updatedDevices[deviceIndex] = {
        ...updatedDevices[deviceIndex],
        data: [...updatedDevices[deviceIndex].data, newData],
        lastUpdated: new Date().toISOString()
      };
      
      setDevices(updatedDevices);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleAddDeviceSuccess = () => {
    setShowAddForm(false);
    if (user) {
      loadDevices(user.uid);
    }
  };

  const handleShareDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareModalDevice || !shareEmail || !user) return;
    
    setShareLoading(true);
    setShareError('');
    setShareSuccess('');
    
    try {
      // In a real app, you would implement this to:
      // 1. Check if the email exists in your user system
      // 2. Get the userId for the email
      // 3. Add device access for that userId
      
      // For this demo, we'll just show a success message
      setShareSuccess(`Device shared with ${shareEmail} successfully!`);
      setShareEmail('');
      
      // In a real implementation, add this:
      // const userRecord = await findUserByEmail(shareEmail);
      // if (userRecord) {
      //   await addDeviceAccess(shareModalDevice, userRecord.uid, 'viewer');
      // }
    } catch (error) {
      console.error('Error sharing device:', error);
      setShareError('Failed to share device. Please try again.');
    } finally {
      setShareLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!user} />
      
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        {/* User greeting section */}
        {user && user.displayName && (
          <div className="mb-6 bg-secondary/30 rounded-lg p-4 flex items-center">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {getGreeting()}, {getFirstName(user.displayName)}!
              </h2>
              <p className="text-sm text-foreground/70">
                Welcome to your TankLens dashboard
              </p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Water Tanks</h1>
            <p className="text-foreground/70">
              Monitor your water levels in real-time
            </p>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 md:mt-0 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add New Device
          </button>
        </div>

        {showAddForm ? (
          <DeviceForm 
            userId={user.uid} 
            onSuccess={handleAddDeviceSuccess} 
            onCancel={() => setShowAddForm(false)} 
          />
        ) : (
          <div>
            {devices.length === 0 ? (
              <div className="card text-center py-12">
                <h2 className="text-xl font-semibold mb-3">No Devices Added Yet</h2>
                <p className="text-foreground/70 mb-6">
                  Add your first IoT water level monitoring device to get started.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Device
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => (
                  <div key={device.id} className="relative">
                    <button 
                      onClick={() => setShareModalDevice(device.id)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background shadow-sm z-10"
                      title="Share this device"
                    >
                      <ShareIcon className="h-5 w-5 text-primary" />
                    </button>
                    <TankLevelDisplay 
                      device={device} 
                      onRefresh={handleRefreshData} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Share Device Modal */}
      {shareModalDevice && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Share Device</h3>
            <p className="text-sm text-foreground/70 mb-4">
              Enter the email address of the person you want to share this device with.
            </p>
            
            {shareSuccess && (
              <div className="bg-success/10 border border-success text-success p-3 rounded-md mb-4">
                {shareSuccess}
              </div>
            )}
            
            {shareError && (
              <div className="bg-error/10 border border-error text-error p-3 rounded-md mb-4">
                {shareError}
              </div>
            )}
            
            <form onSubmit={handleShareDevice}>
              <div className="mb-4">
                <label htmlFor="shareEmail" className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="shareEmail"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background"
                  placeholder="user@example.com"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShareModalDevice(null);
                    setShareEmail('');
                    setShareError('');
                    setShareSuccess('');
                  }}
                  className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  disabled={shareLoading}
                >
                  {shareLoading ? 'Sharing...' : 'Share Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}