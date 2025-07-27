'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { TankLevelDisplay, SensorDevice, fetchSensorData } from '@/components/TankLevelDisplay';
import { DeviceForm } from '@/components/DeviceForm';
import { auth, db, getUserDevices, fetchRealTimeSensorData, deleteDevice } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, getDocs } from 'firebase/firestore';
import { PlusIcon, UserCircleIcon, ShareIcon, TrashIcon } from '@heroicons/react/24/outline';

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
  const [deleteModalDevice, setDeleteModalDevice] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
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

  // Auto-refresh devices every 5 seconds
  useEffect(() => {
    if (!user || !autoRefreshEnabled) return;

    const autoRefreshInterval = setInterval(() => {
      loadDevices(user.uid);
      setLastRefreshTime(new Date().toLocaleTimeString());
    }, 5000); // 5 seconds

    return () => clearInterval(autoRefreshInterval);
  }, [user, autoRefreshEnabled]);

  // Handle visibility change to pause/resume auto-refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAutoRefreshEnabled(false);
      } else {
        setAutoRefreshEnabled(true);
        // Immediately refresh when page becomes visible
        if (user) {
          loadDevices(user.uid);
          setLastRefreshTime(new Date().toLocaleTimeString());
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

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
          
          // Fetch current real-time data from Firebase Realtime Database
          let currentData = null;
          try {
            currentData = await fetchRealTimeSensorData(deviceId);
          } catch (error) {
            console.log(`Could not fetch real-time data for ${deviceId}:`, error);
          }
          
          // Get historical data from Firestore (synced every 10 minutes)
          let historicalData = data.data || [];
          
          // Fetch additional historical data from Firestore history subcollection
          try {
            const historyRef = collection(db, 'devices', deviceId, 'history');
            const historyQuery = query(historyRef);
            const historySnapshot = await getDocs(historyQuery);
            
            const historyData: any[] = [];
            historySnapshot.forEach((doc) => {
              const historyItem = doc.data();
              historyData.push({
                timestamp: historyItem.timestamp,
                level: historyItem.level,
                status: 'measured'
              });
            });
            
            // Sort by timestamp and combine with existing data
            const allData = [...historicalData, ...historyData];
            const uniqueData = allData.filter((item, index, self) => 
              index === self.findIndex((t) => 
                new Date(t.timestamp).getTime() === new Date(item.timestamp).getTime()
              )
            );
            
            // Sort by timestamp
            historicalData = uniqueData.sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          } catch (error) {
            console.log(`Could not fetch historical data for ${deviceId}:`, error);
          }
          
          // Add current real-time data as the latest reading
          if (currentData) {
            const currentReading = {
              timestamp: currentData.timestamp,
              level: Math.round(currentData.level * 10) / 10,
              status: currentData.status
            };
            
            // Add current reading if it's not already the latest
            const lastReading = historicalData[historicalData.length - 1];
            if (!lastReading || 
                new Date(currentReading.timestamp).getTime() > new Date(lastReading.timestamp).getTime()) {
              historicalData = [...historicalData, currentReading];
            }
          }
          
          devicesList.push({
            id: deviceId,
            name: data.name,
            location: data.location,
            maxCapacity: data.maxCapacity,
            data: historicalData,
            lastUpdated: currentData?.lastUpdated || data.lastUpdated
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

  const handleDeleteDevice = async () => {
    if (!deleteModalDevice || !user) return;
    
    setDeleteLoading(true);
    
    try {
      const success = await deleteDevice(deleteModalDevice, user.uid);
      
      if (success) {
        // Remove device from local state
        setDevices(prevDevices => 
          prevDevices.filter(device => device.id !== deleteModalDevice)
        );
        setDeleteModalDevice(null);
      } else {
        console.error('Failed to delete device');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
    } finally {
      setDeleteLoading(false);
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
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
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
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">Your Water Tanks</h1>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs text-foreground/60">
                  {autoRefreshEnabled ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                </span>
              </div>
            </div>
            <p className="text-foreground/70">
              Monitor your water levels in real-time
              {lastRefreshTime && (
                <span className="text-xs ml-2">• Last updated: {lastRefreshTime}</span>
              )}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                autoRefreshEnabled 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {autoRefreshEnabled ? '⏸️ Pause' : '▶️ Resume'} Auto-refresh
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add New Device
            </button>
          </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
                {devices.map((device) => (
                  <div key={device.id} className="relative">
                    <div className="absolute top-3 right-3 flex gap-2 z-10">
                      <button 
                        onClick={() => setShareModalDevice(device.id)}
                        className="p-2 rounded-lg bg-card/80 backdrop-blur-sm hover:bg-secondary/80 transition-all duration-200 border border-border/50"
                        title="Share this device"
                      >
                        <ShareIcon className="h-4 w-4 text-primary" />
                      </button>
                      <button 
                        onClick={() => setDeleteModalDevice(device.id)}
                        className="p-2 rounded-lg bg-card/80 backdrop-blur-sm hover:bg-destructive/10 transition-all duration-200 border border-border/50"
                        title="Delete this device"
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
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
      
      {/* Delete Device Modal */}
      {deleteModalDevice && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">Delete Device</h3>
            <p className="text-sm text-foreground/70 mb-6">
              Are you sure you want to delete this device? This action cannot be undone and will remove all associated data.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalDevice(null)}
                className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDevice}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Device'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav isAuthenticated={!!user} />
    </div>
  );
}