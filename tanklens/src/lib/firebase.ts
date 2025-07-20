import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { getDatabase, ref, get, child } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Only initialize Firebase if it hasn't been initialized already and if we have config values
let app: FirebaseApp;

if (!getApps().length) {
  if (!firebaseConfig.apiKey) {
    console.error('Firebase configuration error: Missing API key in environment variables');
    throw new Error('Firebase configuration is missing. Check your environment variables.');
  } else {
    app = initializeApp(firebaseConfig);
  }
} else {
  app = getApps()[0];
}

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

// Configure Google provider with additional scopes if needed
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Helper functions for device sharing
export const addDeviceAccess = async (deviceId: string, userId: string, accessType: 'owner' | 'viewer' = 'viewer') => {
  try {
    await setDoc(doc(db, 'device_access', `${deviceId}_${userId}`), {
      deviceId,
      userId,
      accessType,
      addedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error adding device access:', error);
    return false;
  }
};

export const getUserDevices = async (userId: string) => {
  try {
    const accessRef = collection(db, 'device_access');
    const accessQuery = query(accessRef, where('userId', '==', userId));
    const accessSnapshot = await getDocs(accessQuery);
    
    const deviceIds: string[] = [];
    accessSnapshot.forEach(doc => {
      const data = doc.data();
      deviceIds.push(data.deviceId);
    });
    
    return deviceIds;
  } catch (error) {
    console.error('Error getting user devices:', error);
    return [];
  }
};

// Function to check if device is online based on timestamp (30 second threshold)
export const isDeviceOnline = (timestamp: string): boolean => {
  try {
    // Convert Firebase timestamp (seconds) to milliseconds
    const deviceTime = parseInt(timestamp) * 1000;
    const now = Date.now();
    const timeDiff = now - deviceTime;
    
    // Device is online if last update was within 30 seconds
    return timeDiff <= 30000;
  } catch (error) {
    console.error('Error checking device online status:', error);
    return false;
  }
};

// Function to fetch real-time sensor data from Firebase Realtime Database
export const fetchRealTimeSensorData = async (deviceId: string) => {
  try {
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("User not authenticated for real-time data fetch");
      return null;
    }

    // Wait for authentication token
    await currentUser.getIdToken();

    const dbRef = ref(realtimeDb);
    const snapshot = await get(child(dbRef, deviceId));
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const deviceTimestamp = data.timestamp;
      const isOnline = isDeviceOnline(deviceTimestamp);
      
      return {
        timestamp: new Date().toISOString(),
        level: data.waterLevel || 0,
        distance: data.distance || 0,
        status: isOnline ? (data.status || 'measured') : 'offline',
        lastUpdated: new Date(parseInt(deviceTimestamp) * 1000).toISOString(),
        isOnline: isOnline,
        interval: data.interval || 30000
      };
    } else {
      console.log("No data available for device:", deviceId);
      return {
        timestamp: new Date().toISOString(),
        level: 0,
        distance: 0,
        status: 'offline',
        lastUpdated: new Date().toISOString(),
        isOnline: false,
        interval: 30000
      };
    }
  } catch (error) {
    console.error('Error fetching real-time sensor data:', error);
    
    // Return offline status instead of mock data
    return {
      timestamp: new Date().toISOString(),
      level: 0,
      distance: 0,
      status: 'offline',
      lastUpdated: new Date().toISOString(),
      isOnline: false,
      interval: 30000
    };
  }
};

// Function to delete a device and all associated data
export const deleteDevice = async (deviceId: string, userId: string) => {
  try {
    // Delete the device document
    await deleteDoc(doc(db, 'devices', deviceId));
    
    // Delete the device access record
    await deleteDoc(doc(db, 'device_access', `${deviceId}_${userId}`));
    
    console.log(`Device ${deviceId} deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting device:', error);
    return false;
  }
};

export { auth, db, realtimeDb, googleProvider };